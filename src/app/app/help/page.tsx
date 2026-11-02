import type { Metadata } from "next";
import { PageHead } from "../parts";

export const metadata: Metadata = { title: "Help" };

export default function Help() {
  return (
    <>
      <PageHead title="Help" sub="How IT Recruitment Assistant works, in plain words." />
      <div className="grid gap-[18px] lg:grid-cols-2">
        <section className="panel">
          <h2 className="font-bold">Daily routine</h2>
          <ol className="m-0 flex list-decimal flex-col gap-2 pl-5 text-[13.5px]">
            <li><b>New JD arrives:</b> Jobs → New job, paste it, click Analyse. Check the must-have skills look right.</li>
            <li><b>Sourcing:</b> open the job&apos;s Sourcing tab, copy a search string and run it in your LinkedIn or Naukri account.</li>
            <li><b>Screening:</b> on the job, click Screen resume and upload each good resume. It&apos;s scored and added to Candidates.</li>
            <li><b>Technical round:</b> generate the Technical questions for the job and share them with the interviewer.</li>
            <li><b>After every call:</b> open the candidate, add notes and move their stage. The dashboard counts come from this.</li>
            <li><b>Contacting people:</b> Messages has ready drafts. Copy and send from your own email.</li>
            <li><b>Reporting:</b> Dashboard → Copy status report.</li>
          </ol>
        </section>
        <section className="panel">
          <h2 className="font-bold">How the match score works</h2>
          <p className="text-[13.5px]">Claude reads the resume and grades each job skill as <b>hands-on</b> (used in a project), <b>listed only</b> (in a skills list without proof), <b>related tech</b> (similar but not the same) or <b>not evidenced</b>. The score is then fixed arithmetic:</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {[["Mandatory skills", 40], ["Relevant experience", 25], ["Projects / domain", 15], ["Preferred skills", 10], ["Education", 5], ["Location / notice", 5]].map(([l, w]) => (
              <div key={l} className="rounded-lg border border-line p-3"><span className="label">{l}</span><b className="block text-xl tabular">{w}</b></div>
            ))}
          </div>
          <p className="text-[13px] text-muted">85+ strong, 70–84 good, 55–69 partial, below 55 low. You can correct any grade on the candidate page and the score updates. The score is a guide. The final decision is always yours.</p>
        </section>
      </div>
    </>
  );
}
