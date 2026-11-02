import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { WorkspaceForm } from "./form";

export const metadata: Metadata = { title: "Create workspace" };

export default function Onboarding() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <Logo />
      <div className="w-full max-w-[420px] rounded-2xl border border-line bg-surface p-6"><WorkspaceForm /></div>
    </div>
  );
}
