"use client";

import { useState, useTransition } from "react";
import { approveQueueEntry, skipQueueEntry } from "./actions";

type Item = {
  id: string;
  createdAt: Date;
  episodeName: string;
  titleName: string;
  folder: string | null;
};

export default function WaitingClient({ items }: { items: Item[] }) {
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  function resolve(id: string, action: (id: string) => Promise<void>) {
    setResolvedIds((prev) => new Set(prev).add(id));
    startTransition(() => {
      action(id);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        if (resolvedIds.has(item.id)) return null;
        return (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg p-4"
            style={{ background: "var(--tv-surface)" }}
          >
            <div>
              <div className="font-medium">{item.episodeName}</div>
              <div className="text-xs" style={{ color: "var(--tv-text-muted)" }}>
                {item.titleName} · {item.folder ?? "Songs & Learning"}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => resolve(item.id, skipQueueEntry)}
                className="rounded-lg px-3 py-1.5 text-sm"
                style={{ border: "1px solid var(--tv-divider)" }}
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => resolve(item.id, approveQueueEntry)}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold"
                style={{ background: "var(--tv-accent-300)", color: "var(--tv-bg)" }}
              >
                Approve
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
