"use client";

import { useEffect, useState } from "react";

// Below this, tiles/buttons shrink past a comfortable tap target for a
// young child on a touchscreen (300×170 virtual-px tiles hit ~150×85 real
// px at this floor) — a portrait or unusually narrow/short tablet viewport
// would otherwise keep shrinking the whole canvas indefinitely to fit.
// TvApp.tsx's wrapper is scrollable specifically so that going below the
// floor overflows into a scroll instead of getting silently clipped.
const MIN_SCALE = 0.55;

/**
 * The TV design is built at a fixed 1920×1080 canvas (per the design
 * handoff — "designed at 1920×1080 and scaled to fit the viewport") so
 * every screen can use exact pixel values instead of fighting a responsive
 * layout. This returns the scale factor to fit that canvas into whatever
 * viewport is actually available, preserving aspect ratio.
 */
export function useTvScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function update() {
      setScale(Math.max(MIN_SCALE, Math.min(window.innerWidth / 1920, window.innerHeight / 1080)));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return scale;
}
