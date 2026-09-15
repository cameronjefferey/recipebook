"use server";

import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
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

/** Guessed at, this would let a stranger into somebody's box, so: 128 bits. */
function newBoxCode() {
  return randomBytes(16).toString("base64url");
}

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
  redirect("/recipes");
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

  // Two different permissions, easily confused. The code above says whether
  // you may make an account at all; this one says whether you may walk into
  // somebody's existing box. Without a box code you get one of your own,
  // which is what makes it possible to share only some of it with someone.
  const boxCode = String(formData.get("box") ?? "").trim();
  let household;

  if (boxCode) {
    [household] = await db
      .select()
      .from(households)
      .where(eq(households.inviteCode, boxCode))
      .limit(1);
    if (!household) return { error: "That box invitation is not right." };
  } else {
    [household] = await db
      .insert(households)
      .values({ name: `${name}'s recipes`, inviteCode: newBoxCode() })
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
  redirect("/recipes");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
