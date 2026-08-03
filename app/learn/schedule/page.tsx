"use client";

import { useEffect, useState } from "react";
import { PageHeading } from "@/components/Tile";
import { speak } from "@/lib/speak";
import { useProfile } from "@/components/ProfileContext";
import { useStickerAward, StickerToast } from "@/components/StickerAward";
import { TASK_CARDS as CARDS, type CardDef } from "@/lib/task-cards";

export default function SchedulePage() {
  const { profile } = useProfile();
  const { award, justEarned } = useStickerAward(profile?.id);
  const [held, setHeld] = useState<string | null>(null);
  const [first, setFirst] = useState<string | null>(null);
  const [then, setThen] = useState<string | null>(null);

  useEffect(() => {
    if (first && then) award("planner-pro");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [first, then]);

  function tapCard(card: CardDef) {
    speak(card.label);
    setHeld(card.id);
  }

  function tapSlot(slot: "first" | "then") {
    const setter = slot === "first" ? setFirst : setThen;
    const current = slot === "first" ? first : then;

    if (held) {
      setter(held);
      setHeld(null);
    } else if (current) {
      setter(null);
    }
  }

  function clearAll() {
    setFirst(null);
    setThen(null);
    setHeld(null);
  }

  const cardById = (id: string | null) => CARDS.find((c) => c.id === id) ?? null;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-4 landscape:py-2 gap-6 landscape:gap-3 max-w-3xl mx-auto">
      <StickerToast sticker={justEarned} />
      <PageHeading emoji="🗓️" title="First, Then" subtitle={held ? `Tap a box to place "${cardById(held)?.label}"` : "Tap a card, then tap a box"} />

      <div className="flex gap-4 landscape:gap-2 w-full max-w-md landscape:max-w-xs">
        <Slot label="FIRST" card={cardById(first)} onTap={() => tapSlot("first")} />
        <Slot label="THEN" card={cardById(then)} onTap={() => tapSlot("then")} />
      </div>

      {first && then && (
        <p className="text-2xl landscape:text-xl font-extrabold text-learn-dark">✅ All set! Off we go!</p>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-5 landscape:grid-cols-6 gap-3 landscape:gap-2 w-full max-w-2xl landscape:max-w-4xl pb-4 landscape:pb-1">
        {CARDS.map((card) => (
          <button
            key={card.id}
            onClick={() => tapCard(card)}
            className={`tap-pop flex flex-col items-center gap-1 rounded-2xl p-3 shadow ${
              held === card.id ? "bg-learn text-white ring-4 ring-learn-dark" : "bg-white"
            }`}
          >
            <span className="text-4xl">{card.emoji}</span>
            <span className="text-xs font-bold text-center leading-tight">{card.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={clearAll}
        className="tap-pop mb-6 landscape:mb-2 flex items-center gap-2 rounded-2xl px-6 py-3 landscape:py-2 bg-white shadow font-bold text-foreground/70"
      >
        🧹 Clear
      </button>
    </div>
  );
}

function Slot({
  label,
  card,
  onTap,
}: {
  label: string;
  card: CardDef | null;
  onTap: () => void;
}) {
  return (
    <button
      onClick={onTap}
      className="tap-pop flex-1 aspect-square rounded-3xl bg-white shadow-lg border-4 border-dashed border-learn/50 flex flex-col items-center justify-center gap-2"
    >
      <span className="text-sm font-extrabold text-learn-dark tracking-wide">{label}</span>
      {card ? (
        <>
          <span className="text-5xl">{card.emoji}</span>
          <span className="text-sm font-bold">{card.label}</span>
        </>
      ) : (
        <span className="text-4xl text-foreground/20">＋</span>
      )}
    </button>
  );
}
