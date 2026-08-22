"use client";

import { useEffect, useState } from "react";

// Below this, tiles/buttons shrink past a comfortable tap target for a
// young child on a touchscreen (300×170 virtual-px tiles hit ~150×85 real
// px at this floor) — a portrait or unusually narrow/short tablet viewport
// would otherwise keep shrinking the whole canvas indefinitely to fit.
// TvApp.tsx's wrapper is scrollable specifically so that going below the
// floor overflows into a scroll instead of getting silently clipped.
const MIN_SCALE = 0.55;

// The floor above is a *touch* tap-target guard, and it buys that guard by
// letting the canvas overflow into a scroll. That trade only makes sense
// where there are fingers to accommodate and a scroll gesture to recover
// the overflow with. On a non-touch display it is a pure loss:
//
// The Android TV kiosk reports a 960×540 CSS viewport (1920×1080 panel at
// densityDpi 320, so devicePixelRatio 2). The exact fit scale is therefore
// 0.5 — just under the floor — so the floor clamped it up to 0.55 and
// rendered a 1056×594 canvas into 960×540, leaving ~9% of the design
// overflowing off the right and bottom edges with only a D-pad to reach it.
// The canvas is not physically small at 0.5; it fills the whole panel. Only
// the CSS-pixel *number* is small, because of the device pixel ratio.
//
// So: apply the floor only where a finger might actually be, and otherwise
// let the canvas fit exactly.
function isTouchCapable() {
  return typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
}

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
      const fit = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      setScale(isTouchCapable() ? Math.max(MIN_SCALE, fit) : fit);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return scale;
}
