"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthState } from "@/lib/actions/auth";
import { Button, Card, ErrorNote, Field, Input } from "@/components/ui";

export default function LoginPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    loginAction,
    {},
  );

  return (
    <Card className="p-6">
      <h1 className="font-display mb-6 text-center text-2xl">Welcome back</h1>

      <form action={action} className="space-y-4">
        <ErrorNote>{state.error}</ErrorNote>

        <Field label="Email">
          <Input
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Password">
          <Input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Your password"
          />
        </Field>

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Opening the box…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-[0.95rem] text-muted">
        First time here?{" "}
        <Link href="/join" className="font-bold text-pink underline underline-offset-2">
          Set up your box
        </Link>
      </p>
    </Card>
  );
}
