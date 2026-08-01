export type Region =
  | { id: string; kind: "rect"; x: number; y: number; w: number; h: number; rx?: number }
  | { id: string; kind: "circle"; cx: number; cy: number; r: number }
  | { id: string; kind: "ellipse"; cx: number; cy: number; rx: number; ry: number; rotate?: number }
  | { id: string; kind: "polygon"; points: string }
  | { id: string; kind: "path"; d: string; transform?: string };

/** Static, non-paintable detail lines drawn on top of the regions (e.g. a mask outline, a web pattern). */
export type Decor =
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number }
  | { kind: "path"; d: string; transform?: string }
  | { kind: "circle"; cx: number; cy: number; r: number };

export type Picture = {
  id: string;
  name: string;
  emoji: string;
  viewBox: string;
  regions: Region[];
  decor?: Decor[];
};

/** Five teardrop-shaped petals fanned out around a centre point. */
function petals(cx: number, cy: number, radius: number, length: number, width: number) {
  const petalD = `M0,0 C${-width},${-length * 0.35} ${-width * 0.6},${-length * 0.8} 0,${-length} C${width * 0.6},${-length * 0.8} ${width},${-length * 0.35} 0,0 Z`;
  return [0, 1, 2, 3, 4].map((i) => {
    const angle = i * 72;
    const rad = (angle * Math.PI) / 180;
    const x = cx + radius * Math.sin(rad);
    const y = cy - radius * Math.cos(rad);
    return {
      id: `petal${i}`,
      kind: "path" as const,
      d: petalD,
      transform: `translate(${x} ${y}) rotate(${angle})`,
    };
  });
}

export const PICTURES: Picture[] = [
  {
    id: "car",
    name: "Car",
    emoji: "🚗",
    viewBox: "0 0 240 130",
    regions: [
      { id: "sky", kind: "rect", x: 0, y: 0, w: 240, h: 130 },
      {
        id: "body",
        kind: "path",
        d: "M15,96 C13,86 16,76 24,68 C34,58 46,48 60,40 C70,34 82,28 96,26 L148,26 C166,26 182,34 194,46 C202,54 210,64 216,74 C220,82 223,88 223,96 Z",
      },
      {
        id: "window",
        kind: "path",
        d: "M78,42 C84,33 94,28 106,27 L140,27 C152,28 162,34 168,44 C160,50 148,53 132,53 L104,53 C92,53 82,49 78,42 Z",
      },
      { id: "headlight", kind: "circle", cx: 26, cy: 70, r: 6 },
      { id: "wheel1", kind: "circle", cx: 68, cy: 98, r: 22 },
      { id: "wheel2", kind: "circle", cx: 178, cy: 98, r: 22 },
      { id: "hubcap1", kind: "circle", cx: 68, cy: 98, r: 8 },
      { id: "hubcap2", kind: "circle", cx: 178, cy: 98, r: 8 },
    ],
    decor: [
      { kind: "line", x1: 122, y1: 53, x2: 122, y2: 96 },
      { kind: "line", x1: 130, y1: 70, x2: 138, y2: 70 },
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
        points: "100,20 122,74 180,78 135,114 150,172 100,140 50,172 65,114 20,78 78,74",
      },
    ],
  },
  {
    id: "flower",
    name: "Flower",
    emoji: "🌸",
    viewBox: "0 0 200 210",
    regions: [
      { id: "sky", kind: "rect", x: 0, y: 0, w: 200, h: 210 },
      {
        id: "stem",
        kind: "path",
        d: "M97,132 C92,150 104,168 99,190 C97,196 96,200 97,206 L107,206 C108,200 105,196 105,190 C102,168 112,150 107,132 Z",
      },
      {
        id: "leaf",
        kind: "path",
        d: "M0,0 C18,-4 32,4 36,18 C20,20 4,14 0,0 Z",
        transform: "translate(108 172) rotate(15)",
      },
      ...petals(100, 100, 8, 46, 24),
      { id: "center", kind: "circle", cx: 100, cy: 100, r: 17 },
    ],
    decor: [
      { kind: "circle", cx: 93, cy: 95, r: 2.5 },
      { kind: "circle", cx: 107, cy: 95, r: 2.5 },
      { kind: "circle", cx: 100, cy: 106, r: 2.5 },
      { kind: "circle", cx: 91, cy: 105, r: 2.5 },
      { kind: "circle", cx: 109, cy: 105, r: 2.5 },
    ],
  },
  {
    id: "fish",
    name: "Fish",
    emoji: "🐟",
    viewBox: "0 0 220 140",
    regions: [
      { id: "sky", kind: "rect", x: 0, y: 0, w: 220, h: 140 },
      { id: "tail", kind: "path", d: "M42,70 L8,42 C17,55 17,85 8,98 Z" },
      {
        id: "body",
        kind: "path",
        d: "M40,70 C40,44 66,30 100,30 C136,30 162,48 172,70 C162,92 136,110 100,110 C66,110 40,96 40,70 Z",
      },
      { id: "topfin", kind: "path", d: "M84,32 C88,14 99,7 113,12 C104,20 96,27 89,34 Z" },
      { id: "bottomfin", kind: "path", d: "M84,108 C88,126 99,133 113,128 C104,120 96,113 89,106 Z" },
      { id: "eye", kind: "circle", cx: 148, cy: 62, r: 6 },
    ],
    decor: [
      { kind: "path", d: "M75,55 C82,52 90,52 96,55" },
      { kind: "path", d: "M72,68 C80,65 90,65 98,68" },
      { kind: "path", d: "M75,81 C82,84 90,84 96,81" },
      { kind: "path", d: "M160,66 C164,68 166,72 165,76" },
    ],
  },
  {
    id: "house",
    name: "House",
    emoji: "🏠",
    viewBox: "0 0 200 190",
    regions: [
      { id: "sky", kind: "rect", x: 0, y: 0, w: 200, h: 190 },
      { id: "sun", kind: "circle", cx: 168, cy: 32, r: 18 },
      { id: "chimney", kind: "rect", x: 132, y: 44, w: 18, h: 38, rx: 2 },
      {
        id: "roof",
        kind: "path",
        d: "M22,94 C22,91 24,88 27,86 L97,32 C99,30 103,30 105,32 L175,86 C178,88 180,91 180,94 L166,94 L101,44 L36,94 Z",
      },
      { id: "wall", kind: "rect", x: 42, y: 94, w: 116, h: 78, rx: 3 },
      { id: "door", kind: "rect", x: 88, y: 126, w: 26, h: 46, rx: 4 },
      { id: "window", kind: "rect", x: 58, y: 108, w: 26, h: 26, rx: 3 },
      { id: "window2", kind: "rect", x: 116, y: 108, w: 26, h: 26, rx: 3 },
    ],
    decor: [
      { kind: "line", x1: 71, y1: 108, x2: 71, y2: 134 },
      { kind: "line", x1: 58, y1: 121, x2: 84, y2: 121 },
      { kind: "line", x1: 129, y1: 108, x2: 129, y2: 134 },
      { kind: "line", x1: 116, y1: 121, x2: 142, y2: 121 },
      { kind: "circle", cx: 108, cy: 150, r: 2.5 },
      { kind: "path", d: "M40,94 L160,94" },
    ],
  },
  {
    id: "rocket",
    name: "Rocket",
    emoji: "🚀",
    viewBox: "0 0 200 220",
    regions: [
      { id: "sky", kind: "rect", x: 0, y: 0, w: 200, h: 220 },
      { id: "star1", kind: "circle", cx: 40, cy: 40, r: 5 },
      { id: "star2", kind: "circle", cx: 165, cy: 70, r: 4 },
      { id: "star3", kind: "circle", cx: 150, cy: 150, r: 5 },
      { id: "flame", kind: "path", d: "M82,176 C84,192 90,208 100,220 C110,208 116,192 118,176 C110,182 90,182 82,176 Z" },
      { id: "fin-left", kind: "path", d: "M78,118 C58,128 44,148 38,172 C52,166 66,156 78,146 Z" },
      { id: "fin-right", kind: "path", d: "M122,118 C142,128 156,148 162,172 C148,166 134,156 122,146 Z" },
      {
        id: "body",
        kind: "path",
        d: "M76,70 C74,110 74,140 78,176 C82,182 91,186 100,186 C109,186 118,182 122,176 C126,140 126,110 124,70 Z",
      },
      {
        id: "nose",
        kind: "path",
        d: "M76,72 C77,48 84,16 100,10 C116,16 123,48 124,72 C114,66 106,63 100,63 C94,63 86,66 76,72 Z",
      },
      { id: "window", kind: "circle", cx: 100, cy: 108, r: 17 },
    ],
    decor: [
      { kind: "line", x1: 91, y1: 108, x2: 109, y2: 108 },
      { kind: "path", d: "M84,140 L116,140" },
    ],
  },
  {
    id: "dinosaur",
    name: "Dinosaur",
    emoji: "🦖",
    viewBox: "0 0 260 200",
    regions: [
      { id: "sky", kind: "rect", x: 0, y: 0, w: 260, h: 200 },
      {
        id: "tail",
        kind: "path",
        d: "M78,118 C52,124 26,118 10,100 C22,104 36,106 48,104 C58,102 68,104 78,110 Z",
      },
      {
        id: "leg-back",
        kind: "path",
        d: "M96,128 L96,182 C96,189 102,193 109,193 C116,193 121,189 120,182 L120,130 Z",
      },
      {
        id: "leg-front",
        kind: "path",
        d: "M156,132 L158,182 C158,189 164,193 171,193 C178,193 183,189 181,182 L176,134 Z",
      },
      {
        id: "body",
        kind: "path",
        d: "M70,118 C64,88 90,64 130,60 C160,57 182,68 194,90 C201,104 198,122 182,134 C160,150 118,152 90,140 C80,136 73,128 70,118 Z",
      },
      { id: "plate1", kind: "polygon", points: "100,68 106,42 113,68" },
      { id: "plate2", kind: "polygon", points: "118,60 125,34 132,60" },
      { id: "plate3", kind: "polygon", points: "137,59 144,35 151,60" },
      {
        id: "head",
        kind: "path",
        d: "M186,72 C196,58 208,48 220,44 C228,41 236,43 238,50 C240,56 235,62 228,62 C230,68 227,74 220,75 C214,88 202,98 188,102 C182,92 182,80 186,72 Z",
      },
      { id: "eye", kind: "circle", cx: 222, cy: 56, r: 4 },
    ],
    decor: [{ kind: "path", d: "M196,84 L214,84" }],
  },
  {
    id: "unicorn",
    name: "Unicorn",
    emoji: "🦄",
    viewBox: "0 0 260 210",
    regions: [
      { id: "sky", kind: "rect", x: 0, y: 0, w: 260, h: 210 },
      { id: "tail1", kind: "path", d: "M78,124 C58,120 42,126 32,142 C46,138 58,134 76,136 Z" },
      { id: "tail2", kind: "path", d: "M76,138 C56,138 40,146 30,162 C46,156 58,150 78,152 Z" },
      {
        id: "leg-back",
        kind: "path",
        d: "M110,158 L107,198 C107,204 113,208 119,208 C125,208 130,204 129,198 L128,156 Z",
      },
      {
        id: "leg-front",
        kind: "path",
        d: "M158,160 L157,200 C157,206 163,210 169,210 C175,210 178,206 177,200 L178,158 Z",
      },
      {
        id: "body",
        kind: "path",
        d: "M72,132 C66,100 98,78 145,76 C176,75 198,94 200,120 C202,142 184,158 152,164 C116,170 84,158 74,144 Z",
      },
      {
        id: "head",
        kind: "path",
        d: "M182,92 C192,72 202,52 212,37 C217,29 225,24 233,26 C239,28 240,35 236,42 C242,47 243,54 239,60 C235,66 227,67 222,62 C214,74 204,87 191,97 Z",
      },
      { id: "ear", kind: "polygon", points: "225,30 236,16 231,34" },
      { id: "horn", kind: "polygon", points: "215,28 221,3 228,29" },
      { id: "eye", kind: "circle", cx: 219, cy: 48, r: 4 },
      { id: "mane1", kind: "path", d: "M0,0 C-7,-9 -7,-18 0,-24 C7,-18 7,-9 0,0 Z", transform: "translate(188 84) rotate(-75)" },
      { id: "mane2", kind: "path", d: "M0,0 C-7,-9 -7,-18 0,-24 C7,-18 7,-9 0,0 Z", transform: "translate(201 66) rotate(-50)" },
      { id: "mane3", kind: "path", d: "M0,0 C-7,-9 -7,-18 0,-24 C7,-18 7,-9 0,0 Z", transform: "translate(214 47) rotate(-25)" },
    ],
  },
  {
    id: "web-hero",
    name: "Web Hero",
    emoji: "🕸️",
    viewBox: "0 0 200 220",
    regions: [
      { id: "sky", kind: "rect", x: 0, y: 0, w: 200, h: 220 },
      { id: "cape-left", kind: "path", d: "M66,60 C58,82 52,112 58,142 L74,150 C70,120 72,88 79,66 Z" },
      { id: "cape-right", kind: "path", d: "M134,60 C142,82 148,112 142,142 L126,150 C130,120 128,88 121,66 Z" },
      {
        id: "leg-left",
        kind: "path",
        d: "M79,154 L73,196 C72,203 78,208 86,208 C92,208 96,204 95,197 L92,152 Z",
      },
      {
        id: "leg-right",
        kind: "path",
        d: "M121,154 L127,196 C128,203 122,208 114,208 C108,208 104,204 105,197 L108,152 Z",
      },
      {
        id: "torso",
        kind: "path",
        d: "M70,72 C67,90 69,110 76,127 C71,135 70,145 72,155 L128,155 C130,145 129,135 124,127 C131,110 133,90 130,72 C119,65 109,62 100,62 C91,62 81,65 70,72 Z",
      },
      { id: "belt", kind: "rect", x: 71, y: 140, w: 58, h: 13, rx: 4 },
      {
        id: "arm-left",
        kind: "path",
        d: "M70,78 C54,83 43,97 41,115 C40,123 43,130 49,135 C52,128 53,120 55,112 C58,99 64,88 75,81 Z",
      },
      {
        id: "arm-right",
        kind: "path",
        d: "M130,78 C146,83 157,97 159,115 C160,123 157,130 151,135 C148,128 147,120 145,112 C142,99 136,88 125,81 Z",
      },
      { id: "emblem", kind: "circle", cx: 100, cy: 104, r: 16 },
      { id: "head", kind: "circle", cx: 100, cy: 46, r: 25 },
    ],
    decor: [
      { kind: "path", d: "M83,42 Q100,30 117,42" },
      { kind: "line", x1: 100, y1: 88, x2: 100, y2: 120 },
      { kind: "line", x1: 84, y1: 104, x2: 116, y2: 104 },
      { kind: "line", x1: 88, y1: 92, x2: 112, y2: 116 },
      { kind: "line", x1: 112, y1: 92, x2: 88, y2: 116 },
    ],
  },
  {
    id: "robo-hero",
    name: "Robo Hero",
    emoji: "🤖",
    viewBox: "0 0 200 220",
    regions: [
      { id: "sky", kind: "rect", x: 0, y: 0, w: 200, h: 220 },
      { id: "antenna", kind: "circle", cx: 100, cy: 12, r: 6 },
      { id: "boot-left", kind: "rect", x: 66, y: 185, w: 26, h: 20, rx: 5 },
      { id: "boot-right", kind: "rect", x: 108, y: 185, w: 26, h: 20, rx: 5 },
      {
        id: "leg-left",
        kind: "path",
        d: "M72,148 L68,188 C68,193 74,197 82,197 C89,197 94,193 93,188 L90,146 Z",
      },
      {
        id: "leg-right",
        kind: "path",
        d: "M128,148 L132,188 C132,193 126,197 118,197 C111,197 106,193 107,188 L110,146 Z",
      },
      { id: "torso", kind: "path", d: "M64,84 C61,108 61,130 66,150 L134,150 C139,130 139,108 136,84 C124,76 112,72 100,72 C88,72 76,76 64,84 Z" },
      { id: "shoulder-left", kind: "circle", cx: 55, cy: 92, r: 16 },
      { id: "shoulder-right", kind: "circle", cx: 145, cy: 92, r: 16 },
      {
        id: "arm-left",
        kind: "path",
        d: "M46,100 C40,112 38,128 40,146 C40,152 44,156 50,156 C56,156 60,152 59,146 C58,130 58,114 60,100 Z",
      },
      {
        id: "arm-right",
        kind: "path",
        d: "M154,100 C160,112 162,128 160,146 C160,152 156,156 150,156 C144,156 140,152 141,146 C142,130 142,114 140,100 Z",
      },
      { id: "hand-left", kind: "circle", cx: 49, cy: 160, r: 12 },
      { id: "hand-right", kind: "circle", cx: 151, cy: 160, r: 12 },
      { id: "chest-core", kind: "circle", cx: 100, cy: 112, r: 18 },
      { id: "head", kind: "path", d: "M78,32 C78,24 84,18 92,18 L108,18 C116,18 122,24 122,32 L122,52 C122,62 112,68 100,68 C88,68 78,62 78,52 Z" },
      { id: "visor", kind: "rect", x: 84, y: 38, w: 32, h: 12, rx: 6 },
    ],
    decor: [
      { kind: "line", x1: 100, y1: 18, x2: 100, y2: 12 },
      { kind: "line", x1: 100, y1: 94, x2: 100, y2: 130 },
      { kind: "line", x1: 74, y1: 130, x2: 82, y2: 130 },
      { kind: "line", x1: 118, y1: 130, x2: 126, y2: 130 },
    ],
  },
];
