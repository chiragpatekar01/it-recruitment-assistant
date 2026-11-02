import { requireOrg } from "@/lib/org";
import { getJob } from "@/lib/data";
import { Bullets, Chips } from "@/components/ui";
import { CopyButton } from "@/components/client";

function Highlight({ q }: { q: string }) {
  const parts = q.split(/("[^"]*"|\bAND\b|\bOR\b|\bNOT\b)/g);
  return <>{parts.map((p, i) => p.startsWith('"') ? <span key={i} className="text-info">{p}</span> : /^(AND|OR|NOT)$/.test(p) ? <span key={i} className="font-semibold text-accent">{p}</span> : p)}</>;
}

export default async function Sourcing({ params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  const { details: d } = await getJob(ctx.org.id, params.id);
  return (
    <>
      <section className="panel">
        <header className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">Boolean search strings</h2>
          <span className="text-xs text-muted">Run these in your own LinkedIn or Naukri account.</span></header>
        {d.booleans?.length ? d.booleans.map((b, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border border-line2 bg-surface2 px-3.5 py-3">
            <div className="flex items-center justify-between gap-2"><b>{b.label}</b><CopyButton text={b.query} /></div>
            <pre className="m-0 whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed"><Highlight q={b.query} /></pre>
            {b.why && <p className="text-xs text-muted">{b.why}</p>}
          </div>
        )) : <p className="text-muted">No search strings yet. Add them in the Edit tab, or create the job from a JD to generate them.</p>}
      </section>
      <div className="grid gap-[18px] lg:grid-cols-2">
        <section className="panel"><h3 className="font-semibold">Job titles</h3><Chips items={d.titles} /><h3 className="font-semibold">Alternative titles</h3><Chips items={d.altTitles} /></section>
        <section className="panel"><h3 className="font-semibold">Technology combinations</h3><Chips items={d.combos} /><h3 className="font-semibold">Keywords</h3><Chips items={d.keywords} /></section>
      </div>
      {!!d.strategy?.length && <section className="panel"><h2 className="font-bold">Sourcing strategy</h2><Bullets items={d.strategy} /></section>}
    </>
  );
}
