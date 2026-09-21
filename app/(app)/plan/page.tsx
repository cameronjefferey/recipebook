import { requireUser } from "@/lib/auth";
import { loadPlan } from "@/lib/grocery";
import { PlanClient } from "@/components/plan-client";
import { PlanOff } from "@/components/plan-off";

export default async function PlanPage() {
  const user = await requireUser();

  // A bookmark or the back button can land here even with the tab gone.
  if (!user.mealPlanEnabled) return <PlanOff />;

  const { planned, groceryLines, extras } = await loadPlan(user);

  return (
    <div className="space-y-8">
      <p className="hand">what&apos;s cooking, and what to buy for it</p>

      <PlanClient planned={planned} groceryLines={groceryLines} extras={extras} />
    </div>
  );
}
