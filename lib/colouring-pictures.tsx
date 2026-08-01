export type Region =
  | { id: string; kind: "rect"; x: number; y: number; w: number; h: number; rx?: number }
  | { id: string; kind: "circle"; cx: number; cy: number; r: number }
  | { id: string; kind: "ellipse"; cx: number; cy: number; rx: number; ry: number; rotate?: number }
  | { id: string; kind: "polygon"; points: string };

export type Picture = {
  id: string;
  name: string;
  emoji: string;
  viewBox: string;
  regions: Region[];
};

function petals(cx: number, cy: number, radius: number, rx: number, ry: number) {
  return [0, 1, 2, 3, 4].map((i) => {
    const angle = i * 72;
    const rad = (angle * Math.PI) / 180;
    return {
      id: `petal${i}`,
      kind: "ellipse" as const,
      cx: cx + radius * Math.sin(rad),
      cy: cy - radius * Math.cos(rad),
      rx,
      ry,
      rotate: angle,
    };
  });
}

export const PICTURES: Picture[] = [
  {
    id: "car",
    name: "Car",
    emoji: "🚗",
    viewBox: "0 0 200 150",
    regions: [
      { id: "sky", kind: "rect", x: 0, y: 0, w: 200, h: 150 },
      { id: "body", kind: "rect", x: 20, y: 65, w: 160, h: 40, rx: 14 },
      { id: "roof", kind: "polygon", points: "52,65 74,28 126,28 148,65" },
      { id: "window", kind: "polygon", points: "62,60 78,34 122,34 138,60" },
      { id: "wheel1", kind: "circle", cx: 60, cy: 108, r: 18 },
      { id: "wheel2", kind: "circle", cx: 140, cy: 108, r: 18 },
    ],
  },
  {
    id: "star",
    name: "Star",
    emoji: "⭐",
    viewBox: "0 0 200 200",
    regions: [
      { id: "sky", kind: "rect", x: 0, y: 0, w: 200, h: 200 },
      {
        id: "star",
        kind: "polygon",
        points:
          "100,20 122,74 180,78 135,114 150,172 100,140 50,172 65,114 20,78 78,74",
      },
    ],
  },
  {
    id: "flower",
    name: "Flower",
    emoji: "🌸",
    viewBox: "0 0 200 200",
    regions: [
      { id: "sky", kind: "rect", x: 0, y: 0, w: 200, h: 200 },
      { id: "stem", kind: "rect", x: 94, y: 130, w: 12, h: 60, rx: 4 },
      { id: "leaf", kind: "ellipse", cx: 118, cy: 165, rx: 20, ry: 10, rotate: -30 },
      ...petals(100, 100, 34, 20, 30),
      { id: "center", kind: "circle", cx: 100, cy: 100, r: 16 },
    ],
  },
  {
    id: "fish",
    name: "Fish",
    emoji: "🐟",
    viewBox: "0 0 200 140",
    regions: [
      { id: "sky", kind: "rect", x: 0, y: 0, w: 200, h: 140 },
      { id: "tail", kind: "polygon", points: "30,70 2,45 2,95" },
      { id: "body", kind: "ellipse", cx: 95, cy: 70, rx: 60, ry: 35 },
      { id: "fin", kind: "ellipse", cx: 95, cy: 38, rx: 16, ry: 12, rotate: 10 },
      { id: "eye", kind: "circle", cx: 140, cy: 62, r: 6 },
    ],
  },
  {
    id: "house",
    name: "House",
    emoji: "🏠",
    viewBox: "0 0 200 180",
    regions: [
      { id: "sky", kind: "rect", x: 0, y: 0, w: 200, h: 180 },
      { id: "sun", kind: "circle", cx: 168, cy: 32, r: 18 },
      { id: "roof", kind: "polygon", points: "30,90 100,35 170,90" },
      { id: "wall", kind: "rect", x: 45, y: 90, w: 110, h: 75 },
      { id: "door", kind: "rect", x: 88, y: 120, w: 24, h: 45, rx: 4 },
      { id: "window", kind: "rect", x: 60, y: 105, w: 24, h: 24, rx: 3 },
    ],
  },
];
