"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import {
  revokeShare,
  setShareCanAdd,
  shareBook,
  type ShareState,
} from "@/lib/actions/shares";
import { Button, Card, ErrorNote, Input } from "@/components/ui";
import { CheckIcon } from "@/components/icons";

type Share = {
  id: string;
  recipientName: string;
  token: string;
  lastViewedAt: Date | string | null;
  viewCount: number;
  canAdd: boolean;
  acceptedAt: Date | string | null;
};

const noop = () => () => {};

/**
 * The server has no window, so the origin is a browser-only value: reading it
 * during render would produce different markup on each side. The server sees an
 * empty string and shows the path alone, which is still a correct link, just a
 * relative one, and it becomes absolute the moment it reaches the browser.
 */
function useOrigin() {
  return useSyncExternalStore(
    noop,
    () => window.location.origin,
    () => "",
  );
}

function seen(share: Share) {
  if (!share.lastViewedAt) return "not opened yet";
  const when = new Date(share.lastViewedAt);
  const days = Math.floor((Date.now() - when.getTime()) / 864e5);
  if (days === 0) return "opened today";
  if (days === 1) return "opened yesterday";
  if (days < 30) return `opened ${days} days ago`;
  return `opened ${when.toLocaleDateString()}`;
}

export function ShareManager({
  bookId,
  bookName,
  shares,
}: {
  bookId: string;
  bookName: string;
  shares: Share[];
}) {
  const shareWithBook = shareBook.bind(null, bookId);
  const [state, action, pending] = useActionState<ShareState, FormData>(
    shareWithBook,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state]);

  return (
    <div className="space-y-5">
      <form ref={formRef} action={action} className="space-y-2">
        <label className="text-[0.75rem] font-bold tracking-wide text-browned uppercase">
          Share with someone
        </label>
        <ErrorNote>{state.error}</ErrorNote>
        <div className="flex gap-2">
          <Input
            name="recipientName"
            placeholder="Aunt Carol"
            aria-label="Who is it for"
            maxLength={60}
            required
          />
          <Button type="submit" disabled={pending} className="shrink-0 px-5">
            {pending ? "…" : "Share"}
          </Button>
        </div>
        <label className="flex items-center gap-2.5 py-1 text-[0.9rem]">
          <input
            type="checkbox"
            name="canAdd"
            className="h-5 w-5 shrink-0 accent-pink"
          />
          Let them add their own recipes to this box
        </label>
      </form>

      {shares.length === 0 ? (
        <p className="hand text-browned">
          {bookName} is not shared with anyone yet
        </p>
      ) : (
        <ul className="space-y-3">
          {shares.map((share) => (
            <li key={share.id}>
              <ShareRow share={share} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ShareRow({ share }: { share: Share }) {
  const [copied, setCopied] = useState(false);
  const [canAdd, setCanAdd] = useState(share.canAdd);
  const [pending, startTransition] = useTransition();
  const link = `${useOrigin()}/shared/${share.token}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Clipboard is blocked outside a secure context, and on an old phone
      // browser. Selecting the text by hand still has to be possible.
      window.prompt("Copy this link", link);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-bold">
            {share.recipientName}
            {share.acceptedAt ? (
              <span className="ml-2 text-[0.72rem] font-bold tracking-wide text-browned uppercase">
                has an account
              </span>
            ) : null}
          </p>
          <p className="text-[0.8rem] text-muted">
            {seen(share)}
            {share.viewCount > 0
              ? ` · ${share.viewCount} ${share.viewCount === 1 ? "visit" : "visits"}`
              : ""}
          </p>
        </div>
        <button
          onClick={() => {
            if (!confirm(`Stop ${share.recipientName} seeing this box?`)) return;
            startTransition(() => revokeShare(share.id));
          }}
          disabled={pending}
          className="-my-1 shrink-0 px-1 py-2 text-[0.85rem] font-bold text-jam disabled:opacity-50"
        >
          Take back
        </button>
      </div>

      <label className="mt-1 flex items-center gap-2.5 py-1 text-[0.85rem] text-muted">
        <input
          type="checkbox"
          checked={canAdd}
          disabled={pending}
          onChange={(e) => {
            // Held locally as well, or the tick sits unmoved until the server
            // has been round and the box looks broken.
            setCanAdd(e.target.checked);
            startTransition(() => setShareCanAdd(share.id, e.target.checked));
          }}
          className="h-4.5 w-4.5 shrink-0 accent-pink"
        />
        Can add their own recipes
      </label>

      <div className="mt-2 flex items-center gap-2">
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
