import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq, and, gt, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, sessions, households } from "@/lib/db/schema";

const COOKIE = "pinkbox_session";
/** Mom should never be asked to log in again on her own phone. */
const SESSION_DAYS = 365;

function tokenToId(token: string) {
  // Store only a hash, so a database dump does not hand over live sessions.
  return createHash("sha256")
    .update(token + (process.env.SESSION_SECRET ?? ""))
    .digest("hex");
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function checkInviteCode(supplied: string) {
  const expected = process.env.INVITE_CODE ?? "";
  if (!expected) return false;
  const a = Buffer.from(supplied.trim().toLowerCase());
  const b = Buffer.from(expected.trim().toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);

  await db.insert(sessions).values({ id: tokenToId(token), userId, expiresAt });

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });

  // Opportunistic cleanup; there is no cron on the free plan.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, tokenToId(token)));
  jar.delete(COOKIE);
}

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  householdId: string;
  householdName: string;
};

/** Deduplicated per request, so layout and page do not each hit the database. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      householdId: users.householdId,
      householdName: households.name,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .innerJoin(households, eq(households.id, users.householdId))
    .where(and(eq(sessions.id, tokenToId(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return rows[0] ?? null;
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
