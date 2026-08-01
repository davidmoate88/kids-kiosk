"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

const MAX_DIMENSION = 900;
const FILL_TOLERANCE = 48;

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return [r, g, b];
}

function floodFill(
  imageData: ImageData,
  width: number,
  height: number,
  startX: number,
  startY: number,
  fillHex: string
) {
  const data = imageData.data;
  const startPos = startY * width + startX;
  const startIdx = startPos * 4;
  const startR = data[startIdx];
  const startG = data[startIdx + 1];
  const startB = data[startIdx + 2];
  const [fr, fg, fb] = hexToRgb(fillHex);

  // Already this colour (within a tight band) — nothing to do.
  if (Math.abs(startR - fr) < 6 && Math.abs(startG - fg) < 6 && Math.abs(startB - fb) < 6) {
    return;
  }

  const toleranceSq = FILL_TOLERANCE * FILL_TOLERANCE;
  const visited = new Uint8Array(width * height);
  const stack: number[] = [startX, startY];

  while (stack.length) {
    const y = stack.pop() as number;
    const x = stack.pop() as number;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    const pos = y * width + x;
    if (visited[pos]) continue;
    const idx = pos * 4;
    const dr = data[idx] - startR;
    const dg = data[idx + 1] - startG;
    const db = data[idx + 2] - startB;
    if (dr * dr + dg * dg + db * db > toleranceSq) continue;

    visited[pos] = 1;
    data[idx] = fr;
    data[idx + 1] = fg;
    data[idx + 2] = fb;
    data[idx + 3] = 255;

    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }
}

export default function ColouringCanvas({
  src,
  selectedColor,
  resetKey,
}: {
  src: string;
  selectedColor: string;
  resetKey: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalRef = useRef<ImageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    setLoading(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      originalRef.current = ctx.getImageData(0, 0, w, h);
      setLoading(false);
    };
    img.src = src;
  }, [src, resetKey]);

  function handleClick(e: MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    floodFill(imageData, canvas.width, canvas.height, x, y, selectedColor);
    ctx.putImageData(imageData, 0, 0);
  }

  function reset() {
    const canvas = canvasRef.current;
    const original = originalRef.current;
    if (!canvas || !original) return;
    const ctx = canvas.getContext("2d");
    ctx?.putImageData(original, 0, 0);
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {loading && <p className="absolute text-foreground/40 font-bold">Loading picture…</p>}
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="max-w-full max-h-full rounded-2xl cursor-pointer"
        style={{ visibility: loading ? "hidden" : "visible" }}
      />
      {!loading && (
        <button
          onClick={reset}
          className="tap-pop absolute -top-2 -right-2 w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center text-xl"
          aria-label="Reset this picture"
          title="Reset this picture"
        >
          🧹
        </button>
      )}
    </div>
  );
}
