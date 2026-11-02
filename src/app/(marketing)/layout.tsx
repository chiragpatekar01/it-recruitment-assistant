import Link from "next/link";
import { Logo } from "@/components/logo";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Logo />
          <nav className="flex flex-1 items-center gap-5 text-[13.5px] font-medium text-muted">
            <Link href="/#features" className="hover:text-ink">Features</Link>
            <Link href="/#how" className="hover:text-ink">How scoring works</Link>
            <Link href="/pricing" className="hover:text-ink">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn">Log in</Link>
            <Link href="/signup" className="btn-primary">Start free trial</Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-[13px] text-muted sm:px-6">
          <span>© {new Date().getFullYear()} [Organization name]. Built in Mumbai.</span>
          <nav className="flex gap-4"><Link href="/pricing">Pricing</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>
        </div>
      </footer>
    </div>
  );
}
