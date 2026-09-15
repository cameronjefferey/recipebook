import { eq, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { households, recipes } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui";
import { BoxInvite } from "@/components/box-invite";
import { InstallHint } from "@/components/install-hint";
import { MealPlanSettings } from "@/components/meal-plan-settings";
import { SignOutButton } from "@/components/sign-out-button";

export default async function SettingsPage() {
  const user = await requireUser();

  const [[{ total }], [household]] = await Promise.all([
    db
      .select({ total: count() })
      .from(recipes)
      .where(eq(recipes.householdId, user.householdId)),
    db
      .select({ inviteCode: households.inviteCode })
      .from(households)
      .where(eq(households.id, user.householdId))
      .limit(1),
  ]);

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

      <BoxInvite code={household.inviteCode} boxName={user.householdName} />

      <MealPlanSettings enabled={user.mealPlanEnabled} />

      <InstallHint />

      <SignOutButton />
    </div>
  );
}
