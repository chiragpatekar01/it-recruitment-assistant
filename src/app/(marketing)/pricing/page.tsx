import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/icons";
import { PLANS, inr } from "@/lib/plans";

export const metadata: Metadata = { title: "Pricing" };

const FAQ = [
  ["How does the free trial work?", "You get 14 days with every feature and no card. When the trial ends, choose a plan to keep screening. Your jobs and candidates stay in place."],
  ["How do payments work?", "Plans are billed monthly through Razorpay. You can pay by card, UPI AutoPay or e-mandate. Prices exclude GST."],
  ["What counts as a resume screen?", "Each resume analysed against a job counts once. Editing a candidate's evidence or score afterwards is free."],
  ["Can I cancel?", "Yes. Cancel any time from Settings → Billing. You keep access until the end of the period you've paid for."],
  ["Do you store resumes?", "No. Only the extracted screening profile is saved: skills, evidence, experience and the details recruiters need. Personal details such as age, gender and photos are ignored."],
];

export default function Pricing() {
  const plans = [PLANS.starter, PLANS.growth, PLANS.enterprise];
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-extrabold">Simple monthly pricing</h1>
        <p className="mt-2 text-muted">Start with a 14-day free trial. Upgrade when your team is ready.</p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className={`panel ${p.id === "growth" ? "border-accent ring-1 ring-accent" : ""}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{p.name}</h2>
              {p.id === "growth" && <span className="pill bg-accent-soft text-accent">Most popular</span>}
            </div>
            <p className="text-[13px] text-muted">{p.blurb}</p>
            <p className="text-3xl font-extrabold tabular">{p.priceInr === null ? "Custom" : inr(p.priceInr)}<span className="text-sm font-medium text-muted">{p.priceInr === null ? "" : " / month + GST"}</span></p>
            <ul className="flex flex-col gap-1.5 text-[13.5px]">
              {p.features.map((f) => <li key={f} className="flex items-start gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 text-good" />{f}</li>)}
            </ul>
            <Link href={p.id === "enterprise" ? "mailto:[sales email]" : "/signup"} className={`${p.id === "growth" ? "btn-primary" : "btn"} mt-auto`}>
              {p.id === "enterprise" ? "Contact sales" : "Start free trial"}
            </Link>
          </div>
        ))}
      </div>
      <section className="mt-14 max-w-3xl">
        <h2 className="text-xl font-bold">Questions</h2>
        <div className="mt-4 flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group px-4 py-3">
              <summary className="cursor-pointer list-none font-semibold">{q}</summary>
              <p className="mt-2 text-[13.5px] text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
