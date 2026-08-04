"use client";

import { useEffect, useState } from "react";

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
      setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return scale;
}
