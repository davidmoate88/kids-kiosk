import type { KeyboardEvent } from "react";
import type { Decor, Picture, Region } from "@/lib/colouring-pictures";

function fillFor(colors: Record<string, string>, id: string) {
  return colors[id] ?? "#ffffff";
}

function renderRegion(region: Region, colors: Record<string, string>, onClick: (id: string) => void) {
  const fill = fillFor(colors, region.id);
  const common = {
    fill,
    stroke: "#2b2440",
    strokeWidth: region.id === "sky" ? 0 : 4,
    strokeLinejoin: "round" as const,
    onClick: () => onClick(region.id),
    className: "cursor-pointer",
    role: "button" as const,
    tabIndex: 0,
    "aria-label": `Colour the ${region.id}`,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(region.id);
      }
    },
  };

  switch (region.kind) {
    case "rect":
      return (
        <rect
          key={region.id}
          {...common}
          x={region.x}
          y={region.y}
          width={region.w}
          height={region.h}
          rx={region.rx ?? 0}
        />
      );
    case "circle":
      return <circle key={region.id} {...common} cx={region.cx} cy={region.cy} r={region.r} />;
    case "ellipse":
      return (
        <ellipse
          key={region.id}
          {...common}
          cx={region.cx}
          cy={region.cy}
          rx={region.rx}
          ry={region.ry}
          transform={region.rotate ? `rotate(${region.rotate} ${region.cx} ${region.cy})` : undefined}
        />
      );
    case "polygon":
      return <polygon key={region.id} {...common} points={region.points} />;
    case "path":
      return (
        <path key={region.id} {...common} d={region.d} transform={region.transform} fillRule="evenodd" />
      );
  }
}

function renderDecor(decor: Decor, i: number) {
  const common = {
    stroke: "#2b2440",
    strokeWidth: 3,
    strokeLinecap: "round" as const,
    fill: "none",
    className: "pointer-events-none",
  };
  if (decor.kind === "line") {
    return <line key={i} {...common} x1={decor.x1} y1={decor.y1} x2={decor.x2} y2={decor.y2} />;
  }
  if (decor.kind === "circle") {
    return <circle key={i} {...common} cx={decor.cx} cy={decor.cy} r={decor.r} fill="#2b2440" stroke="none" />;
  }
  return <path key={i} {...common} d={decor.d} transform={decor.transform} />;
}

export default function ColouringSvg({
  picture,
  colors,
  onRegionClick,
}: {
  picture: Picture;
  colors: Record<string, string>;
  onRegionClick: (id: string) => void;
}) {
  return (
    <svg viewBox={picture.viewBox} className="w-full h-full select-none">
      {picture.regions.map((region) => renderRegion(region, colors, onRegionClick))}
      {picture.decor?.map((d, i) => renderDecor(d, i))}
    </svg>
  );
}
