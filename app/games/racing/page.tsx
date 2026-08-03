"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useProfile } from "@/components/ProfileContext";
import { BigButton } from "@/components/Tile";
import { useStickerAward, StickerToast } from "@/components/StickerAward";

type Obstacle = { id: number; lane: number; y: number };

const LANES = [0, 1, 2] as const;
const LANE_LEFT = ["16.6%", "50%", "83.4%"];
const OBSTACLE_EMOJIS = ["🪨", "🌵", "🚧", "🍊", "🦆"];

export default function RacingGamePage() {
  const { profile } = useProfile();
  const { award, justEarned } = useStickerAward(profile?.id);
  const isLittle = profile?.tier === "little";
  const awardThreshold = isLittle ? 6 : 10;

  const baseSpeed = isLittle ? 6 : 9;
  const baseSpawn = isLittle ? 28 : 21;

  const [bikeLane, setBikeLane] = useState<number>(1);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [running, setRunning] = useState(true);
  const [paused, setPaused] = useState(false);
  const [flash, setFlash] = useState(false);
  const [finished, setFinished] = useState(false);

  const nextId = useRef(0);
  const tickCount = useRef(0);
  const bikeLaneRef = useRef(bikeLane);
  useEffect(() => {
    bikeLaneRef.current = bikeLane;
  }, [bikeLane]);

  const speedBonus = Math.min(Math.floor(score / 6), 5);
  const speed = baseSpeed + speedBonus;
  const spawnEvery = Math.max(baseSpawn - speedBonus * 2, baseSpawn - 10);

  useEffect(() => {
    if (score >= awardThreshold) award("speedy-rider");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const resetGame = useCallback(() => {
    setBikeLane(1);
    setObstacles([]);
    setScore(0);
    setHearts(3);
    setRunning(true);
    setPaused(false);
    setFinished(false);
    tickCount.current = 0;
  }, []);

  useEffect(() => {
    if (!running || paused) return;
    const interval = setInterval(() => {
      tickCount.current += 1;

      setObstacles((prev) => {
        let moved = prev.map((o) => ({ ...o, y: o.y + speed }));

        const hit = moved.find(
          (o) => o.lane === bikeLaneRef.current && o.y >= 78 && o.y <= 98
        );
        if (hit) {
          moved = moved.filter((o) => o.id !== hit.id);
          setFlash(true);
          setTimeout(() => setFlash(false), 350);
          setHearts((h) => {
            const remaining = h - 1;
            if (remaining <= 0) {
              setRunning(false);
              setFinished(true);
            }
            return Math.max(remaining, 0);
          });
        }

        const offScreen = moved.filter((o) => o.y >= 116);
        if (offScreen.length > 0) {
          setScore((s) => s + offScreen.length);
        }
        moved = moved.filter((o) => o.y < 116);

        if (tickCount.current % spawnEvery === 0) {
          const lane = LANES[Math.floor(Math.random() * LANES.length)];
          moved = [...moved, { id: nextId.current++, lane, y: -12 }];
        }

        return moved;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [running, paused, speed, spawnEvery]);

  function moveLane(dir: -1 | 1) {
    setBikeLane((l) => Math.min(2, Math.max(0, l + dir)));
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-4 landscape:py-2 gap-4 landscape:gap-2 max-w-3xl mx-auto">
      <StickerToast sticker={justEarned} />
      <div className="flex items-center justify-between w-full">
        <div className="flex gap-1 text-3xl landscape:text-2xl">
          {[0, 1, 2].map((i) => (
            <span key={i}>{i < hearts ? "❤️" : "🤍"}</span>
          ))}
        </div>
        <h1 className="text-2xl landscape:text-xl font-extrabold">🚲 Bike Race</h1>
        <div className="flex items-center gap-2 text-2xl landscape:text-xl font-extrabold text-games-dark">
          <span>⭐</span>
          <span>{score}</span>
        </div>
      </div>

      <div
        className="relative w-full max-w-md landscape:max-w-xs overflow-hidden rounded-[2rem] border-4 border-white shadow-xl"
        style={{
          height: "62dvh",
          background:
            "repeating-linear-gradient(180deg, #6b7280 0px, #6b7280 40px, #57606f 40px, #57606f 80px)",
        }}
      >
        {/* lane dividers */}
        {[1, 2].map((i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-1 opacity-40"
            style={{
              left: `${(i * 100) / 3}%`,
              background:
                "repeating-linear-gradient(180deg, white 0px, white 24px, transparent 24px, transparent 48px)",
            }}
          />
        ))}

        {flash && (
          <div className="absolute inset-0 bg-danger/40 z-30 pointer-events-none" />
        )}

        {obstacles.map((o) => (
          <div
            key={o.id}
            className="absolute text-4xl"
            style={{
              left: LANE_LEFT[o.lane],
              top: `${o.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {OBSTACLE_EMOJIS[o.id % OBSTACLE_EMOJIS.length]}
          </div>
        ))}

        <div
          className="absolute text-6xl transition-[left] duration-150 ease-out drop-shadow-lg"
          style={{
            left: LANE_LEFT[bikeLane],
            top: "88%",
            transform: "translate(-50%, -50%)",
          }}
        >
          🚴
        </div>

        {paused && !finished && (
          <div className="absolute inset-0 z-40 bg-black/50 flex flex-col items-center justify-center gap-4">
            <p className="text-4xl">⏸️</p>
            <BigButton onClick={() => setPaused(false)}>Keep Going!</BigButton>
          </div>
        )}

        {finished && (
          <div className="absolute inset-0 z-40 bg-black/60 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-5xl">🎉</p>
            <p className="text-white text-2xl font-extrabold">
              Great riding, {profile?.name}!
            </p>
            <p className="text-white text-xl font-bold">⭐ {score} stars</p>
            <BigButton onClick={resetGame}>Play Again</BigButton>
          </div>
        )}
      </div>

      {!finished && (
        <div className="flex items-center gap-8 landscape:gap-4 w-full justify-center pb-4 landscape:pb-1">
          <button
            onClick={() => moveLane(-1)}
            className="tap-pop w-24 h-24 landscape:w-16 landscape:h-16 rounded-full bg-games text-white text-4xl landscape:text-2xl shadow-lg flex items-center justify-center"
            aria-label="Move left"
          >
            ⬅️
          </button>
          <button
            onClick={() => setPaused((p) => !p)}
            className="tap-pop w-16 h-16 landscape:w-12 landscape:h-12 rounded-full bg-white border-4 border-games text-2xl landscape:text-lg shadow flex items-center justify-center"
            aria-label="Pause"
          >
            {paused ? "▶️" : "⏸️"}
          </button>
          <button
            onClick={() => moveLane(1)}
            className="tap-pop w-24 h-24 landscape:w-16 landscape:h-16 rounded-full bg-games text-white text-4xl landscape:text-2xl shadow-lg flex items-center justify-center"
            aria-label="Move right"
          >
            ➡️
          </button>
        </div>
      )}
    </div>
  );
}
