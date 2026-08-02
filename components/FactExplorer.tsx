"use client";

import { useState, type ReactNode } from "react";
import { PageHeading, BigButton } from "@/components/Tile";
import { speak } from "@/lib/speak";
import { useProfile } from "@/components/ProfileContext";
import { useStickerAward, StickerToast } from "@/components/StickerAward";

export type ExplorerItem = {
  id: string;
  name: string;
  emoji: string;
  /** Optional real image (e.g. a licensed illustration) shown instead of the emoji. */
  iconSrc?: string;
  category: string;
  fact: string;
  color: string;
};

export type ExplorerCategory = { id: string; label: string; emoji: string };

export type FactExplorerConfig = {
  headingEmoji: string;
  title: string;
  subtitle: string;
  topicLabel: string;
  items: ExplorerItem[];
  categories: ExplorerCategory[];
  colorVar: string;
  colorDarkVar: string;
  stickerId: string;
  /** Optional custom artwork per item, used instead of the plain emoji when species/vehicles share a generic emoji. */
  renderIcon?: (item: ExplorerItem) => ReactNode;
};

function ItemIcon({
  item,
  config,
  size,
  className = "",
}: {
  item: ExplorerItem;
  config: FactExplorerConfig;
  size: "sm" | "md" | "lg";
  className?: string;
}) {
  const boxClass = size === "lg" ? "w-40 h-40" : size === "md" ? "w-20 h-20" : "w-16 h-16";
  const emojiTextClass = size === "lg" ? "text-8xl" : size === "md" ? "text-5xl" : "text-4xl";
  return (
    <span
      className={`${boxClass} relative overflow-hidden rounded-full flex items-center justify-center shrink-0 ${
        config.renderIcon ? "p-2" : emojiTextClass
      } ${className}`}
      style={{ background: `${item.color}33` }}
    >
      {config.renderIcon ? config.renderIcon(item) : item.emoji}
    </span>
  );
}

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQuestion(pool: ExplorerItem[]) {
  const shuffledPool = shuffle(pool);
  const target = shuffledPool[0];
  const distractors = shuffledPool.filter((i) => i.id !== target.id).slice(0, 2);
  return { target, options: shuffle([target, ...distractors]) };
}

type QuizState = {
  target: ExplorerItem;
  options: ExplorerItem[];
  round: number;
  feedback: "correct" | "wrong" | null;
  pickedId: string | null;
};

export function FactExplorer({ config }: { config: FactExplorerConfig }) {
  const { profile } = useProfile();
  const { award, justEarned } = useStickerAward(profile?.id);
  const totalRounds = profile?.tier === "little" ? 4 : 5;

  const [categoryId, setCategoryId] = useState(config.categories[0].id);
  const [selected, setSelected] = useState<ExplorerItem | null>(null);
  const [explored, setExplored] = useState<Record<string, boolean>>({});
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [quizDone, setQuizDone] = useState(false);

  const categoryItems = config.items.filter((i) => i.category === categoryId);
  const allExplored = config.items.every((i) => explored[i.id]);

  function pick(item: ExplorerItem) {
    setSelected(item);
    speak(`${item.name}. ${item.fact}`);
    setExplored((prev) => ({ ...prev, [item.id]: true }));
  }

  function startQuiz() {
    const q = buildQuestion(config.items);
    setQuiz({ ...q, round: 1, feedback: null, pickedId: null });
    setQuizDone(false);
    speak(`Which one is the ${q.target.name}?`);
  }

  function answerQuiz(option: ExplorerItem) {
    if (!quiz || quiz.feedback) return;
    const correct = option.id === quiz.target.id;
    const round = quiz.round;
    setQuiz({ ...quiz, feedback: correct ? "correct" : "wrong", pickedId: option.id });
    speak(correct ? "Yes! Well done!" : `That's the ${quiz.target.name}!`);
    setTimeout(() => {
      if (round >= totalRounds) {
        setQuizDone(true);
        setQuiz(null);
        award(config.stickerId);
      } else {
        const q = buildQuestion(config.items);
        setQuiz({ ...q, round: round + 1, feedback: null, pickedId: null });
        speak(`Which one is the ${q.target.name}?`);
      }
    }, 1400);
  }

  function backToExplore() {
    setQuiz(null);
    setQuizDone(false);
  }

  if (selected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
        <StickerToast sticker={justEarned} />
        <ItemIcon item={selected} config={config} size="lg" className="gentle-bob" />
        <p className="text-3xl font-extrabold">{selected.name}</p>
        <p className="text-xl font-medium text-foreground/70 max-w-md">{selected.fact}</p>
        <BigButton onClick={() => setSelected(null)} color={config.colorVar} colorDark={config.colorDarkVar}>
          Back
        </BigButton>
      </div>
    );
  }

  if (quizDone) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
        <StickerToast sticker={justEarned} />
        <p className="text-7xl">🎉</p>
        <p className="text-3xl font-extrabold">Great job, {profile?.name}!</p>
        <p className="text-xl text-foreground/60">You know so much about {config.topicLabel}!</p>
        <div className="flex flex-wrap justify-center gap-4">
          <BigButton onClick={startQuiz} color={config.colorVar} colorDark={config.colorDarkVar}>
            Quiz Again
          </BigButton>
          <BigButton onClick={backToExplore} color="var(--warm)" colorDark="var(--warm-dark)">
            Back to Explore
          </BigButton>
        </div>
      </div>
    );
  }

  if (quiz) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-8 max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-between w-full">
          <h1 className="text-2xl font-extrabold">❓ Quiz Time</h1>
          <div className="text-xl font-bold" style={{ color: config.colorDarkVar }}>
            Round {quiz.round} / {totalRounds}
          </div>
        </div>
        <p className="text-2xl md:text-3xl font-extrabold">Which one is the {quiz.target.name}?</p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {quiz.options.map((opt) => {
            const isPicked = quiz.pickedId === opt.id;
            const showCorrect = !!quiz.feedback && opt.id === quiz.target.id;
            const showWrong = isPicked && quiz.feedback === "wrong";
            return (
              <button
                key={opt.id}
                onClick={() => answerQuiz(opt)}
                disabled={!!quiz.feedback}
                className="tap-pop relative flex flex-col items-center gap-2 rounded-3xl p-6 w-40 shadow-lg bg-white"
                style={{
                  outline: showCorrect ? "5px solid var(--learn)" : showWrong ? "5px solid var(--danger)" : "none",
                  outlineOffset: 3,
                }}
              >
                {showCorrect && <span className="absolute -top-3 -right-3 text-3xl">✅</span>}
                {showWrong && <span className="absolute -top-3 -right-3 text-3xl">❌</span>}
                <ItemIcon item={opt} config={config} size="md" />
                <span className="text-lg font-extrabold">{opt.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-6 max-w-4xl mx-auto">
      <StickerToast sticker={justEarned} />
      <PageHeading emoji={config.headingEmoji} title={config.title} subtitle={config.subtitle} />

      <div className="flex gap-3 flex-wrap justify-center">
        {config.categories.map((cat) => {
          const catDone = config.items.filter((i) => i.category === cat.id).every((i) => explored[i.id]);
          return (
            <button
              key={cat.id}
              onClick={() => setCategoryId(cat.id)}
              className={`tap-pop px-5 py-3 rounded-2xl font-bold shadow flex items-center gap-2 ${
                cat.id === categoryId ? "text-white" : "bg-white text-foreground/70"
              }`}
              style={cat.id === categoryId ? { background: config.colorVar } : undefined}
            >
              {cat.emoji} {cat.label}
              {catDone && <span>✅</span>}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 w-full pb-4">
        {categoryItems.map((item) => (
          <button
            key={item.id}
            onClick={() => pick(item)}
            className="tap-pop relative aspect-square rounded-3xl shadow-lg flex flex-col items-center justify-center gap-1 bg-white"
          >
            {explored[item.id] && <span className="absolute -top-2 -right-2 text-2xl">✅</span>}
            <ItemIcon item={item} config={config} size="sm" />
            <span className="text-sm font-extrabold text-center px-1">{item.name}</span>
          </button>
        ))}
      </div>

      {allExplored && (
        <div className="flex flex-col items-center gap-3 pb-8">
          <p className="text-lg font-bold text-foreground/60">🎉 You explored them all!</p>
          <BigButton onClick={startQuiz} color={config.colorVar} colorDark={config.colorDarkVar}>
            Quiz Time! ❓
          </BigButton>
        </div>
      )}
    </div>
  );
}
