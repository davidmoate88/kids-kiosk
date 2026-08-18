"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/components/ProfileContext";
import { PageHeading } from "@/components/Tile";
import { type HistoryItem, getWatchHistory } from "@/lib/watch-history";

export default function HistoryClient() {
  const { profile } = useProfile();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getWatchHistory().then((rows) => {
      if (!cancelled) setItems(rows);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // profile is just a nice-to-have for the greeting when one happens to be
  // active — the history itself is shared household-wide, not gated on it.
  const pageTitle = profile ? `Hello ${profile.name}!` : "Watch Again?";
  const pageEmoji = profile?.avatar ?? "📺";

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-6 gap-6 max-w-4xl landscape:max-w-6xl mx-auto">
      <PageHeading emoji={pageEmoji} title={pageTitle} subtitle="Watch again?" />

      {loading && (
        <p className="text-foreground/50 text-xl animate-pulse">Loading…</p>
      )}

      {!loading && items.length === 0 && (
        <p className="text-foreground/50 text-lg text-center">
          Nothing here yet! Go watch something and it&apos;ll show up. 🍿
        </p>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 landscape:grid-cols-4 gap-5 landscape:gap-3 w-full pb-10">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/watch?v=${encodeURIComponent(item.videoId)}&src=${encodeURIComponent(item.source)}`}
              className="tap-pop flex flex-col items-center gap-2 landscape:gap-1 rounded-3xl p-3 landscape:p-2 shadow-lg bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
            >
              <span className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/10">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-3xl">
                    {item.source === "youtube" ? "📺" : "🎬"}
                  </span>
                )}
                <span className="absolute inset-0 flex items-center justify-center text-4xl landscape:text-3xl drop-shadow opacity-0 hover:opacity-100 transition-opacity">
                  ▶️
                </span>
              </span>
              <span className="text-sm font-bold text-center leading-tight">{item.title}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
