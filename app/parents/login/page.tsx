"use client";

import { Suspense } from "react";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login } from "./actions";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);
  // Auth.js appends ?callbackUrl=<originally-requested path> when it
  // redirects an unauthenticated user here from the proxy. Suspense-bounded
  // useSearchParams, so a missing callbackUrl just means "default to the
  // profile picker" (which then sends you into /watch via the shell).
  const params = useSearchParams();
  const callbackRaw = params.get("callbackUrl");
  const callbackUrl =
    callbackRaw && callbackRaw.startsWith("/") && !callbackRaw.startsWith("//")
      ? callbackRaw
      : "/parents";

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
          Enter the PIN to manage what&apos;s approved.
        </p>

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">PIN</span>
            <input
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="\d{4,8}"
              required
              autoComplete="current-password"
              autoFocus
              placeholder="••••"
              className="rounded-lg px-3 py-2 text-lg tracking-[0.3em] outline-none"
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
