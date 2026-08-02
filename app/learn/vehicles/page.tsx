"use client";

import { FactExplorer, type FactExplorerConfig } from "@/components/FactExplorer";
import { VEHICLES, VEHICLE_CATEGORIES } from "@/lib/vehicles";

const CONFIG: FactExplorerConfig = {
  headingEmoji: "🚒",
  title: "Vehicle Explorer",
  subtitle: "Tap a vehicle to learn about it!",
  topicLabel: "vehicles",
  items: VEHICLES,
  categories: VEHICLE_CATEGORIES,
  colorVar: "var(--learn)",
  colorDarkVar: "var(--learn-dark)",
  stickerId: "vehicle-whiz",
};

export default function VehiclesPage() {
  return <FactExplorer config={CONFIG} />;
}
