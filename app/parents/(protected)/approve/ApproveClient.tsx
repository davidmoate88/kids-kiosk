"use client";

import { useState, useTransition } from "react";
import { approveTitle } from "./actions";

type Item = {
  id: string;
  name: string;
  folder: string | null;
  kind: "channel" | "playlist" | null;
  catalogueName: string | null;
  episodeCount: number;
};

export default function ApproveClient({ items }: { items: Item[] }) {
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const justApproved = approvedIds.has(item.id);
        return (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg p-4"
            style={{ background: "var(--tv-surface)", opacity: justApproved ? 0.5 : 1 }}
          >
            <div>
              <div className="font-medium">{item.name}</div>
              <div className="text-xs" style={{ color: "var(--tv-text-muted)" }}>
                {item.folder ?? "Songs & Learning"} ·{" "}
                {item.episodeCount > 0 ? `${item.episodeCount} episode(s)` : "single video"}
              </div>
            </div>
            <button
              type="button"
              disabled={justApproved}
              onClick={() => {
                setApprovedIds((prev) => new Set(prev).add(item.id));
                startTransition(() => {
                  approveTitle(item.id);
                });
              }}
              className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-60"
              style={{ background: "var(--tv-accent-300)", color: "var(--tv-bg)" }}
            >
              {justApproved ? "Approved" : "Approve"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
