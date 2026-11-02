"use client";
import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "./icons";

export function SubmitButton({ children, pending, className = "btn-primary", ...rest }: { children: ReactNode; pending?: string; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending: busy } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={busy || rest.disabled} {...rest}>
      {busy ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />{pending ?? "Working…"}</> : children}
    </button>
  );
}

export function CopyButton({ text, label = "Copy", className = "btn btn-sm" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className={className} onClick={async () => {
      try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1600); } catch { /* clipboard blocked */ }
    }}>
      <Icon name={done ? "check" : "copy"} className="h-3.5 w-3.5" />{done ? "Copied" : label}
    </button>
  );
}

/** Two-step destructive button: first click arms, second click submits. */
export function ConfirmSubmit({ label, confirm, className = "btn-danger" }: { label: string; confirm: string; className?: string }) {
  const [armed, setArmed] = useState(false);
  const { pending } = useFormStatus();
  if (!armed) return <button type="button" className={className} onClick={() => setArmed(true)}>{label}</button>;
  return <button type="submit" className={className} disabled={pending} onBlur={() => setArmed(false)} autoFocus>{pending ? "Working…" : confirm}</button>;
}
