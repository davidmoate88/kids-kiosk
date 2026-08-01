"use client";

import { useEffect, useState } from "react";
import { PICTURES } from "@/lib/colouring-pictures";
import ColouringSvg from "@/components/ColouringSvg";
import { PageHeading } from "@/components/Tile";
import { useProfile } from "@/components/ProfileContext";
import { useStickerAward, StickerToast } from "@/components/StickerAward";

const PALETTE = [
  "#ff5c5c",
  "#ff9f5b",
  "#ffd93d",
  "#8bd450",
  "#33c29e",
  "#3fa7f7",
  "#7c7cff",
  "#b07df0",
  "#ff7ac6",
  "#8a5a3b",
  "#ffd9b3",
  "#c68642",
  "#b0b8c1",
  "#2b2440",
  "#ffffff",
];

export default function ColouringPage() {
  const { profile } = useProfile();
  const { award, justEarned } = useStickerAward(profile?.id);
  const [pictureId, setPictureId] = useState(PICTURES[0].id);
  const [colorsByPicture, setColorsByPicture] = useState<Record<string, Record<string, string>>>({});
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);

  const picture = PICTURES.find((p) => p.id === pictureId)!;
  const colors = colorsByPicture[pictureId] ?? {};

  const paintableRegions = picture.regions.filter((r) => r.id !== "sky");
  const isComplete = paintableRegions.every((r) => colors[r.id]);

  useEffect(() => {
    if (isComplete) award(`colour-${pictureId}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, pictureId]);

  function paintRegion(regionId: string) {
    setColorsByPicture((prev) => ({
      ...prev,
      [pictureId]: { ...(prev[pictureId] ?? {}), [regionId]: selectedColor },
    }));
  }

  function clearPicture() {
    setColorsByPicture((prev) => ({ ...prev, [pictureId]: {} }));
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-6 max-w-3xl mx-auto">
      <StickerToast sticker={justEarned} />
      <PageHeading emoji="🖍️" title="Colouring" />

      <div className="flex gap-4 overflow-x-auto w-full px-2 pb-1">
        {PICTURES.map((p) => (
          <button
            key={p.id}
            onClick={() => setPictureId(p.id)}
            className={`tap-pop shrink-0 flex flex-col items-center gap-1 px-5 py-3 rounded-2xl shadow ${
              p.id === pictureId ? "bg-colouring text-white" : "bg-white"
            }`}
          >
            <span className="text-4xl">{p.emoji}</span>
            <span className="text-base font-bold">{p.name}</span>
          </button>
        ))}
      </div>

      <div className="relative w-full max-w-xl aspect-square rounded-[2rem] bg-white shadow-xl p-6">
        <ColouringSvg picture={picture} colors={colors} onRegionClick={paintRegion} />
        {isComplete && (
          <div className="absolute -top-3 -right-3 text-5xl gentle-bob">✅</div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 max-w-lg">
        {PALETTE.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedColor(c)}
            className="tap-pop w-14 h-14 rounded-full shadow-md"
            style={{
              background: c,
              outline: selectedColor === c ? "5px solid var(--colouring-dark)" : "3px solid rgba(0,0,0,0.15)",
              outlineOffset: 2,
            }}
            aria-label={`Colour ${c}`}
          />
        ))}
      </div>

      <button
        onClick={clearPicture}
        className="tap-pop mb-6 flex items-center gap-2 rounded-2xl px-8 py-4 bg-white shadow font-bold text-xl text-foreground/70"
      >
        🧹 Clear
      </button>
    </div>
  );
}
