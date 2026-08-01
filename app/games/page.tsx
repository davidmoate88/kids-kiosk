import { PageHeading, Tile } from "@/components/Tile";

export default function GamesHubPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-10 max-w-4xl mx-auto">
      <PageHeading emoji="🎮" title="Games" subtitle="Pick something to play!" />
      <div className="grid grid-cols-2 gap-8 w-full">
        <Tile href="/games/racing" emoji="🚲" label="Bike Race" colorVar="var(--games)" colorDarkVar="var(--games-dark)" />
        <Tile href="/games/matching" emoji="🃏" label="Matching" colorVar="var(--games)" colorDarkVar="var(--games-dark)" />
        <Tile href="/games/pattern" emoji="🧠" label="Pattern Pals" colorVar="var(--games)" colorDarkVar="var(--games-dark)" />
      </div>
    </div>
  );
}
