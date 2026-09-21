import Form from "next/form";
import Link from "next/link";
import { Input } from "@/components/ui";

/**
 * Search sits on the box itself. No autofocus: on a tablet the keyboard would
 * cover the card she just opened, and on a phone it would do the same to the
 * front door.
 */
export function BoxSearch({
  action,
  query,
  preserve,
}: {
  action: string;
  query?: string;
  preserve?: Record<string, string | undefined>;
}) {
  const shown = query?.trim() ?? "";
  const clear = new URLSearchParams();
  for (const [key, value] of Object.entries(preserve ?? {})) {
    if (value) clear.set(key, value);
  }
  const clearHref = clear.size ? `${action}?${clear}` : action;

  return (
    <Form action={action} className="flex items-center gap-2">
      {Object.entries(preserve ?? {}).map(([key, value]) =>
        value ? <input key={key} type="hidden" name={key} value={value} /> : null,
      )}
      <Input
        name="q"
        defaultValue={shown}
        type="search"
        enterKeyHint="search"
        placeholder="Chicken, or a name you remember"
        aria-label="Search your recipes"
      />
      {shown ? (
        <Link
          href={clearHref}
          className="tap inline-flex shrink-0 items-center px-2 text-[0.95rem] font-bold text-pink"
        >
          Clear
        </Link>
      ) : null}
    </Form>
  );
}
