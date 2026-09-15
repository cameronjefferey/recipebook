import { requireUser } from "@/lib/auth";
import { listShelf } from "@/lib/books";
import { shareCounts } from "@/lib/sharing";
import { NewBookForm } from "@/components/new-book-form";
import { BoxCard } from "@/components/box-card";
import { Eyebrow } from "@/components/ui";

export default async function BoxPage() {
  const user = await requireUser();
  const [{ smart, mine, shared }, sharedOut] = await Promise.all([
    listShelf(user),
    shareCounts(user.householdId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">The box</h1>
        <p className="hand mt-1">tap one open and see what&apos;s inside</p>
      </div>

      <section className="space-y-3">
        <Eyebrow>Your boxes</Eyebrow>
        {mine.length === 0 ? (
          <p className="text-[0.95rem] text-muted">
            No boxes yet. Make one below, then file recipes into it from the
            recipe itself.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {mine.map((book) => (
              <li key={book.id}>
                <BoxCard book={book} sharedWith={sharedOut.get(book.id) ?? 0} />
              </li>
            ))}
          </ul>
        )}
        <NewBookForm />
      </section>

      {shared.length > 0 ? (
        <section className="space-y-3">
          <Eyebrow>Shared with you</Eyebrow>
          <ul className="grid grid-cols-2 gap-3">
            {shared.map((book) => (
              <li key={book.id}>
                <BoxCard book={book} from={book.ownerName} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <Eyebrow>Always here</Eyebrow>
        <ul className="grid grid-cols-2 gap-3">
          {smart.map((book) => (
            <li key={book.id}>
              <BoxCard book={book} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
