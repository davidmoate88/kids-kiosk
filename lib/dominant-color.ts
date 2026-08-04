"use client";

// Average color of a thumbnail, for the TV home screen's background wash.
// Cross-origin canvas reads need the image server's cooperation (CORS) —
// if i.ytimg.com doesn't play along, or anything else here fails, callers
// always get the fallback back rather than a thrown error.
const cache = new Map<string, string>();

export async function averageColor(imageUrl: string, fallback: string): Promise<string> {
  const cached = cache.get(imageUrl);
  if (cached) return cached;
  try {
    const color = await sample(imageUrl);
    cache.set(imageUrl, color);
    return color;
  } catch {
    return fallback;
  }
}

function sample(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 16;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no 2d context");
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        resolve(`rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`);
      } catch (err) {
        reject(err instanceof Error ? err : new Error("sampling failed"));
      }
    };
    img.onerror = () => reject(new Error("image failed to load"));
    img.src = url;
  });
}
