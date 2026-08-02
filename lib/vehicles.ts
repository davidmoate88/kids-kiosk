import type { ExplorerCategory, ExplorerItem } from "@/components/FactExplorer";

export const VEHICLE_CATEGORIES: ExplorerCategory[] = [
  { id: "road", label: "On the Road", emoji: "🛣️" },
  { id: "emergency", label: "Emergency Heroes", emoji: "🚨" },
  { id: "sky", label: "Up in the Sky", emoji: "✈️" },
  { id: "water", label: "On the Water", emoji: "🌊" },
  { id: "site", label: "Building Site", emoji: "🏗️" },
];

export const VEHICLES: ExplorerItem[] = [
  { id: "car", name: "Car", emoji: "🚗", category: "road", fact: "I drive people to school, shops, and fun places!", color: "#3fa7f7" },
  { id: "bus", name: "Bus", emoji: "🚌", category: "road", fact: "I carry lots of people at once — hop on!", color: "#ffd93d" },
  { id: "motorbike", name: "Motorbike", emoji: "🏍️", category: "road", fact: "I have two wheels and I go zoom zoom!", color: "#ff5c5c" },
  { id: "racing-car", name: "Racing Car", emoji: "🏎️", category: "road", fact: "I am built for speed — vroooom!", color: "#ff7ac6" },

  { id: "police-car", name: "Police Car", emoji: "🚓", category: "emergency", fact: "Nee-naw! I help keep everyone safe.", color: "#3fa7f7" },
  { id: "ambulance", name: "Ambulance", emoji: "🚑", category: "emergency", fact: "I rush to help people who feel poorly.", color: "#ff5c5c" },
  { id: "fire-engine", name: "Fire Engine", emoji: "🚒", category: "emergency", fact: "I squirt water to put out fires!", color: "#ff9f5b" },

  { id: "airplane", name: "Airplane", emoji: "✈️", category: "sky", fact: "I fly high in the sky to faraway places!", color: "#7c7cff" },
  { id: "helicopter", name: "Helicopter", emoji: "🚁", category: "sky", fact: "My spinning blades help me fly straight up!", color: "#33c29e" },
  { id: "rocket", name: "Rocket", emoji: "🚀", category: "sky", fact: "Blast off! I zoom all the way to space.", color: "#b07df0" },

  { id: "sailboat", name: "Sailboat", emoji: "⛵", category: "water", fact: "The wind blows my sail to help me glide along.", color: "#3ec9c0" },
  { id: "speedboat", name: "Speedboat", emoji: "🚤", category: "water", fact: "I zoom across the water super fast!", color: "#3fa7f7" },
  { id: "ship", name: "Ship", emoji: "🚢", category: "water", fact: "I am huge and I carry things across the sea.", color: "#2a86d1" },

  { id: "tractor", name: "Tractor", emoji: "🚜", category: "site", fact: "I work on the farm and pull heavy things.", color: "#8bd450" },
  { id: "crane", name: "Crane", emoji: "🏗️", category: "site", fact: "I lift heavy things way up high!", color: "#ff9f5b" },
  { id: "dump-truck", name: "Dump Truck", emoji: "🚛", category: "site", fact: "I carry big loads of mud and rocks.", color: "#c68642" },
];
