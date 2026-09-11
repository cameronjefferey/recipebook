"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { importFromUrl } from "@/lib/import-url";
import { bringInComponents, saveImported } from "@/lib/component-recipes";

export type ImportState = { error?: string };

export async function importUrlAction(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const user = await requireUser();
  const url = String(formData.get("url") ?? "").trim();
  if (!url) return { error: "Paste a link first." };

  let recipeId: string;
  try {
    const imported = await importFromUrl(url);

    // Some of what this recipe calls for is other recipes. Fetch those first,
    // so the one you asked for arrives with its parts already on the shelf.
    const ingredients = await bringInComponents(user, imported.ingredients);

    recipeId = await saveImported(user, url, imported, ingredients);
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "That link could not be read.",
    };
  }

  revalidatePath("/box");
  redirect(`/r/${recipeId}`);
}
