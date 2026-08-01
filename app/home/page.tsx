"use client";

import { useProfile } from "@/components/ProfileContext";
import { Tile } from "@/components/Tile";

export default function HomePage() {
  const { profile } = useProfile();

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-8 gap-8 max-w-2xl mx-auto">
      <div className="text-center">
        <p className="text-2xl font-bold text-foreground/60">Hiya {profile?.name ?? "there"}!</p>
        <h1 className="text-4xl font-extrabold">What shall we do?</h1>
      </div>
      <div className="grid grid-cols-2 gap-6 w-full">
        <Tile href="/games" emoji="🎮" label="Games" colorVar="var(--games)" colorDarkVar="var(--games-dark)" />
        <Tile href="/colouring" emoji="🖍️" label="Colouring" colorVar="var(--colouring)" colorDarkVar="var(--colouring-dark)" />
        <Tile href="/learn" emoji="🧩" label="Learning Zone" colorVar="var(--learn)" colorDarkVar="var(--learn-dark)" />
        <Tile href="/rewards" emoji="🏅" label="My Stickers" colorVar="var(--warm)" colorDarkVar="var(--warm-dark)" />
      </div>
    </div>
  );
}
