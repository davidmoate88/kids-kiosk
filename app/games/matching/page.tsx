"use client";

import { useEffect, useMemo, useState } from "react";
import { useProfile } from "@/components/ProfileContext";
import { BigButton } from "@/components/Tile";
import { speak } from "@/lib/speak";
import { useStickerAward, StickerToast } from "@/components/StickerAward";

type Card = { id: number; symbol: string; matched: boolean };

const ALL_SYMBOLS = ["🐶", "🐱", "🐸", "🐵", "🦋", "🐢", "🐟", "🦉", "🐝", "🐳"];

function buildDeck(pairCount: number): Card[] {
  const symbols = ALL_SYMBOLS.slice(0, pairCount);
  const deck = [...symbols, ...symbols].map((symbol, i) => ({
    id: i,
    symbol,
    matched: false,
  }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export default function MatchingGamePage() {
  const { profile } = useProfile();
  const { award, justEarned } = useStickerAward(profile?.id);
  const basePairCount = profile?.tier === "little" ? 3 : 4;
  const maxPairCount = profile?.tier === "little" ? 5 : 7;

  const [pairCount, setPairCount] = useState(basePairCount);
  const [deck, setDeck] = useState<Card[]>(() => buildDeck(basePairCount));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const allMatched = useMemo(() => deck.every((c) => c.matched), [deck]);

  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped;
    const cardA = deck.find((c) => c.id === a)!;
    const cardB = deck.find((c) => c.id === b)!;

    if (cardA.symbol === cardB.symbol) {
      const t = setTimeout(() => {
        setDeck((d) =>
          d.map((c) => (c.id === a || c.id === b ? { ...c, matched: true } : c))
        );
        setFlipped([]);
      }, 400);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setFlipped([]);
      }, 800);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped]);

  function tapCard(card: Card) {
    if (card.matched || flipped.includes(card.id) || flipped.length === 2) return;
    setFlipped((f) => {
      const next = [...f, card.id];
      if (next.length === 2) setMoves((m) => m + 1);
      return next;
    });
  }

  function nextLevel() {
    const next = Math.min(pairCount + 1, maxPairCount);
    setPairCount(next);
    setDeck(buildDeck(next));
    setFlipped([]);
    setMoves(0);
  }

  function playAgain() {
    setDeck(buildDeck(pairCount));
    setFlipped([]);
    setMoves(0);
  }

  useEffect(() => {
    if (allMatched) {
      speak("You found them all! Great job!");
      award("match-whiz");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMatched]);

  const canLevelUp = pairCount < maxPairCount;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-4 landscape:py-2 gap-8 landscape:gap-3 max-w-4xl mx-auto">
      <StickerToast sticker={justEarned} />
      <div className="flex items-center justify-between w-full">
        <h1 className="text-3xl landscape:text-xl font-extrabold">🃏 Matching</h1>
        <div className="text-2xl landscape:text-lg font-bold text-games-dark">Tries: {moves}</div>
      </div>

      {allMatched ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-6xl">🎉</p>
          <p className="text-2xl font-extrabold">
            You found them all, {profile?.name}!
          </p>
          <div className="flex gap-4">
            <BigButton onClick={playAgain} color="var(--colouring)" colorDark="var(--colouring-dark)">
              Play Again
            </BigButton>
            {canLevelUp && <BigButton onClick={nextLevel}>Next Level! ⭐</BigButton>}
          </div>
        </div>
      ) : (
        <div
          className="grid gap-4 landscape:gap-2 w-full landscape:max-w-2xl landscape:mx-auto"
          style={{ gridTemplateColumns: `repeat(${pairCount <= 3 ? 3 : 4}, minmax(0, 1fr))` }}
        >
          {deck.map((card) => {
            const isFlipped = card.matched || flipped.includes(card.id);
            return (
              <button
                key={card.id}
                onClick={() => tapCard(card)}
                className="tap-pop aspect-square rounded-2xl shadow-lg text-6xl md:text-7xl landscape:text-4xl flex items-center justify-center"
                style={{
                  background: isFlipped
                    ? "linear-gradient(160deg, #ffffff, #f1e9ff)"
                    : "linear-gradient(160deg, var(--colouring), var(--colouring-dark))",
                }}
              >
                {isFlipped ? card.symbol : "❓"}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
