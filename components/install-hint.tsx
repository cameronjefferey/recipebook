"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button, Card } from "@/components/ui";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STANDALONE = "(display-mode: standalone)";

function subscribeToDisplayMode(onChange: () => void) {
  const query = window.matchMedia(STANDALONE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const noSubscription = () => () => {};

export function InstallHint() {
  // Assume installed on the server so the prompt never flashes before
  // hydration decides it is not needed.
  const installed = useSyncExternalStore(
    subscribeToDisplayMode,
    () => window.matchMedia(STANDALONE).matches,
    () => true,
  );

  const isIos = useSyncExternalStore(
    noSubscription,
    () => /iphone|ipad|ipod/i.test(navigator.userAgent),
    () => false,
  );

  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    // Chrome and Edge let us trigger the real install prompt.
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (installed) return null;

  return (
    <Card className="space-y-3 p-4">
      <p className="font-display text-lg">Put it on your home screen</p>
      <p className="text-[0.95rem] text-muted">
        It opens like an app, and recipes you have already looked at work
        without a signal.
      </p>

      {prompt ? (
        <Button
          onClick={async () => {
            await prompt.prompt();
            setPrompt(null);
          }}
          className="w-full"
        >
          Add to home screen
        </Button>
      ) : isIos ? (
        // Safari has no install API, so this has to be spelled out.
        <p className="text-[0.95rem]">
          Tap the Share button at the bottom of Safari, then choose{" "}
          <strong>Add to Home Screen</strong>.
        </p>
      ) : (
        <p className="text-[0.95rem]">
          Use your browser menu and choose <strong>Install</strong> or{" "}
          <strong>Add to Home Screen</strong>.
        </p>
      )}
    </Card>
  );
}
