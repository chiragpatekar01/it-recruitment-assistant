import type { Metadata } from "next";
import { ForgotForm } from "../forms";

export const metadata: Metadata = { title: "Reset password" };

export default function Page() {
  return <ForgotForm />;
}
