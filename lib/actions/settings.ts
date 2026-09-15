"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { households } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";

/**
 * Turns meal planning on or off for the whole household. This only hides
 * the tab, the "Cook this week" toggle, and "Select" — whatever is already
 * on the plan or the list is left exactly as it is, and comes right back
 * if it is switched on again.
 */
export async function setMealPlanEnabled(enabled: boolean) {
  const user = await requireUser();
  await db
    .update(households)
    .set({ mealPlanEnabled: enabled })
    .where(eq(households.id, user.householdId));

  // The tab bar lives in the shared layout, so the whole app needs to know.
  revalidatePath("/", "layout");
}
