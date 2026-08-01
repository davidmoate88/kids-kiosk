#!/usr/bin/env node
// Regenerates lib/places.ts from the family dashboard's local places store.
// Run monthly by a launchd job (see scripts/README.md) — safe to re-run any
// time by hand, it's a no-op when there's nothing new.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SOURCE_STORE = path.resolve(REPO_ROOT, "..", "family-dashboard", "server", "data", "store.json");
const PLACES_FILE = path.join(REPO_ROOT, "lib", "places.ts");

function log(msg) {
  console.log(`[sync-places ${new Date().toISOString()}] ${msg}`);
}

function titleCase(name) {
  return name.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function run() {
  if (!existsSync(SOURCE_STORE)) {
    log(`Source store not found at ${SOURCE_STORE} — skipping.`);
    return;
  }

  const store = JSON.parse(readFileSync(SOURCE_STORE, "utf8"));
  const rawPlaces = store.places || [];

  // Dedupe by rounded coordinates — the same trip is sometimes logged twice
  // with slightly different casing, e.g. "Saint-Amour" / "saint-amour".
  const seen = new Map();
  for (const p of rawPlaces) {
    if (typeof p.lat !== "number" || typeof p.lon !== "number" || !p.name) continue;
    const key = `${p.lat.toFixed(4)},${p.lon.toFixed(4)}`;
    if (!seen.has(key)) {
      seen.set(key, { name: titleCase(p.name.trim()), lat: p.lat, lon: p.lon, date: p.date || undefined });
    }
  }

  const places = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));

  const idsUsed = new Set();
  function uniqueId(name) {
    let id = slugify(name);
    let n = 2;
    while (idsUsed.has(id)) id = `${slugify(name)}-${n++}`;
    idsUsed.add(id);
    return id;
  }

  const lines = places.map((p) => {
    const id = uniqueId(p.name);
    const dateField = p.date ? `, date: ${JSON.stringify(p.date)}` : "";
    return `  { id: ${JSON.stringify(id)}, name: ${JSON.stringify(p.name)}, lat: ${p.lat}, lon: ${p.lon}${dateField} },`;
  });

  const output = `export type Place = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  date?: string;
  notes?: string;
};

/**
 * Auto-synced monthly from the family dashboard's places list — see
 * scripts/sync-places.mjs. Manual edits here get overwritten on the next
 * sync; add new trips at the source (family-dashboard) instead.
 */
export const PLACES: Place[] = [
${lines.join("\n")}
];
`;

  const previous = existsSync(PLACES_FILE) ? readFileSync(PLACES_FILE, "utf8") : "";
  if (previous === output) {
    log(`No changes — ${places.length} places already in sync.`);
    return;
  }

  writeFileSync(PLACES_FILE, output);
  log(`Wrote ${places.length} places to ${PLACES_FILE}.`);

  const status = execSync("git status --porcelain -- lib/places.ts", { cwd: REPO_ROOT }).toString().trim();
  if (!status) {
    log("git reports no change after write — skipping commit.");
    return;
  }

  execSync("git add lib/places.ts", { cwd: REPO_ROOT, stdio: "inherit" });
  execSync('git commit -m "Monthly sync: update places from family dashboard"', {
    cwd: REPO_ROOT,
    stdio: "inherit",
  });

  try {
    execSync("git push origin main", { cwd: REPO_ROOT, stdio: "inherit" });
    log("Pushed to origin/main — Vercel will redeploy automatically.");
  } catch (err) {
    log(`git push failed: ${err.message}. Commit is local — push it by hand.`);
  }
}

run();
