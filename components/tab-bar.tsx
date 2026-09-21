"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoxIcon, CameraIcon, CartIcon } from "@/components/icons";

const allTabs = [
  { href: "/box", label: "Box", Icon: BoxIcon, home: true },
  { href: "/add", label: "Add", Icon: CameraIcon, primary: true },
  { href: "/plan", label: "Plan", Icon: CartIcon, plan: true },
];

export function TabBar({ planEnabled }: { planEnabled: boolean }) {
  const pathname = usePathname();
  const tabs = allTabs.filter((tab) => planEnabled || !tab.plan);

  return (
    <nav className="no-print pb-safe z-30 shrink-0 border-t border-line bg-card/95 backdrop-blur">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-1 md:max-w-[45rem] lg:max-w-[60rem]">
        {tabs.map(({ href, label, Icon, primary, home }) => {
          const active = home
            ? pathname === "/box" ||
              pathname.startsWith("/box/") ||
              pathname.startsWith("/r/") ||
              pathname === "/recipes" ||
              pathname.startsWith("/recipes/")
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`tap flex w-full flex-col items-center justify-center gap-0.5 rounded-xl py-1 ${
                  active ? "text-pink" : "text-muted"
                }`}
              >
                {primary ? (
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-pink text-page shadow-sm">
                    <Icon className="h-6 w-6" />
                  </span>
                ) : (
                  <Icon className="h-6 w-6" />
                )}
                <span className="text-[0.7rem] font-bold">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
