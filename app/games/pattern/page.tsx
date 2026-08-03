"use client";

import { useEffect, useRef, useState } from "react";
import { useProfile } from "@/components/ProfileContext";
import { BigButton, PageHeading } from "@/components/Tile";
import { useStickerAward, StickerToast } from "@/components/StickerAward";

type Phase = "idle" | "showing" | "input" | "success" | "retry";

const PADS = [
  { id: 0, emoji: "🐸", color: "#33c29e" },
  { id: 1, emoji: "🐥", color: "#ffd93d" },
  { id: 2, emoji: "🐬", color: "#3fa7f7" },
  { id: 3, emoji: "🦊", color: "#ff9f5b" },
];

function randomPadId() {
  return Math.floor(Math.random() * PADS.length);
}

export default function PatternGamePage() {
  const { profile } = useProfile();
  const { award, justEarned } = useStickerAward(profile?.id);
  const isLittle = profile?.tier === "little";
  const awardThreshold = isLittle ? 3 : 5;

  const stepMs = isLittle ? 1000 : 750;
  const highlightMs = isLittle ? 520 : 380;

  const [sequence, setSequence] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [activePad, setActivePad] = useState<number | null>(null);
  const [userIndex, setUserIndex] = useState(0);
  const [round, setRound] = useState(0);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function schedule(fn: () => void, delay: number) {
    const t = setTimeout(fn, delay);
    timers.current.push(t);
  }

  useEffect(() => clearTimers, []);

  function playSequence(seq: number[]) {
    clearTimers();
    setPhase("showing");
    seq.forEach((padId, i) => {
      schedule(() => setActivePad(padId), i * stepMs);
      schedule(() => setActivePad(null), i * stepMs + highlightMs);
    });
    schedule(() => {
      setPhase("input");
      setUserIndex(0);
    }, seq.length * stepMs);
  }

  function start() {
    const first = [randomPadId()];
    setSequence(first);
    setRound(1);
    playSequence(first);
  }

  function tapPad(padId: number) {
    if (phase !== "input") return;
    if (padId === sequence[userIndex]) {
      const nextIndex = userIndex + 1;
      if (nextIndex === sequence.length) {
        setPhase("success");
        if (round >= awardThreshold) award("brain-champion");
        schedule(() => {
          const next = [...sequence, randomPadId()];
          setSequence(next);
          setRound((r) => r + 1);
          playSequence(next);
        }, 1100);
      } else {
        setUserIndex(nextIndex);
      }
    } else {
      setPhase("retry");
      schedule(() => playSequence(sequence), 1300);
    }
  }

  if (phase === "idle") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 gap-6 text-center">
        <PageHeading emoji="🧠" title="Pattern Pals" subtitle="Watch the friends, then copy them back!" />
        <BigButton onClick={start} color="var(--games)" colorDark="var(--games-dark)">
          Start
        </BigButton>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-4 landscape:py-2 gap-4 landscape:gap-2 max-w-lg mx-auto">
      <StickerToast sticker={justEarned} />
      <div className="flex items-center justify-between w-full">
        <h1 className="text-2xl landscape:text-xl font-extrabold">🧠 Pattern Pals</h1>
        <div className="text-xl landscape:text-lg font-bold text-games-dark">Round {round}</div>
      </div>

      <p className="text-lg landscape:text-base font-bold text-foreground/60 h-8 landscape:h-6">
        {phase === "showing" && "Watch closely..."}
        {phase === "input" && "Your turn!"}
        {phase === "success" && "Yes! Great job! 🎉"}
        {phase === "retry" && "Let's watch again!"}
      </p>

      <div className="grid grid-cols-2 gap-4 landscape:gap-2 w-full landscape:max-w-xs">
        {PADS.map((pad) => (
          <button
            key={pad.id}
            onClick={() => tapPad(pad.id)}
            disabled={phase !== "input"}
            className="tap-pop aspect-square rounded-[2rem] shadow-lg flex items-center justify-center text-7xl landscape:text-5xl transition-transform"
            style={{
              background: pad.color,
              transform: activePad === pad.id ? "scale(1.08)" : "scale(1)",
              boxShadow:
                activePad === pad.id
                  ? "0 0 0 6px white, 0 8px 24px rgba(0,0,0,0.25)"
                  : undefined,
            }}
            aria-label={`Pad ${pad.emoji}`}
          >
            {pad.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
