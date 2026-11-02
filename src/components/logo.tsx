import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 no-underline">
      <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-accent text-[13px] font-bold text-accent-ink">IT</span>
      <b className="text-[15px] text-ink">IT Recruitment Assistant</b>
    </Link>
  );
}
