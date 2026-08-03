"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeading, BigButton } from "@/components/Tile";
import { chime, speak } from "@/lib/speak";
import { useProfile } from "@/components/ProfileContext";
import { useStickerAward, StickerToast } from "@/components/StickerAward";

const PRESETS = [
  { label: "1 min", seconds: 60 },
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
];

export default function TimerPage() {
  const { profile } = useProfile();
  const { award, justEarned } = useStickerAward(profile?.id);
  const [total, setTotal] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    if (total === null || paused || done) return;
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          if (!doneRef.current) {
            doneRef.current = true;
            setDone(true);
            chime();
            speak("Time's up! Well done.");
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [total, paused, done]);

  useEffect(() => {
    if (done) award("timer-team");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function start(seconds: number) {
    doneRef.current = false;
    setTotal(seconds);
    setRemaining(seconds);
    setPaused(false);
    setDone(false);
  }

  function reset() {
    setTotal(null);
    setRemaining(0);
    setPaused(false);
    setDone(false);
    doneRef.current = false;
  }

  if (total === null) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-6 landscape:py-3 gap-8 landscape:gap-4 max-w-3xl mx-auto">
        <PageHeading emoji="⏳" title="Timer" subtitle="How long shall we count down?" />
        <div className="grid grid-cols-2 gap-5 landscape:gap-3 w-full max-w-sm">
          {PRESETS.map((p) => (
            <button
              key={p.seconds}
              onClick={() => start(p.seconds)}
              className="tap-pop rounded-3xl py-8 text-2xl font-extrabold text-white shadow-lg"
              style={{ background: "linear-gradient(160deg, var(--learn), var(--learn-dark))" }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-4 landscape:py-2 gap-8 landscape:gap-4">
      <StickerToast sticker={justEarned} />
      <div
        className="rounded-full flex items-center justify-center shadow-xl landscape:!w-[190px] landscape:!h-[190px]"
        style={{
          width: 260,
          height: 260,
          background: `conic-gradient(var(--warm) ${pct}%, #eceae4 ${pct}%)`,
        }}
      >
        <div className="rounded-full bg-white w-[190px] h-[190px] landscape:!w-[135px] landscape:!h-[135px] flex items-center justify-center">
          <span className="text-4xl landscape:text-2xl font-extrabold tabular-nums">
            {mm}:{ss.toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {done ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-5xl">🎉</p>
          <p className="text-3xl font-extrabold">Time&apos;s up!</p>
          <BigButton onClick={reset} color="var(--learn)" colorDark="var(--learn-dark)">
            Choose a New Timer
          </BigButton>
        </div>
      ) : (
        <div className="flex items-center gap-6">
          <button
            onClick={() => setPaused((p) => !p)}
            className="tap-pop rounded-2xl px-6 py-4 bg-white shadow-lg text-2xl font-extrabold"
          >
            {paused ? "▶️ Resume" : "⏸️ Pause"}
          </button>
          <button
            onClick={reset}
            className="tap-pop rounded-2xl px-6 py-4 bg-white shadow-lg text-2xl font-extrabold text-foreground/60"
          >
            ✖️ Cancel
          </button>
        </div>
      )}
    </div>
  );
}
