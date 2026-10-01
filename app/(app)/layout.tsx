import { requireUser } from "@/lib/auth";
import { PaperNav } from "@/components/paper-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    // The table fills the screen. A short line of words sits at the top.
    // The middle scrolls, and a page can still ask for the height left over.
    <div className="flex h-dvh flex-col">
      <PaperNav planEnabled={user.mealPlanEnabled} />

      <main className="mx-auto w-full min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {children}
      </main>
    </div>
  );
}
