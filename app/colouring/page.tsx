import fs from "node:fs";
import path from "node:path";
import ColouringClient, { type UserImage } from "@/components/ColouringClient";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function titleCase(name: string) {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

function getUserImages(): UserImage[] {
  const dir = path.join(process.cwd(), "public", "colouring-images");
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir);
  } catch {
    return [];
  }
  return files
    .filter((f) => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()))
    .sort()
    .map((f) => ({
      id: `user-${path.parse(f).name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: titleCase(path.parse(f).name),
      src: `/colouring-images/${f}`,
    }));
}

export default function ColouringPage() {
  const userImages = getUserImages();
  return <ColouringClient userImages={userImages} />;
}
