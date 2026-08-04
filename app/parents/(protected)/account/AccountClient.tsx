"use client";

import { useActionState } from "react";
import { changePassword } from "./actions";

const fieldStyle = { background: "var(--tv-bg)", border: "1px solid var(--tv-divider)" } as const;

export default function AccountClient() {
  const [state, formAction, pending] = useActionState(changePassword, undefined);

  return (
    <form
      action={formAction}
      className="flex max-w-sm flex-col gap-4 rounded-lg p-6"
      style={{ background: "var(--tv-surface)" }}
    >
      <h2 className="text-sm font-semibold">Change password</h2>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Current password</span>
        <input
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={fieldStyle}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">New password</span>
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={fieldStyle}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Confirm new password</span>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
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
          Password updated.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
        style={{ background: "var(--tv-accent-300)", color: "var(--tv-bg)" }}
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
