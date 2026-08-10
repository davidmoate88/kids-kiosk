"use client";

import { useActionState } from "react";
import { requestTvRefresh } from "./actions";

export default function RefreshTvButton() {
  const [state, formAction, pending] = useActionState(requestTvRefresh, undefined);

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-60"
        style={{
          border: "1px solid var(--tv-divider)",
          color: state?.success ? "#7affa0" : "var(--tv-text)",
        }}
      >
        {pending ? "Refreshing TV…" : state?.success ? "TV refresh requested ✓" : "Refresh TV"}
      </button>
    </form>
  );
}
