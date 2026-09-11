import { requireUser } from "@/lib/auth";
import { loadPlan } from "@/lib/grocery";
import { PlanClient } from "@/components/plan-client";

export default async function PlanPage() {
  const user = await requireUser();
  const { planned, groceryLines, extras } = await loadPlan(user);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl">This week</h1>
        <p className="hand mt-1">what&apos;s cooking, and what to buy for it</p>
      </div>

      <PlanClient planned={planned} groceryLines={groceryLines} extras={extras} />
    </div>
  );
}
