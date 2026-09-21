import { requireUser } from "@/lib/auth";
import { listDividers } from "@/lib/books";
import { WriteForm } from "@/components/write-form";
import { BackLink, Card } from "@/components/ui";

export default async function WritePage() {
  const user = await requireUser();
  const dividers = await listDividers(user.householdId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        <BackLink href="/add" label="Back to Add" />
        <h1 className="font-display text-2xl">Type it in</h1>
      </div>

      <Card className="p-4">
        <WriteForm names={dividers.names} books={dividers.books} />
      </Card>
    </div>
  );
}
