"use client";

import { useTransition } from "react";
import { setMealPlanEnabled } from "@/lib/actions/settings";
import { Button } from "@/components/ui";

/**
 * Shown at /plan itself when the household has turned meal planning off —
 * a bookmark or the browser's back button can still land here even with
 * the tab gone. Nothing on the list was touched, so turning it back on
 * (from here or from Settings) picks up right where it left off.
 */
export function PlanOff() {
  const [pending, startTransition] = useTransition();

  return (
    <div className="py-16 text-center">
      <p className="font-display text-2xl text-pink">Meal planning is off</p>
      <p className="hand mt-2 text-browned">
        turn it back on in Settings, or right here
      </p>
      <Button
        className="mt-6"
        disabled={pending}
        onClick={() => startTransition(() => setMealPlanEnabled(true))}
      >
        Turn it back on
      </Button>
    </div>
  );
}
