import type { ReactNode } from "react";
import { Icon } from "@/components/icons";

export function PageHead({ title, sub, children }: { title: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><h1 className="text-[1.35rem] font-bold">{title}</h1>{sub && <div className="mt-1 text-[13px] text-muted">{sub}</div>}</div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, icon, big }: { label: string; value: ReactNode; icon: string; big?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 border-b border-r border-line px-4 py-3 text-center">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted"><Icon name={icon} className="h-3.5 w-3.5" />{label}</span>
      <b className={`max-w-full truncate font-bold tabular ${big ? "text-2xl" : "text-[14.5px] font-semibold"}`}>{value}</b>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const [cls, label] = status === "hold" ? ["bg-warn-soft text-warn", "On hold"] : status === "closed" ? ["bg-grey text-muted", "Closed"] : ["bg-good-soft text-good", "Active"];
  return <span className={`pill ${cls}`}>{label}</span>;
}

export function ViewOnly() {
  return <p className="callout-info">Your role in this workspace is view-only. Ask an admin if you need to make changes.</p>;
}
