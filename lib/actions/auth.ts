"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, households } from "@/lib/db/schema";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  checkInviteCode,
} from "@/lib/auth";

export type AuthState = { error?: string };

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Same message either way, so this cannot be used to discover who has an account.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "That email and password do not match." };
  }

  await createSession(user.id);
  redirect("/box");
}

export async function joinAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const invite = String(formData.get("invite") ?? "");

  if (!name) return { error: "What should we call you?" };
  if (!email.includes("@")) return { error: "That email does not look right." };
  if (password.length < 8)
    return { error: "Please use a password of at least 8 characters." };
  if (!checkInviteCode(invite))
    return { error: "That invite code is not right." };

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) return { error: "There is already an account for that email." };

  // The first person to join creates the box; everyone after shares it.
  let [household] = await db.select().from(households).limit(1);
  if (!household) {
    [household] = await db
      .insert(households)
      .values({
        name: "The Pink Recipe Box",
        inviteCode: process.env.INVITE_CODE ?? "family",
      })
      .returning();
  }

  const [user] = await db
    .insert(users)
    .values({
      householdId: household.id,
      email,
      name,
      passwordHash: await hashPassword(password),
    })
    .returning();

  await createSession(user.id);
  redirect("/box");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
