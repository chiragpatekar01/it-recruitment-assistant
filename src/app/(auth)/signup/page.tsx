import type { Metadata } from "next";
import { SignupForm } from "../forms";

export const metadata: Metadata = { title: "Start free trial" };

export default function Page({ searchParams }: { searchParams: { next?: string } }) {
  return <SignupForm next={searchParams.next?.startsWith("/") ? searchParams.next : "/onboarding"} />;
}
