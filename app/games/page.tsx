import { PageHeading, Tile } from "@/components/Tile";

export default function GamesHubPage() {
  return (
    <div className="min-h-screen flex flex-col items-center px-6 gap-8 max-w-2xl mx-auto">
      <PageHeading emoji="🎮" title="Games" subtitle="Pick something to play!" />
      <div className="grid grid-cols-2 gap-6 w-full">
        <Tile href="/games/racing" emoji="🚲" label="Bike Race" colorVar="var(--games)" colorDarkVar="var(--games-dark)" />
        <Tile href="/games/matching" emoji="🃏" label="Matching" colorVar="var(--games)" colorDarkVar="var(--games-dark)" />
      </div>
    </div>
  );
}
