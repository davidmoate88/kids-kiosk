import { PageHeading, Tile } from "@/components/Tile";

export default function LearnHubPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-10 max-w-4xl mx-auto">
      <PageHeading emoji="🧩" title="Learning Zone" subtitle="Helpful tools for our day" />
      <div className="grid grid-cols-2 gap-8 w-full">
        <Tile href="/learn/schedule" emoji="🗓️" label="First, Then" colorVar="var(--learn)" colorDarkVar="var(--learn-dark)" />
        <Tile href="/learn/feelings" emoji="😊" label="My Feelings" colorVar="var(--learn)" colorDarkVar="var(--learn-dark)" />
        <Tile href="/learn/timer" emoji="⏳" label="Timer" colorVar="var(--learn)" colorDarkVar="var(--learn-dark)" />
        <Tile href="/learn/choices" emoji="🤔" label="I Choose" colorVar="var(--learn)" colorDarkVar="var(--learn-dark)" />
        <Tile href="/learn/phonics" emoji="🔤" label="Letter Sounds" colorVar="var(--learn)" colorDarkVar="var(--learn-dark)" />
        <Tile href="/learn/workbox" emoji="🧺" label="My Work Box" colorVar="var(--learn)" colorDarkVar="var(--learn-dark)" />
      </div>
    </div>
  );
}
