import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { households } from "@/lib/db/schema";
import { JoinForm } from "@/components/join-form";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ box?: string }>;
}) {
  const { box } = await searchParams;

  // Named here rather than on submit, so an invitation says whose box it is
  // before anybody types their password into it.
  let boxName: string | null = null;
  if (box) {
    const [household] = await db
      .select({ name: households.name })
      .from(households)
      .where(eq(households.inviteCode, box))
      .limit(1);
    boxName = household?.name ?? null;
  }

  // A code that matches nothing is dropped rather than carried into the form,
  // which would otherwise promise a box of your own and then refuse on submit.
  return <JoinForm boxCode={boxName ? box : undefined} boxName={boxName} />;
}
