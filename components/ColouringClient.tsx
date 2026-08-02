"use client";

import { useEffect, useState } from "react";
import { PICTURES } from "@/lib/colouring-pictures";
import ColouringSvg from "@/components/ColouringSvg";
import ColouringCanvas from "@/components/ColouringCanvas";
import FreeDrawCanvas from "@/components/FreeDrawCanvas";
import { PageHeading } from "@/components/Tile";
import { useProfile } from "@/components/ProfileContext";
import { useStickerAward, StickerToast } from "@/components/StickerAward";

export type UserImage = { id: string; name: string; src: string };

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

type PickerItem =
  | { kind: "svg"; id: string; name: string; emoji: string }
  | { kind: "raster"; id: string; name: string; src: string }
  | { kind: "draw"; id: string; name: string };

export default function ColouringClient({ userImages }: { userImages: UserImage[] }) {
  const { profile } = useProfile();
  const { award, justEarned } = useStickerAward(profile?.id);

  const items: PickerItem[] = [
    ...PICTURES.map((p) => ({ kind: "svg" as const, id: p.id, name: p.name, emoji: p.emoji })),
    ...userImages.map((img) => ({ kind: "raster" as const, id: img.id, name: img.name, src: img.src })),
    { kind: "draw" as const, id: "free-draw", name: "Free Draw" },
  ];

  const [pictureId, setPictureId] = useState(items[0]?.id ?? "");
  const [colorsByPicture, setColorsByPicture] = useState<Record<string, Record<string, string>>>({});
  const [rasterResetKeys, setRasterResetKeys] = useState<Record<string, number>>({});
  const [rasterDone, setRasterDone] = useState<Record<string, boolean>>({});
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);

  const current = items.find((i) => i.id === pictureId);
  const svgPicture = current?.kind === "svg" ? PICTURES.find((p) => p.id === current.id) : undefined;
  const colors = colorsByPicture[pictureId] ?? {};

  const paintableRegions = svgPicture?.regions.filter((r) => r.id !== "sky") ?? [];
  const isSvgComplete = svgPicture ? paintableRegions.every((r) => colors[r.id]) : false;

  useEffect(() => {
    if (svgPicture && isSvgComplete) award(`colour-${pictureId}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSvgComplete, pictureId]);

  function paintRegion(regionId: string) {
    setColorsByPicture((prev) => ({
      ...prev,
      [pictureId]: { ...(prev[pictureId] ?? {}), [regionId]: selectedColor },
    }));
  }

  function clearPicture() {
    if (svgPicture) {
      setColorsByPicture((prev) => ({ ...prev, [pictureId]: {} }));
    } else {
      setRasterResetKeys((prev) => ({ ...prev, [pictureId]: (prev[pictureId] ?? 0) + 1 }));
      setRasterDone((prev) => ({ ...prev, [pictureId]: false }));
    }
  }

  function markRasterDone() {
    setRasterDone((prev) => ({ ...prev, [pictureId]: true }));
    award("budding-artist");
  }

  if (!current) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-4 text-center">
        <PageHeading emoji="🖍️" title="Colouring" />
        <p className="text-foreground/50 text-lg">No pictures yet!</p>
      </div>
    );
  }

  const isComplete = svgPicture ? isSvgComplete : !!rasterDone[pictureId];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-6 max-w-3xl mx-auto">
      <StickerToast sticker={justEarned} />
      <PageHeading emoji="🖍️" title="Colouring" />

      <div className="flex gap-4 overflow-x-auto w-full px-2 pb-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setPictureId(item.id)}
            className={`tap-pop shrink-0 flex flex-col items-center gap-1 px-5 py-3 rounded-2xl shadow ${
              item.id === pictureId ? "bg-colouring text-white" : "bg-white"
            }`}
          >
            {item.kind === "svg" ? (
              <span className="text-4xl">{item.emoji}</span>
            ) : item.kind === "draw" ? (
              <span className="text-4xl">✏️</span>
            ) : (
              <span className="text-4xl">🖼️</span>
            )}
            <span className="text-base font-bold">{item.name}</span>
          </button>
        ))}
      </div>

      <div className="relative w-full max-w-xl aspect-square rounded-[2rem] bg-white shadow-xl p-6">
        {svgPicture ? (
          <ColouringSvg picture={svgPicture} colors={colors} onRegionClick={paintRegion} />
        ) : current.kind === "draw" ? (
          <FreeDrawCanvas selectedColor={selectedColor} resetKey={rasterResetKeys[pictureId] ?? 0} />
        ) : (
          <ColouringCanvas
            src={(current as { src: string }).src}
            selectedColor={selectedColor}
            resetKey={rasterResetKeys[pictureId] ?? 0}
          />
        )}
        {isComplete && <div className="absolute -top-3 -right-3 text-5xl gentle-bob">✅</div>}
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

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={clearPicture}
          className="tap-pop flex items-center gap-2 rounded-2xl px-8 py-4 bg-white shadow font-bold text-xl text-foreground/70"
        >
          🧹 Clear
        </button>
        {!svgPicture && !isComplete && (
          <button
            onClick={markRasterDone}
            className="tap-pop flex items-center gap-2 rounded-2xl px-8 py-4 shadow font-bold text-xl text-white"
            style={{ background: "linear-gradient(160deg, var(--learn), var(--learn-dark))" }}
          >
            ✅ All Done!
          </button>
        )}
      </div>
    </div>
  );
}
