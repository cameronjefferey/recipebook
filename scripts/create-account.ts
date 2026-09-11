/**
 * Creates an account directly, for when you cannot get at the sign-up form.
 *
 *   npx tsx scripts/create-account.ts "Name" email@example.com password
 *
 * Mirrors joinAction: the first account also creates the shared household.
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { households, users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth";

async function main() {
  const [name, rawEmail, password] = process.argv.slice(2);
  if (!name || !rawEmail || !password) {
    throw new Error('usage: create-account.ts "Name" email password');
  }
  if (password.length < 8) throw new Error("password must be 8+ characters");

  const email = rawEmail.trim().toLowerCase();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) throw new Error(`${email} already has an account`);

  let [household] = await db.select().from(households).limit(1);
  household ??= (
    await db
      .insert(households)
      .values({
        name: "The Pink Recipe Box",
        inviteCode: process.env.INVITE_CODE ?? "family",
      })
      .returning()
  )[0];

  await db.insert(users).values({
    householdId: household.id,
    email,
    name,
    passwordHash: await hashPassword(password),
  });

  console.log(`created ${email} in household "${household.name}"`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
