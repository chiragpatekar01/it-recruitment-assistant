import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

const API = "https://api.razorpay.com/v1";

function auth() {
  const id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) throw new Error("Billing isn't configured yet. Set the Razorpay keys on the server.");
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

async function call<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(API + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { authorization: auth(), "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Razorpay error", res.status, JSON.stringify(data).slice(0, 400));
    throw new Error(data?.error?.description || "The payment provider returned an error. Try again.");
  }
  return data as T;
}

export interface RzpSubscription { id: string; status: string; plan_id: string; current_end: number | null; short_url?: string; notes?: Record<string, string> }

/** Monthly subscription for 10 years of cycles (Razorpay requires a cycle count). */
export const createSubscription = (planId: string, notes: Record<string, string>) =>
  call<RzpSubscription>("/subscriptions", { plan_id: planId, total_count: 120, quantity: 1, customer_notify: true, notes });

export const fetchSubscription = (id: string) => call<RzpSubscription>(`/subscriptions/${id}`);

/** Cancels at the end of the current billing cycle, so the customer keeps what they paid for. */
export const cancelSubscription = (id: string) => call<RzpSubscription>(`/subscriptions/${id}/cancel`, { cancel_at_cycle_end: 1 });

const safeEq = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** Checkout success: HMAC-SHA256(payment_id + "|" + subscription_id) with the key secret. */
export function verifyCheckout(paymentId: string, subscriptionId: string, signature: string) {
  const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "").update(`${paymentId}|${subscriptionId}`).digest("hex");
  return safeEq(expected, signature);
}

/** Webhook: HMAC-SHA256 of the raw body with the webhook secret, sent as X-Razorpay-Signature. */
export function verifyWebhook(rawBody: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEq(expected, signature);
}
