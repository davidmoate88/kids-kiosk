"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div
      className="flex min-h-dvh items-center justify-center px-6"
      style={{ background: "var(--tv-bg)", color: "var(--tv-text)" }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-8"
        style={{ background: "var(--tv-surface)", boxShadow: "var(--tv-shadow-md)" }}
      >
        <h1 className="text-xl font-semibold">Kids Kiosk — Parents</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--tv-text-muted)" }}>
          Sign in to manage what&apos;s approved.
        </p>

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "var(--tv-bg)", border: "1px solid var(--tv-divider)" }}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "var(--tv-bg)", border: "1px solid var(--tv-divider)" }}
            />
          </label>

          {state?.error && (
            <p className="text-sm" style={{ color: "#ff7a7a" }}>
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
            style={{ background: "var(--tv-accent-300)", color: "var(--tv-bg)" }}
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
