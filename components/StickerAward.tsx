"use client";

import { useCallback, useState } from "react";
import { awardSticker, STICKERS, type Sticker } from "@/lib/stickers";
import { chime } from "@/lib/speak";

export function useStickerAward(profileId: string | undefined) {
  const [justEarned, setJustEarned] = useState<Sticker | null>(null);

  const award = useCallback(
    (stickerId: string) => {
      if (!profileId) return;
      const isNew = awardSticker(profileId, stickerId);
      if (isNew) {
        const sticker = STICKERS.find((s) => s.id === stickerId) ?? null;
        if (sticker) {
          chime();
          setJustEarned(sticker);
          setTimeout(() => setJustEarned(null), 2600);
        }
      }
    },
    [profileId]
  );

  return { award, justEarned };
}

export function StickerToast({ sticker }: { sticker: Sticker | null }) {
  if (!sticker) return null;
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white rounded-2xl shadow-2xl px-6 py-4 gentle-bob pointer-events-none">
      <span className="text-4xl">{sticker.emoji}</span>
      <div>
        <p className="text-xs font-bold text-foreground/50 uppercase tracking-wide">
          New Sticker!
        </p>
        <p className="text-lg font-extrabold">{sticker.name}</p>
      </div>
    </div>
  );
}
