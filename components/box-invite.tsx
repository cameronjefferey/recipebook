"use client";

import { useState, useSyncExternalStore } from "react";
import { Button, Card } from "@/components/ui";
import { CheckIcon } from "@/components/icons";

const noop = () => () => {};

function useOrigin() {
  return useSyncExternalStore(
    noop,
    () => window.location.origin,
    () => "",
  );
}

/**
 * Sharing a book is for people with a box of their own. This is the other
 * thing: bringing somebody into *this* box, so the two of you keep one
 * collection between you, the way a household actually works.
 */
export function BoxInvite({
  code,
  boxName,
}: {
  code: string;
  boxName: string;
}) {
  const [copied, setCopied] = useState(false);
  const link = `${useOrigin()}/join?box=${code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      window.prompt("Copy this link", link);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-4">
      <p className="font-bold">Share this whole box</p>
      <p className="mt-1 text-[0.9rem] text-muted">
        Anyone who joins with this link keeps {boxName} with you: same recipes,
        same books, both of you able to change them. To let somebody see only
        part of it, share a single book from the shelf instead.
      </p>

      <div className="mt-3 flex items-center gap-2">
        <code className="no-scrollbar min-w-0 flex-1 overflow-x-auto rounded-card bg-sink px-2.5 py-2 text-[0.72rem] whitespace-nowrap text-muted">
          {link}
        </code>
        <Button
          variant="secondary"
          onClick={copy}
          className="shrink-0 gap-1 px-3.5"
        >
          {copied ? <CheckIcon className="h-4 w-4" /> : null}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </Card>
  );
}
