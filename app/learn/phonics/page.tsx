"use client";

import { useState } from "react";
import { PageHeading, BigButton } from "@/components/Tile";
import { PHONICS_SETS, type Grapheme } from "@/lib/phonics";
import { speak } from "@/lib/speak";
import { useProfile } from "@/components/ProfileContext";
import { useStickerAward, StickerToast } from "@/components/StickerAward";

export default function PhonicsPage() {
  const { profile } = useProfile();
  const { award, justEarned } = useStickerAward(profile?.id);
  const [setIndex, setSetIndex] = useState(0);
  const [explored, setExplored] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Grapheme | null>(null);

  const currentSet = PHONICS_SETS[setIndex];

  function pick(grapheme: Grapheme) {
    setSelected(grapheme);
    speak(grapheme.keyword);
    const next = { ...explored, [grapheme.id]: true };
    setExplored(next);
    if (currentSet.graphemes.every((g) => next[g.id])) {
      award("letter-detective");
    }
  }

  if (selected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
        <StickerToast sticker={justEarned} />
        <p className="text-8xl font-extrabold text-learn-dark">{selected.letters}</p>
        <p className="text-7xl gentle-bob">{selected.emoji}</p>
        <p className="text-3xl font-extrabold">{selected.keyword}</p>
        <BigButton onClick={() => setSelected(null)} color="var(--learn)" colorDark="var(--learn-dark)">
          Back to Letters
        </BigButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-6 max-w-3xl mx-auto">
      <StickerToast sticker={justEarned} />
      <PageHeading emoji="🔤" title="Letter Sounds" subtitle="Tap a letter to hear it!" />

      <div className="flex gap-3 flex-wrap justify-center">
        {PHONICS_SETS.map((set, i) => {
          const isDone = set.graphemes.every((g) => explored[g.id]);
          return (
            <button
              key={set.id}
              onClick={() => setSetIndex(i)}
              className={`tap-pop px-5 py-3 rounded-2xl font-bold shadow flex items-center gap-2 ${
                i === setIndex ? "bg-learn text-white" : "bg-white text-foreground/70"
              }`}
            >
              {set.label}
              {isDone && <span>✅</span>}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-4 w-full max-w-lg pb-10">
        {currentSet.graphemes.map((g) => (
          <button
            key={g.id}
            onClick={() => pick(g)}
            className="tap-pop aspect-square rounded-3xl shadow-lg flex flex-col items-center justify-center gap-1 bg-white"
          >
            <span className="text-4xl font-extrabold text-learn-dark">{g.letters}</span>
            <span className="text-2xl">{g.emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
