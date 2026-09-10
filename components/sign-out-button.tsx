"use client";

import { useTransition } from "react";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      className="w-full"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          // Offline copies of recipes must not outlive the session on a
          // shared device.
          navigator.serviceWorker?.controller?.postMessage("clear-caches");
          await logoutAction();
        })
      }
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
