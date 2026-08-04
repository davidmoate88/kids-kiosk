"use client";

import { useActionState } from "react";
import { changePin } from "./actions";

const fieldStyle = { background: "var(--tv-bg)", border: "1px solid var(--tv-divider)" } as const;

export default function AccountClient() {
  const [state, formAction, pending] = useActionState(changePin, undefined);

  return (
    <form
      action={formAction}
      className="flex max-w-sm flex-col gap-4 rounded-lg p-6"
      style={{ background: "var(--tv-surface)" }}
    >
      <h2 className="text-sm font-semibold">Change PIN</h2>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Current PIN</span>
        <input
          name="currentPin"
          type="password"
          inputMode="numeric"
          pattern="\d{4,8}"
          required
          autoComplete="current-password"
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={fieldStyle}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">New PIN</span>
        <input
          name="newPin"
          type="password"
          inputMode="numeric"
          pattern="\d{4,8}"
          required
          minLength={4}
          maxLength={8}
          autoComplete="new-password"
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={fieldStyle}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Confirm new PIN</span>
        <input
          name="confirmPin"
          type="password"
          inputMode="numeric"
          pattern="\d{4,8}"
          required
          minLength={4}
          maxLength={8}
          autoComplete="new-password"
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={fieldStyle}
        />
      </label>

      {state?.error && (
        <p className="text-sm" style={{ color: "#ff7a7a" }}>
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm" style={{ color: "#7affa0" }}>
          PIN updated.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
        style={{ background: "var(--tv-accent-300)", color: "var(--tv-bg)" }}
      >
        {pending ? "Updating…" : "Update PIN"}
      </button>
    </form>
  );
}
