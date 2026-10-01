"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/box/all", label: "Search", match: (path: string) => path === "/box/all" || path.startsWith("/search") },
  { href: "/add", label: "Add", match: (path: string) => path === "/add" || path.startsWith("/add/") },
  { href: "/plan", label: "Plan", plan: true, match: (path: string) => path === "/plan" || path.startsWith("/plan/") },
  { href: "/settings", label: "Settings", match: (path: string) => path.startsWith("/settings") },
];

/**
 * Quiet navigation on the table. The wordmark, then the few places you go.
 * No bar, no icons, no pink fill.
 */
export function PaperNav({ planEnabled }: { planEnabled: boolean }) {
  const pathname = usePathname();
  const shown = links.filter((link) => planEnabled || !link.plan);

  return (
    <header className="no-print pt-safe shrink-0 px-4 pt-3 pb-1">
      <div className="mx-auto flex max-w-3xl items-end justify-between gap-3">
        <Link href="/box" className="font-display min-w-0 truncate text-[1.65rem] leading-none text-ink">
          The Pink Recipe Box
        </Link>
        <nav aria-label="Pages" className="flex shrink-0 items-center">
          {shown.map((link) => {
            const on = link.match(pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={on ? "page" : undefined}
                className={`tap margin-word ${on ? "margin-on" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
