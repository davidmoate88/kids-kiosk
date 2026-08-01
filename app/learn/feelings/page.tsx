"use client";

import { useState } from "react";
import { PageHeading, BigButton } from "@/components/Tile";
import { speak } from "@/lib/speak";

type Feeling = {
  id: string;
  emoji: string;
  label: string;
  needsCalm: boolean;
  message: string;
};

const FEELINGS: Feeling[] = [
  { id: "happy", emoji: "😊", label: "Happy", needsCalm: false, message: "Yay! Happy feelings are lovely!" },
  { id: "excited", emoji: "🤩", label: "Excited", needsCalm: false, message: "Wow, exciting! Let's channel that energy!" },
  { id: "calm", emoji: "😌", label: "Calm", needsCalm: false, message: "Nice and calm, well done." },
  { id: "silly", emoji: "🤪", label: "Silly", needsCalm: false, message: "Being silly is fun sometimes!" },
  { id: "sad", emoji: "😢", label: "Sad", needsCalm: true, message: "It's okay to feel sad. Let's breathe together." },
  { id: "angry", emoji: "😠", label: "Angry", needsCalm: true, message: "Big feelings! Let's breathe together." },
  { id: "scared", emoji: "😨", label: "Scared", needsCalm: true, message: "You are safe. Let's breathe together." },
  { id: "tired", emoji: "😴", label: "Tired", needsCalm: true, message: "Resting is good. Let's breathe together." },
];

export default function FeelingsPage() {
  const [selected, setSelected] = useState<Feeling | null>(null);

  function pick(feeling: Feeling) {
    setSelected(feeling);
    speak(`${feeling.label}. ${feeling.message}`);
  }

  if (selected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
        {selected.needsCalm ? (
          <>
            <div className="w-40 h-40 rounded-full bg-learn/70 breathe" />
            <p className="text-3xl font-extrabold">Breathe in... breathe out...</p>
            <p className="text-xl text-foreground/70 max-w-sm">{selected.message}</p>
          </>
        ) : (
          <>
            <p className="text-8xl gentle-bob">{selected.emoji}</p>
            <p className="text-3xl font-extrabold">{selected.message}</p>
          </>
        )}
        <BigButton onClick={() => setSelected(null)} color="var(--learn)" colorDark="var(--learn-dark)">
          I feel better 💚
        </BigButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 gap-6 max-w-2xl mx-auto">
      <PageHeading emoji="😊" title="How am I feeling?" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full pb-6">
        {FEELINGS.map((f) => (
          <button
            key={f.id}
            onClick={() => pick(f)}
            className="tap-pop flex flex-col items-center gap-2 rounded-2xl p-4 bg-white shadow-lg"
          >
            <span className="text-6xl">{f.emoji}</span>
            <span className="text-lg font-bold">{f.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
