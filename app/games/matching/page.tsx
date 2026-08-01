"use client";

import { useEffect, useMemo, useState } from "react";
import { useProfile } from "@/components/ProfileContext";
import { BigButton } from "@/components/Tile";
import { speak } from "@/lib/speak";

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
  const pairCount = profile?.tier === "little" ? 3 : 4;

  const [deck, setDeck] = useState<Card[]>(() => buildDeck(pairCount));
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

  function newGame() {
    setDeck(buildDeck(pairCount));
    setFlipped([]);
    setMoves(0);
  }

  useEffect(() => {
    if (allMatched) {
      speak("You found them all! Great job!");
    }
  }, [allMatched]);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pt-6 gap-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-2xl font-extrabold">🃏 Matching</h1>
        <div className="text-xl font-bold text-games-dark">Tries: {moves}</div>
      </div>

      {allMatched ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-6xl">🎉</p>
          <p className="text-2xl font-extrabold">
            You found them all, {profile?.name}!
          </p>
          <BigButton onClick={newGame}>Play Again</BigButton>
        </div>
      ) : (
        <div
          className="grid gap-3 w-full"
          style={{ gridTemplateColumns: `repeat(${pairCount <= 3 ? 3 : 4}, minmax(0, 1fr))` }}
        >
          {deck.map((card) => {
            const isFlipped = card.matched || flipped.includes(card.id);
            return (
              <button
                key={card.id}
                onClick={() => tapCard(card)}
                className="tap-pop aspect-square rounded-2xl shadow-lg text-5xl flex items-center justify-center"
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
