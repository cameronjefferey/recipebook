import { requireUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { TabBar } from "@/components/tab-bar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    // Exactly one screen tall, with the middle doing the scrolling. That keeps
    // the lid and the tabs put, and lets a page ask for the height that is
    // actually left over instead of guessing at the chrome.
    <div className="flex h-dvh flex-col">
      <AppHeader />

      <main className="mx-auto w-full max-w-lg min-h-0 flex-1 overflow-y-auto px-4 py-4 md:max-w-[45rem] lg:max-w-[60rem]">
        {children}
      </main>

      <TabBar planEnabled={user.mealPlanEnabled} />
    </div>
  );
}
