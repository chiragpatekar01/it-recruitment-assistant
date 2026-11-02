"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";

const GROUPS: { g: string; items: { href: string; label: string; icon: string; exact?: boolean }[] }[] = [
  { g: "Overview", items: [{ href: "/app", label: "Dashboard", icon: "grid", exact: true }] },
  { g: "Recruitment", items: [{ href: "/app/jobs", label: "Jobs", icon: "brief" }, { href: "/app/candidates", label: "Candidates", icon: "users" }] },
  { g: "Process", items: [{ href: "/app/messages", label: "Messages", icon: "mail" }] },
  { g: "Workspace", items: [{ href: "/app/settings", label: "Settings", icon: "settings", exact: true }, { href: "/app/settings/team", label: "Team", icon: "users" }, { href: "/app/settings/billing", label: "Billing", icon: "card" }, { href: "/app/help", label: "Help", icon: "help" }] },
];

export function SideNav({ counts }: { counts: { jobs: number; candidates: number } }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {GROUPS.map((grp) => (
        <div key={grp.g} className="flex gap-1 md:flex-col">
          <span className="hidden px-2.5 pb-1 pt-3 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted md:block">{grp.g}</span>
          {grp.items.map((it) => {
            const on = it.exact ? path === it.href : path === it.href || path.startsWith(it.href + "/");
            const ct = it.href === "/app/jobs" ? counts.jobs : it.href === "/app/candidates" ? counts.candidates : 0;
            return (
              <Link key={it.href} href={it.href} aria-current={on ? "page" : undefined}
                className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-[13.5px] font-medium ${on ? "bg-accent-soft text-accent" : "text-ink hover:bg-surface2"}`}>
                <Icon name={it.icon} />{it.label}
                {ct > 0 && <span className="ml-auto pl-2 text-[11px] text-muted tabular">{ct}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function JobTabs({ id, counts }: { id: string; counts: { candidates: number; tech: number } }) {
  const path = usePathname();
  const base = `/app/jobs/${id}`;
  const tabs = [
    { href: base, label: "Details" }, { href: `${base}/candidates`, label: `Candidates (${counts.candidates})` },
    { href: `${base}/sourcing`, label: "Sourcing" }, { href: `${base}/questions`, label: "Screening questions" },
    { href: `${base}/technical`, label: `Technical questions${counts.tech ? ` (${counts.tech})` : ""}` }, { href: `${base}/edit`, label: "Edit" },
  ];
  return (
    <nav aria-label="Job sections" className="inline-flex max-w-full gap-0.5 overflow-x-auto rounded-[9px] border border-line bg-surface2 p-[3px]">
      {tabs.map((t) => {
        const on = path === t.href;
        return (
          <Link key={t.href} href={t.href} aria-current={on ? "page" : undefined}
            className={`whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[13px] font-semibold ${on ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
