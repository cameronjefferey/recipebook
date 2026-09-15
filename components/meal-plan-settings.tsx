"use client";

import { useOptimistic, useTransition } from "react";
import { setMealPlanEnabled } from "@/lib/actions/settings";
import { Card, Switch } from "@/components/ui";

export function MealPlanSettings({ enabled }: { enabled: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(enabled);
  const [, startTransition] = useTransition();

  const flip = () => {
    const next = !optimistic;
    startTransition(async () => {
      setOptimistic(next);
      await setMealPlanEnabled(next);
    });
  };

  return (
    <Card className="flex items-center justify-between gap-4 p-4">
      <div>
        <p className="font-bold">Meal planning</p>
        <p className="mt-0.5 text-[0.9rem] text-muted">
          The Plan tab, &quot;Cook this week,&quot; and the grocery list.
          {optimistic
            ? " Turning it off just hides these — nothing on the list is lost."
            : " Nothing on your list was touched, so it'll be right where you left it."}
        </p>
      </div>
      <Switch checked={optimistic} onChange={flip} label="Meal planning" />
    </Card>
  );
}
