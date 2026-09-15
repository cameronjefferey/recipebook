import { createManualRecipe } from "@/lib/actions/recipes";
import { requireUser } from "@/lib/auth";
import { BackLink, Button, Card, Field, Input, Textarea } from "@/components/ui";

export default async function WritePage() {
  await requireUser();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        <BackLink href="/add" label="Back to Add" />
        <h1 className="font-display text-2xl">Type it in</h1>
      </div>

      <Card className="p-4">
        <form action={createManualRecipe} className="space-y-4">
          <Field label="Name">
            <Input name="title" required placeholder="Grandma's pot roast" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Serves">
              <Input name="servings" inputMode="numeric" />
            </Field>
            <Field label="Category">
              <Input name="category" placeholder="Mains" />
            </Field>
          </div>

          <Field label="Description">
            <Textarea name="description" rows={2} />
          </Field>

          <Field
            label="Ingredients"
            hint="One per line. Start a line with # for a heading."
          >
            <Textarea
              name="ingredients"
              rows={8}
              placeholder={"2 pounds chuck roast\n1 tablespoon olive oil\nsalt and pepper"}
            />
          </Field>

          <Field label="Steps" hint="One step per line.">
            <Textarea name="instructions" rows={8} />
          </Field>

          <Field label="Notes">
            <Textarea name="notes" rows={2} />
          </Field>

          <Button type="submit" className="w-full">
            Save to my box
          </Button>
        </form>
      </Card>
    </div>
  );
}
