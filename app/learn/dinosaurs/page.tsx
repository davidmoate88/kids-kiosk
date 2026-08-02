"use client";

import Image from "next/image";
import { FactExplorer, type FactExplorerConfig } from "@/components/FactExplorer";
import { DINOSAURS, DINO_CATEGORIES } from "@/lib/dinosaurs";

const CONFIG: FactExplorerConfig = {
  headingEmoji: "🦖",
  title: "Dino Explorer",
  subtitle: "Tap a dinosaur to learn about it!",
  topicLabel: "dinosaurs",
  items: DINOSAURS,
  categories: DINO_CATEGORIES,
  colorVar: "var(--learn)",
  colorDarkVar: "var(--learn-dark)",
  stickerId: "dino-expert",
  renderIcon: (item) =>
    item.iconSrc ? (
      <Image src={item.iconSrc} alt={item.name} fill className="object-contain p-1" />
    ) : (
      item.emoji
    ),
};

export default function DinosaursPage() {
  return (
    <>
      <FactExplorer config={CONFIG} />
      <p className="text-center text-xs text-foreground/30 pb-6 -mt-4">
        Dinosaur pictures from Flaticon.com
      </p>
    </>
  );
}
