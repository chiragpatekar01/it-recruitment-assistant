import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of service" };

// Template only. Have it reviewed by a lawyer before launch.
export default function Terms() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-14 text-[14.5px] leading-relaxed sm:px-6">
      <h1 className="text-3xl font-extrabold">Terms of service</h1>
      <p className="text-muted">Last updated: [date]</p>
      <h2 className="text-lg font-bold">The service</h2>
      <p>IT Recruitment Assistant helps recruiters analyse job descriptions, screen resumes and manage a hiring pipeline. Match scores and suggestions are preliminary aids based on the information provided. They are not predictions of job performance and not hiring decisions. Customers remain responsible for every hiring decision and for using the service lawfully and fairly.</p>
      <h2 className="text-lg font-bold">Accounts and workspaces</h2>
      <p>The workspace owner is responsible for who they invite and the roles they assign. Keep your login details secure.</p>
      <h2 className="text-lg font-bold">Plans and payment</h2>
      <p>Paid plans renew monthly through Razorpay until cancelled. Prices exclude applicable taxes. If a payment fails, AI features may pause until billing is updated. Cancelling stops future renewals; access continues until the end of the paid period.</p>
      <h2 className="text-lg font-bold">Acceptable use</h2>
      <p>Don&apos;t upload data you have no right to process, and don&apos;t use the service to discriminate against candidates on protected characteristics.</p>
      <h2 className="text-lg font-bold">Contact</h2>
      <p>[Organization name], [address], [email].</p>
    </article>
  );
}
