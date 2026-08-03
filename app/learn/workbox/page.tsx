"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeading, BigButton } from "@/components/Tile";
import { speak } from "@/lib/speak";
import { TASK_CARDS, type CardDef } from "@/lib/task-cards";
import { useProfile } from "@/components/ProfileContext";
import { useStickerAward, StickerToast } from "@/components/StickerAward";

const MAX_TASKS = 4;

export default function WorkBoxPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const { award, justEarned } = useStickerAward(profile?.id);

  const [phase, setPhase] = useState<"setup" | "working" | "done">("setup");
  const [queue, setQueue] = useState<CardDef[]>([]);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState<CardDef[]>([]);

  function toggleTask(card: CardDef) {
    setQueue((prev) => {
      if (prev.some((c) => c.id === card.id)) {
        return prev.filter((c) => c.id !== card.id);
      }
      if (prev.length >= MAX_TASKS) return prev;
      return [...prev, card];
    });
  }

  function startWorking() {
    if (queue.length === 0) return;
    setIndex(0);
    setFinished([]);
    setPhase("working");
    speak(`First, ${queue[0].label}`);
  }

  function finishCurrent() {
    const done = queue[index];
    const nextFinished = [...finished, done];
    setFinished(nextFinished);
    const nextIndex = index + 1;
    if (nextIndex >= queue.length) {
      setPhase("done");
      award("work-box-champ");
      speak("All finished! Great work!");
    } else {
      setIndex(nextIndex);
      speak(`Next, ${queue[nextIndex].label}`);
    }
  }

  function resetAll() {
    setPhase("setup");
    setQueue([]);
    setIndex(0);
    setFinished([]);
  }

  if (phase === "setup") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-4 landscape:py-2 gap-6 landscape:gap-3 max-w-3xl mx-auto">
        <PageHeading
          emoji="🧺"
          title="My Work Box"
          subtitle={`Pick up to ${MAX_TASKS} things to do`}
        />
        <div className="grid grid-cols-3 sm:grid-cols-4 landscape:grid-cols-6 gap-3 landscape:gap-2 w-full max-w-2xl landscape:max-w-4xl">
          {TASK_CARDS.map((card) => {
            const pickedIndex = queue.findIndex((c) => c.id === card.id);
            const picked = pickedIndex !== -1;
            return (
              <button
                key={card.id}
                onClick={() => toggleTask(card)}
                className={`tap-pop relative flex flex-col items-center gap-1 rounded-2xl p-3 shadow ${
                  picked ? "bg-learn text-white ring-4 ring-learn-dark" : "bg-white"
                }`}
              >
                {picked && (
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-learn-dark text-white text-sm font-extrabold flex items-center justify-center">
                    {pickedIndex + 1}
                  </span>
                )}
                <span className="text-4xl">{card.emoji}</span>
                <span className="text-xs font-bold text-center leading-tight">{card.label}</span>
              </button>
            );
          })}
        </div>

        {queue.length > 0 && (
          <BigButton onClick={startWorking} color="var(--learn)" colorDark="var(--learn-dark)">
            Start! ({queue.length} to do)
          </BigButton>
        )}
      </div>
    );
  }

  if (phase === "working") {
    const current = queue[index];
    const upcoming = queue.slice(index + 1);

    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-4 landscape:py-2 gap-6 landscape:gap-3 max-w-3xl mx-auto">
        <StickerToast sticker={justEarned} />
        <PageHeading emoji="🧺" title="My Work Box" subtitle={`${finished.length + 1} of ${queue.length}`} />

        <div className="flex flex-col items-center gap-3 landscape:gap-1 bg-white rounded-[2rem] shadow-xl p-10 landscape:p-5">
          <span className="text-8xl landscape:text-5xl gentle-bob">{current.emoji}</span>
          <span className="text-2xl landscape:text-lg font-extrabold">{current.label}</span>
        </div>

        <BigButton onClick={finishCurrent} color="var(--learn)" colorDark="var(--learn-dark)">
          ✅ Finished!
        </BigButton>

        <div className="flex items-start justify-between w-full max-w-lg pb-6 landscape:pb-2 gap-4 landscape:gap-2">
          <div className="flex-1">
            <p className="text-xs font-extrabold text-foreground/40 uppercase tracking-wide mb-2">
              Still to do
            </p>
            <div className="flex flex-wrap gap-2">
              {upcoming.length === 0 && <span className="text-sm text-foreground/30">Nothing else!</span>}
              {upcoming.map((c) => (
                <span key={c.id} className="text-3xl opacity-40">
                  {c.emoji}
                </span>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs font-extrabold text-foreground/40 uppercase tracking-wide mb-2">
              ✅ Finished tray
            </p>
            <div className="flex flex-wrap gap-2">
              {finished.length === 0 && <span className="text-sm text-foreground/30">Nothing yet</span>}
              {finished.map((c) => (
                <span key={c.id} className="text-3xl">
                  {c.emoji}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 landscape:gap-3 px-6 text-center">
      <StickerToast sticker={justEarned} />
      <p className="text-6xl landscape:text-4xl">🎉</p>
      <p className="text-3xl landscape:text-2xl font-extrabold">All Finished!</p>
      <div className="flex flex-wrap justify-center gap-2 max-w-sm">
        {finished.map((c) => (
          <span key={c.id} className="text-4xl">
            {c.emoji}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-3 items-center">
        <BigButton onClick={resetAll} color="var(--learn)" colorDark="var(--learn-dark)">
          Do More Tasks
        </BigButton>
        <BigButton onClick={() => router.push("/learn/choices")} color="var(--warm)" colorDark="var(--warm-dark)">
          What&apos;s Next? 🤔
        </BigButton>
      </div>
    </div>
  );
}
