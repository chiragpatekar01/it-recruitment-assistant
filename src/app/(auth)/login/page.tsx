import type { Metadata } from "next";
import { LoginForm } from "../forms";

export const metadata: Metadata = { title: "Log in" };

export default function Page({ searchParams }: { searchParams: { next?: string } }) {
  return <LoginForm next={searchParams.next?.startsWith("/") ? searchParams.next : "/app"} />;
}
