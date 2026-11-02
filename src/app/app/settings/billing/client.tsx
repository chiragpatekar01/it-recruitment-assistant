"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type RzpResponse = { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string };
declare global {
  interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, f: (r: { error?: { description?: string } }) => void) => void } }
}

function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => res(); s.onerror = () => rej(new Error("Couldn't load Razorpay checkout. Check your connection and try again."));
    document.body.appendChild(s);
  });
}

export function CheckoutButton({ plan, label, primary }: { plan: string; label: string; primary?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true); setError(null);
    try {
      await loadCheckout();
      const res = await fetch("/api/billing/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      const rzp = new window.Razorpay!({
        key: d.keyId, subscription_id: d.subscriptionId, name: d.orgName, description: `${label.replace("Choose ", "")} plan, monthly`,
        prefill: { name: d.name, email: d.email }, theme: { color: "#1D6B56" },
        handler: async (r: RzpResponse) => {
          const v = await fetch("/api/billing/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(r) });
          const vd = await v.json().catch(() => ({}));
          if (!v.ok) setError(vd.error || "Payment received but not verified yet. Refresh in a minute.");
          router.refresh(); setBusy(false);
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on("payment.failed", (r) => { setError(r.error?.description || "Payment failed. Try another method."); setBusy(false); });
      rzp.open();
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" className={`${primary ? "btn-primary" : "btn"} w-full`} disabled={busy} onClick={go}>{busy ? "Opening checkout…" : label}</button>
      {error && <p role="alert" className="text-[12.5px] text-bad">{error}</p>}
    </div>
  );
}

export function CancelButton() {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-1.5">
      <button type="button" className="btn-danger" disabled={busy} onBlur={() => setArmed(false)} onClick={async () => {
        if (!armed) { setArmed(true); return; }
        setBusy(true);
        const r = await fetch("/api/billing/cancel", { method: "POST" });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) setError(d.error || "Couldn't cancel."); else router.refresh();
        setBusy(false); setArmed(false);
      }}>{busy ? "Cancelling…" : armed ? "Confirm: cancel at period end" : "Cancel subscription"}</button>
      {error && <p role="alert" className="text-[12.5px] text-bad">{error}</p>}
    </div>
  );
}
