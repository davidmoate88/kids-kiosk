"use client";

import { useProfile } from "@/components/ProfileContext";
import { Tile } from "@/components/Tile";

export default function HomePage() {
  const { profile } = useProfile();

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-8 landscape:py-4 gap-10 landscape:gap-4 max-w-4xl landscape:max-w-6xl mx-auto">
      <div className="text-center">
        <p className="text-3xl landscape:text-xl font-bold text-foreground/60">Hiya {profile?.name ?? "there"}!</p>
        <h1 className="text-5xl landscape:text-3xl font-extrabold">What shall we do?</h1>
      </div>
      <div className="grid grid-cols-2 landscape:grid-cols-3 gap-8 landscape:gap-4 w-full">
        <Tile href="/games" emoji="🎮" label="Games" colorVar="var(--games)" colorDarkVar="var(--games-dark)" />
        <Tile href="/colouring" emoji="🖍️" label="Colouring" colorVar="var(--colouring)" colorDarkVar="var(--colouring-dark)" />
        <Tile href="/learn" emoji="🧩" label="Learning Zone" colorVar="var(--learn)" colorDarkVar="var(--learn-dark)" />
        <Tile href="/watch" emoji="📺" label="Watch" colorVar="var(--watch)" colorDarkVar="var(--watch-dark)" />
        <Tile href="/places" emoji="🗺️" label="Places" colorVar="var(--places)" colorDarkVar="var(--places-dark)" />
        <Tile href="/rewards" emoji="🏅" label="My Stickers" colorVar="var(--warm)" colorDarkVar="var(--warm-dark)" />
      </div>
    </div>
  );
}
