import { eq, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipes } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui";
import { InstallHint } from "@/components/install-hint";
import { SignOutButton } from "@/components/sign-out-button";

export default async function SettingsPage() {
  const user = await requireUser();

  const [{ total }] = await db
    .select({ total: count() })
    .from(recipes)
    .where(eq(recipes.householdId, user.householdId));

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl">Settings</h1>

      <Card className="p-4">
        <p className="font-bold">{user.name}</p>
        <p className="text-[0.9rem] text-muted">{user.email}</p>
        <p className="mt-2 text-[0.9rem] text-muted">
          {total} {total === 1 ? "recipe" : "recipes"} in {user.householdName}.
        </p>
      </Card>

      <InstallHint />

      <SignOutButton />
    </div>
  );
}
