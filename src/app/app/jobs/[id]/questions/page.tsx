import { requireOrg } from "@/lib/org";
import { getJob } from "@/lib/data";
import { CopyButton } from "@/components/client";

export default async function Questions({ params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  const { details: d } = await getJob(ctx.org.id, params.id);
  const qs = d.questions ?? [];
  const text = qs.map((q, i) => `${i + 1}. ${q.q}\n   Good answer: ${q.indicator}\n   Follow-up: ${q.followUp}`).join("\n\n");
  return (
    <section className="card">
      <header className="flex items-center justify-between p-4"><h2 className="font-bold">Screening questions</h2>{!!qs.length && <CopyButton text={text} label="Copy all" />}</header>
      {qs.length ? (
        <div className="overflow-x-auto"><table className="tbl">
          <thead><tr><th>#</th><th>Question</th><th>Good answer indicators</th><th>Follow-up</th></tr></thead>
          <tbody>{qs.map((q, i) => <tr key={i}><td className="text-muted tabular">{i + 1}</td><td>{q.q}</td><td>{q.indicator}</td><td>{q.followUp}</td></tr>)}</tbody>
        </table></div>
      ) : <p className="px-4 pb-5 text-muted">No questions yet. Add them in the Edit tab, or create the job from a JD to generate them.</p>}
    </section>
  );
}
