"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallHint() {
  const [installed, setInstalled] = useState(true);
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));

    // Chrome and Edge let us trigger the real install prompt.
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPromptEvent);
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
