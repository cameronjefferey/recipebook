import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { TabBar } from "@/components/tab-bar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="no-print pt-safe sticky top-0 z-30 bg-pink px-5 py-3 text-page">
        <Link href="/box" className="font-display block text-xl leading-none">
          The Pink Recipe Box
        </Link>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-5">{children}</main>

      <TabBar />
    </div>
  );
}
