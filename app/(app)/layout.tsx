import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { TabBar } from "@/components/tab-bar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    // Exactly one screen tall, with the middle doing the scrolling. That keeps
    // the header and the tabs put, and lets a page ask for the height that is
    // actually left over instead of guessing at the chrome.
    <div className="flex h-dvh flex-col">
      <header className="no-print pt-safe z-30 shrink-0 bg-pink px-5 py-3 text-page">
        <Link href="/recipes" className="font-display block text-xl leading-none">
          The Pink Recipe Box
        </Link>
      </header>

      <main className="mx-auto w-full max-w-lg min-h-0 flex-1 overflow-y-auto px-4 py-5">
        {children}
      </main>

      <TabBar planEnabled={user.mealPlanEnabled} />
    </div>
  );
}
