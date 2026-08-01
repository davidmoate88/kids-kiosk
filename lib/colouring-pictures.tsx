export type Region =
  | { id: string; kind: "rect"; x: number; y: number; w: number; h: number; rx?: number }
  | { id: string; kind: "circle"; cx: number; cy: number; r: number }
  | { id: string; kind: "ellipse"; cx: number; cy: number; rx: number; ry: number; rotate?: number }
  | { id: string; kind: "polygon"; points: string };

/** Static, non-paintable detail lines drawn on top of the regions (e.g. a mask outline, a web pattern). */
export type Decor =
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number }
  | { kind: "path"; d: string };

export type Picture = {
  id: string;
  name: string;
  emoji: string;
  viewBox: string;
  regions: Region[];
  decor?: Decor[];
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
  {
    id: "rocket",
    name: "Rocket",
    emoji: "🚀",
    viewBox: "0 0 200 200",
    regions: [
      { id: "sky", kind: "rect", x: 0, y: 0, w: 200, h: 200 },
      { id: "star1", kind: "circle", cx: 40, cy: 40, r: 5 },
      { id: "star2", kind: "circle", cx: 165, cy: 70, r: 4 },
      { id: "star3", kind: "circle", cx: 150, cy: 150, r: 5 },
      { id: "flame", kind: "polygon", points: "82,150 100,190 118,150" },
      { id: "fin-left", kind: "polygon", points: "70,110 40,150 82,140" },
      { id: "fin-right", kind: "polygon", points: "130,110 160,150 118,140" },
      { id: "body", kind: "rect", x: 70, y: 55, w: 60, h: 100, rx: 10 },
      { id: "nose", kind: "polygon", points: "70,58 100,15 130,58" },
      { id: "window", kind: "circle", cx: 100, cy: 95, r: 16 },
    ],
    decor: [{ kind: "line", x1: 92, y1: 95, x2: 108, y2: 95 }],
  },
  {
    id: "dinosaur",
    name: "Dinosaur",
    emoji: "🦖",
    viewBox: "0 0 220 180",
    regions: [
      { id: "sky", kind: "rect", x: 0, y: 0, w: 220, h: 180 },
      { id: "tail", kind: "polygon", points: "45,110 8,92 46,128" },
      { id: "leg-back", kind: "ellipse", cx: 70, cy: 152, rx: 18, ry: 22 },
      { id: "leg-front", kind: "ellipse", cx: 132, cy: 152, rx: 18, ry: 22 },
      { id: "body", kind: "ellipse", cx: 100, cy: 108, rx: 55, ry: 40 },
      { id: "spike1", kind: "polygon", points: "80,76 88,50 96,76" },
      { id: "spike2", kind: "polygon", points: "97,68 105,42 113,68" },
      { id: "spike3", kind: "polygon", points: "112,72 120,48 128,72" },
      { id: "head", kind: "circle", cx: 166, cy: 88, r: 27 },
      { id: "eye", kind: "circle", cx: 176, cy: 82, r: 4 },
    ],
  },
  {
    id: "unicorn",
    name: "Unicorn",
    emoji: "🦄",
    viewBox: "0 0 220 200",
    regions: [
      { id: "sky", kind: "rect", x: 0, y: 0, w: 220, h: 200 },
      { id: "tail1", kind: "ellipse", cx: 50, cy: 108, rx: 14, ry: 20, rotate: 30 },
      { id: "tail2", kind: "ellipse", cx: 40, cy: 130, rx: 12, ry: 18, rotate: 50 },
      { id: "leg-back", kind: "ellipse", cx: 80, cy: 165, rx: 14, ry: 24 },
      { id: "leg-front", kind: "ellipse", cx: 145, cy: 165, rx: 14, ry: 24 },
      { id: "body", kind: "ellipse", cx: 110, cy: 120, rx: 60, ry: 38 },
      { id: "mane1", kind: "ellipse", cx: 130, cy: 76, rx: 10, ry: 16, rotate: 0 },
      { id: "mane2", kind: "ellipse", cx: 145, cy: 72, rx: 10, ry: 16, rotate: -10 },
      { id: "mane3", kind: "ellipse", cx: 160, cy: 68, rx: 10, ry: 16, rotate: -20 },
      { id: "head", kind: "circle", cx: 175, cy: 90, r: 24 },
      { id: "ear", kind: "polygon", points: "190,75 200,60 196,80" },
      { id: "horn", kind: "polygon", points: "170,66 176,35 184,66" },
      { id: "eye", kind: "circle", cx: 182, cy: 86, r: 4 },
    ],
  },
  {
    id: "web-hero",
    name: "Web Hero",
    emoji: "🕸️",
    viewBox: "0 0 200 220",
    regions: [
      { id: "sky", kind: "rect", x: 0, y: 0, w: 200, h: 220 },
      { id: "cape", kind: "polygon", points: "70,60 130,60 150,150 50,150" },
      { id: "boot-left", kind: "ellipse", cx: 78, cy: 195, rx: 16, ry: 12 },
      { id: "boot-right", kind: "ellipse", cx: 122, cy: 195, rx: 16, ry: 12 },
      { id: "leg-left", kind: "rect", x: 68, y: 150, w: 20, h: 48 },
      { id: "leg-right", kind: "rect", x: 112, y: 150, w: 20, h: 48 },
      { id: "torso", kind: "polygon", points: "65,75 135,75 125,155 75,155" },
      { id: "belt", kind: "rect", x: 70, y: 140, w: 60, h: 14, rx: 4 },
      { id: "arm-left", kind: "ellipse", cx: 60, cy: 108, rx: 10, ry: 26, rotate: -10 },
      { id: "arm-right", kind: "ellipse", cx: 140, cy: 108, rx: 10, ry: 26, rotate: 10 },
      { id: "emblem", kind: "circle", cx: 100, cy: 105, r: 16 },
      { id: "head", kind: "circle", cx: 100, cy: 48, r: 26 },
    ],
    decor: [
      { kind: "path", d: "M84,44 Q100,32 116,44" },
      { kind: "line", x1: 100, y1: 89, x2: 100, y2: 121 },
      { kind: "line", x1: 84, y1: 105, x2: 116, y2: 105 },
      { kind: "line", x1: 88, y1: 93, x2: 112, y2: 117 },
      { kind: "line", x1: 112, y1: 93, x2: 88, y2: 117 },
    ],
  },
  {
    id: "robo-hero",
    name: "Robo Hero",
    emoji: "🤖",
    viewBox: "0 0 200 220",
    regions: [
      { id: "sky", kind: "rect", x: 0, y: 0, w: 200, h: 220 },
      { id: "antenna", kind: "rect", x: 97, y: 10, w: 6, h: 18 },
      { id: "boot-left", kind: "rect", x: 66, y: 185, w: 26, h: 20, rx: 4 },
      { id: "boot-right", kind: "rect", x: 108, y: 185, w: 26, h: 20, rx: 4 },
      { id: "leg-left", kind: "rect", x: 70, y: 148, w: 22, h: 44, rx: 6 },
      { id: "leg-right", kind: "rect", x: 108, y: 148, w: 22, h: 44, rx: 6 },
      { id: "torso", kind: "rect", x: 62, y: 82, w: 76, h: 70, rx: 12 },
      { id: "shoulder-left", kind: "circle", cx: 55, cy: 92, r: 16 },
      { id: "shoulder-right", kind: "circle", cx: 145, cy: 92, r: 16 },
      { id: "arm-left", kind: "rect", x: 42, y: 100, w: 20, h: 54, rx: 8 },
      { id: "arm-right", kind: "rect", x: 138, y: 100, w: 20, h: 54, rx: 8 },
      { id: "hand-left", kind: "circle", cx: 52, cy: 160, r: 12 },
      { id: "hand-right", kind: "circle", cx: 148, cy: 160, r: 12 },
      { id: "chest-core", kind: "circle", cx: 100, cy: 112, r: 18 },
      { id: "head", kind: "rect", x: 76, y: 30, w: 48, h: 44, rx: 14 },
      { id: "visor", kind: "rect", x: 84, y: 44, w: 32, h: 12, rx: 6 },
    ],
    decor: [{ kind: "line", x1: 100, y1: 94, x2: 100, y2: 130 }],
  },
];
