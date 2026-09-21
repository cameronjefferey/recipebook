"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GearIcon, SearchIcon } from "@/components/icons";

/**
 * The pink lid of the box. Search and settings live here so the tab bar can
 * stay the three things you actually do: open the box, put a card in, plan.
 */
export function AppHeader() {
  const pathname = usePathname();
  const searching = pathname.startsWith("/search");
  const settling = pathname.startsWith("/settings");

  return (
    <header className="no-print pt-safe z-30 shrink-0 bg-pink px-4 py-2.5 text-page">
      <div className="mx-auto flex max-w-lg items-center gap-1 md:max-w-[45rem] lg:max-w-[60rem]">
        <Link
          href="/box"
          className="font-display min-w-0 flex-1 truncate text-xl leading-none"
        >
          The Pink Recipe Box
        </Link>
        <Link
          href="/box/all"
          aria-label="Search"
          aria-current={searching ? "page" : undefined}
          className={`tap flex items-center justify-center ${
            searching ? "text-page" : "text-page/75"
          }`}
        >
          <SearchIcon className="h-6 w-6" />
        </Link>
        <Link
          href="/settings"
          aria-label="Settings"
          aria-current={settling ? "page" : undefined}
          className={`tap flex items-center justify-center ${
            settling ? "text-page" : "text-page/75"
          }`}
        >
          <GearIcon className="h-6 w-6" />
        </Link>
      </div>
    </header>
  );
}
