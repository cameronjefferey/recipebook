"use client";

import Link from "next/link";
import { useActionState } from "react";
import { joinAction, type AuthState } from "@/lib/actions/auth";
import { Button, Card, ErrorNote, Field, Input } from "@/components/ui";

export default function JoinPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    joinAction,
    {},
  );

  return (
    <Card className="p-6">
      <h1 className="font-display mb-6 text-center text-2xl">
        Set up your box
      </h1>

      <form action={action} className="space-y-4">
        <ErrorNote>{state.error}</ErrorNote>

        <Field label="Your name">
          <Input name="name" autoComplete="name" required placeholder="Mom" />
        </Field>

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

        <Field label="Password" hint="At least 8 characters.">
          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </Field>

        <Field label="Invite code" hint="Ask whoever set up the box.">
          <Input name="invite" required autoCapitalize="none" />
        </Field>

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Setting up…" : "Create my box"}
        </Button>
      </form>

      <p className="mt-6 text-center text-[0.95rem] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-pink underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
