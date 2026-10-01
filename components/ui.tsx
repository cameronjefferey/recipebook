import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const base =
  "tap margin-word inline-flex items-center justify-center gap-2 px-2 " +
  "disabled:opacity-50 disabled:pointer-events-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const variants: Record<Variant, string> = {
  primary: "text-ink",
  secondary: "text-browned",
  ghost: "text-browned",
  danger: "text-jam",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button {...props} className={`${base} ${variants[variant]} ${className}`} />
  );
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return (
    <Link {...props} className={`${base} ${variants[variant]} ${className}`} />
  );
}

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-[2px] border border-line bg-card ${className}`}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="hand mb-1 block">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-sm text-muted">{hint}</span> : null}
    </label>
  );
}

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={
        "tap w-full rounded-none border-0 border-b border-rule bg-transparent px-1 text-[1.05rem] text-ink " +
        "placeholder:text-muted/60 focus:border-ink focus:outline-none " +
        className
      }
    />
  );
}

export function Textarea({
  className = "",
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={
        "w-full rounded-none border-0 border-b border-rule bg-transparent px-1 py-3 text-[1.05rem] text-ink " +
        "placeholder:text-muted/60 focus:border-ink focus:outline-none " +
        className
      }
    />
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-xl bg-jam/10 px-4 py-3 text-[0.95rem] text-jam"
    >
      {children}
    </p>
  );
}

export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={`tap relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-ink" : "bg-line"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-card shadow-sm transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

/**
 * A back chevron to a fixed, single parent — pair it with a heading, the way
 * the box and share pages already do. For a page reached from more than one
 * place, `BackButton` (components/back-button.tsx) retraces actual history
 * instead of guessing which parent to send someone to.
 */
export function BackLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children?: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="tap margin-word -ml-2 justify-start"
    >
      {children ?? label}
    </Link>
  );
}

/** A handwritten label above a group. Not small capitals. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="hand">{children}</span>;
}
