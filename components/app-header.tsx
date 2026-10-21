"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GearIcon } from "@/components/icons";

/**
 * The pink lid of the box, with the name written on it. Search lives on the
 * box page where the cards are; Settings is the one thing up here, because it
 * is used once and then left alone.
 */
export function AppHeader() {
  const pathname = usePathname();
  const settling = pathname.startsWith("/settings");

  return (
    <header className="no-print pt-safe z-30 shrink-0 bg-pink px-4 py-2 text-page shadow-[0_1px_3px_#382a2226]">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2 md:max-w-[45rem] lg:max-w-[60rem]">
        <Link
          href="/box"
          className="font-display min-w-0 truncate py-1 text-[1.75rem] leading-none"
        >
          The Pink Recipe Box
        </Link>
        <Link
          href="/settings"
          aria-current={settling ? "page" : undefined}
          className={`tap -mr-2 flex items-center gap-1.5 rounded-full px-3 text-[1rem] font-bold ${
            settling ? "text-page" : "text-page/85"
          }`}
        >
          <GearIcon className="h-6 w-6" />
          <span className="hidden sm:inline">Settings</span>
          <span className="sr-only sm:hidden">Settings</span>
        </Link>
      </div>
    </header>
  );
}
