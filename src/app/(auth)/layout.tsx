import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <Logo />
      <div className="w-full max-w-[400px] rounded-2xl border border-line bg-surface p-6 shadow-[0_12px_32px_rgba(20,28,36,.08)]">{children}</div>
    </div>
  );
}
