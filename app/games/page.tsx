import { PageHeading, Tile } from "@/components/Tile";

export default function GamesHubPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-6 landscape:py-4 gap-10 landscape:gap-4 max-w-4xl landscape:max-w-6xl mx-auto">
      <PageHeading emoji="🎮" title="Games" subtitle="Pick something to play!" />
      <div className="grid grid-cols-2 landscape:grid-cols-3 gap-8 landscape:gap-4 w-full">
        <Tile href="/games/racing" emoji="🚲" label="Bike Race" colorVar="var(--games)" colorDarkVar="var(--games-dark)" />
        <Tile href="/games/matching" emoji="🃏" label="Matching" colorVar="var(--games)" colorDarkVar="var(--games-dark)" />
        <Tile href="/games/pattern" emoji="🧠" label="Pattern Pals" colorVar="var(--games)" colorDarkVar="var(--games-dark)" />
      </div>
    </div>
  );
}
