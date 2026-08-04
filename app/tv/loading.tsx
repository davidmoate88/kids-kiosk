// Next.js shows this automatically while the async TvPage server component
// (which awaits every YouTube API call before rendering) is still loading —
// no manual Suspense wiring needed. Matches the design's "Loading" edge
// state: shimmering hero + two rows of tiles.

function Shimmer({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-tv-sheen rounded-[14px] ${className ?? ""}`}
      style={{
        backgroundImage:
          "linear-gradient(90deg, var(--tv-surface) 25%, var(--tv-neutral-700) 50%, var(--tv-surface) 75%)",
        backgroundSize: "200% 100%",
        ...style,
      }}
    />
  );
}

export default function TvLoading() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pl-[180px] pt-24"
      style={{ background: "var(--tv-bg)" }}
    >
      <Shimmer className="h-8 w-64" />
      <Shimmer className="mt-6 h-24 w-[600px]" />
      <Shimmer className="mt-4 h-16 w-96" />

      <div className="mt-24 flex flex-col gap-8">
        {[0, 1].map((row) => (
          <div key={row} className="flex gap-[22px]">
            {[0, 1, 2, 3, 4].map((tile) => (
              <Shimmer key={tile} className="shrink-0" style={{ width: 300, height: 170 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
