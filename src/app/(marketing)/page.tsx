import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";

const FEATURES = [
  { icon: "brief", t: "JD analysis", d: "Paste a job description. Get must-have and nice-to-have skills, experience, budget, notice period and questions for the hiring manager." },
  { icon: "search", t: "Boolean sourcing", d: "Ready-to-run search strings for LinkedIn and Naukri, Google X-ray strings, alternative titles and technology combinations." },
  { icon: "scan", t: "Evidence-based screening", d: "Upload a PDF or Word resume. Every skill is graded hands-on, listed only, related or missing, with the line from the resume that proves it." },
  { icon: "chart", t: "Transparent match score", d: "A fixed, weighted score with a line-by-line breakdown. Recruiters can correct any grade and the score updates instantly." },
  { icon: "code", t: "Technical question bank", d: "Basic, intermediate and advanced questions per skill, plus role scenarios, each with what a good answer mentions and red flags." },
  { icon: "users", t: "Hiring pipeline", d: "Track every candidate from sourced to joined, with stage filters, comparison view, notes and a status report for your client." },
  { icon: "mail", t: "Candidate communication", d: "Ten professional email drafts, from first outreach to offer and rejection, filled in from the job and candidate." },
  { icon: "shield", t: "Fair and private by design", d: "Age, gender, photos and other personal details are ignored and never scored. Only the screening profile is stored, not the resume." },
];

export default function Landing() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-10 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr]">
        <div className="flex flex-col gap-5">
          <span className="w-fit rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">For IT recruitment teams and agencies</span>
          <h1 className="text-[2.4rem] font-extrabold leading-[1.1] sm:text-5xl">Shortlist IT candidates on evidence, not guesswork.</h1>
          <p className="max-w-[56ch] text-[16px] text-muted">
            Turn a job description into requirements, sourcing strings and interview questions in a minute. Screen resumes skill by skill with a score your hiring manager can actually check.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/signup" className="btn-primary px-5 py-2.5 text-[14px]">Start 14-day free trial</Link>
            <Link href="/pricing" className="btn px-5 py-2.5 text-[14px]">See pricing</Link>
          </div>
          <p className="text-xs text-muted">No card needed for the trial. The final hiring decision always stays with your recruiters.</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_20px_50px_rgba(20,28,36,.12)]">
          <Image src="/product.png" alt="Candidate pipeline with match scores, stages and sources (sample data)" width={1392} height={700} priority className="h-auto w-full" />
        </div>
      </section>

      <section id="features" className="border-t border-line bg-page/60">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold">Every stage of IT hiring, in one workspace</h2>
          <p className="mt-2 max-w-[60ch] text-muted">From the first JD to the joining date, each step follows the same structured workflow, so every recruiter on your team works the same way.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.t} className="panel gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent-soft text-accent"><Icon name={f.icon} /></span>
                <h3 className="text-[15px] font-bold">{f.t}</h3>
                <p className="text-[13px] text-muted">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold">A score you can explain to a hiring manager</h2>
          <p className="text-muted">AI reads the resume and collects the evidence. The score itself is fixed arithmetic, so the same evidence always gives the same result, and every point is traceable.</p>
          <ul className="mt-2 flex flex-col gap-2 text-[14px]">
            {["Hands-on use in a project earns full marks", "Listed-only or related technology earns half", "Unstated details are flagged for you to verify", "Similar technologies are never treated as the same"].map((x) => (
              <li key={x} className="flex items-start gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 text-good" />{x}</li>
            ))}
          </ul>
        </div>
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Parameter</th><th className="text-right">Weight</th></tr></thead>
            <tbody>
              {[["Mandatory technical skills", 40], ["Relevant experience", 25], ["Project / domain experience", 15], ["Preferred technical skills", 10], ["Education / certifications", 5], ["Role and location requirements", 5]].map(([l, w]) => (
                <tr key={l}><td>{l}</td><td className="text-right font-semibold tabular">{w}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line2 px-3.5 py-2.5 text-xs text-muted">85+ strong · 70–84 good · 55–69 partial · below 55 low</p>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Try it on your next requirement</h2>
            <p className="mt-1 text-muted">Set up your workspace in two minutes and invite your team.</p>
          </div>
          <Link href="/signup" className="btn-primary px-5 py-2.5 text-[14px]">Start free trial</Link>
        </div>
      </section>
    </>
  );
}
