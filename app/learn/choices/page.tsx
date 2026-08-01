"use client";

import { useState } from "react";
import { PageHeading } from "@/components/Tile";
import { speak } from "@/lib/speak";

type Option = { id: string; emoji: string; label: string };
type ChoiceSet = { id: string; title: string; options: Option[] };

const SETS: ChoiceSet[] = [
  {
    id: "snack",
    title: "Snack Time",
    options: [
      { id: "apple", emoji: "🍎", label: "Apple" },
      { id: "crackers", emoji: "🍘", label: "Crackers" },
      { id: "banana", emoji: "🍌", label: "Banana" },
    ],
  },
  {
    id: "activity",
    title: "What Shall We Do?",
    options: [
      { id: "blocks", emoji: "🧱", label: "Blocks" },
      { id: "books", emoji: "📚", label: "Books" },
      { id: "puzzle", emoji: "🧩", label: "Puzzle" },
    ],
  },
  {
    id: "where",
    title: "Inside or Outside?",
    options: [
      { id: "outside", emoji: "🌳", label: "Outside" },
      { id: "inside", emoji: "🏠", label: "Inside" },
    ],
  },
];

export default function ChoicesPage() {
  const [setId, setSetId] = useState(SETS[0].id);
  const [selections, setSelections] = useState<Record<string, string>>({});

  const set = SETS.find((s) => s.id === setId)!;
  const chosen = selections[setId];

  function choose(option: Option) {
    setSelections((prev) => ({ ...prev, [setId]: option.id }));
    speak(`${option.label}`);
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 gap-6 max-w-2xl mx-auto">
      <PageHeading emoji="🤔" title="I Choose" />

      <div className="flex gap-3 flex-wrap justify-center">
        {SETS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSetId(s.id)}
            className={`tap-pop px-5 py-3 rounded-2xl font-bold shadow ${
              s.id === setId ? "bg-learn text-white" : "bg-white text-foreground/70"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 pt-4 pb-10">
        {set.options.map((opt) => {
          const isChosen = chosen === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => choose(opt)}
              className="tap-pop relative flex flex-col items-center gap-2 rounded-3xl p-6 w-40 shadow-lg bg-white"
              style={{
                outline: isChosen ? "5px solid var(--learn-dark)" : "none",
                outlineOffset: 3,
              }}
            >
              {isChosen && (
                <span className="absolute -top-3 -right-3 text-3xl">✅</span>
              )}
              <span className="text-6xl">{opt.emoji}</span>
              <span className="text-xl font-extrabold">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
