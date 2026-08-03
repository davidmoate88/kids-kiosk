"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/components/ProfileContext";
import { PageHeading } from "@/components/Tile";
import { STICKERS, getEarnedStickers } from "@/lib/stickers";

export default function RewardsPage() {
  const { profile } = useProfile();
  const [earned, setEarned] = useState<string[]>([]);

  useEffect(() => {
    // Re-read localStorage whenever the active profile changes so switching
    // players shows that child's own sticker collection.
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEarned(getEarnedStickers(profile.id));
    }
  }, [profile]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-6 landscape:py-4 gap-4 landscape:gap-3 max-w-4xl landscape:max-w-6xl mx-auto">
      <PageHeading
        emoji="🏅"
        title="My Stickers"
        subtitle={`${earned.length} of ${STICKERS.length} collected`}
      />
      <div className="grid grid-cols-3 sm:grid-cols-4 landscape:grid-cols-6 gap-5 landscape:gap-3 w-full pb-10 landscape:pb-4">
        {STICKERS.map((sticker) => {
          const has = earned.includes(sticker.id);
          return (
            <div
              key={sticker.id}
              className={`flex flex-col items-center gap-2 rounded-2xl p-6 shadow ${
                has ? "bg-white" : "bg-white/50"
              }`}
            >
              <span className={`text-6xl md:text-7xl ${has ? "" : "grayscale opacity-30"}`}>
                {sticker.emoji}
              </span>
              <span
                className={`text-sm md:text-base font-bold text-center leading-tight ${
                  has ? "" : "text-foreground/30"
                }`}
              >
                {has ? sticker.name : "?"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
