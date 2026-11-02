import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy policy" };

// Template only. Have it reviewed against India's Digital Personal Data Protection Act, 2023
// and your actual data flows before launch.
export default function Privacy() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-14 text-[14.5px] leading-relaxed sm:px-6">
      <h1 className="text-3xl font-extrabold">Privacy policy</h1>
      <p className="text-muted">Last updated: [date]</p>
      <p>[Organization name] (&quot;we&quot;) provides IT Recruitment Assistant to recruitment teams (&quot;customers&quot;). This policy explains what personal data the service processes and why.</p>
      <h2 className="text-lg font-bold">Account data</h2>
      <p>We store the name and email address of each user, the workspaces they belong to and their role. We use this to sign you in, run your workspace and contact you about your account.</p>
      <h2 className="text-lg font-bold">Candidate data</h2>
      <p>Customers upload job descriptions and resumes. The resume text is sent to our AI provider to extract a screening profile: skills and the evidence for them, experience, education, location, notice period and compensation details the candidate chose to share. We store that profile, not the original resume file or text. Personal details such as age, gender, date of birth, religion, caste and photos are not extracted, stored or used in scoring.</p>
      <p>For candidate data, the customer decides what is processed and why. We process it on the customer&apos;s instructions.</p>
      <h2 className="text-lg font-bold">Service providers</h2>
      <p>We use Supabase (database and authentication), Anthropic (AI analysis), Razorpay (payments) and our hosting provider. Each receives only the data needed for its part of the service.</p>
      <h2 className="text-lg font-bold">Retention and deletion</h2>
      <p>Workspace owners can delete jobs, candidates or the whole workspace at any time. Deleted data is removed from the live database immediately and from backups within [period].</p>
      <h2 className="text-lg font-bold">Your rights</h2>
      <p>You can ask to access, correct or delete your personal data, or raise a grievance, by writing to [grievance officer name and email].</p>
    </article>
  );
}
