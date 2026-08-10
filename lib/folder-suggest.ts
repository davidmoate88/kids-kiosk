// Auto-suggests one of the app's existing folders for a newly added
// YouTube channel/playlist or Stremio title/row, from its name alone — the
// only signal available at add-time without a per-item metadata fetch (see
// db/schema.ts's `folder` comment: neither YouTube's API responses nor a
// Stremio catalog/search result carry genre in this app's pipeline today).
// A starting heuristic, not a taxonomy authority — safe to get wrong, since
// every call site uses this as an editable default, never a forced value.
// Extend RULES as real content surfaces names it doesn't yet recognise.

const FOLDERS = ["Songs & Learning", "Shows", "Vehicles", "Disney Junior", "Superheroes", "Everyday Adventures"] as const;
export type SuggestedFolder = (typeof FOLDERS)[number];

const DEFAULT_FOLDER: SuggestedFolder = "Shows";

const RULES: { folder: SuggestedFolder; pattern: RegExp }[] = [
  {
    folder: "Vehicles",
    // Plural-tolerant on the count nouns (truck/tractor/digger/...) — a
    // trailing \b requires a boundary right after the word, which bare
    // singular forms don't get from an "s" ("Diggers", "Monster Trucks").
    pattern:
      /\b(trucks?|tractors?|diggers?|excavators?|cranes?|bulldozers?|dump trucks?|fire ?engines?|police cars?|monster jam|forklifts?|cement mixers?|tow trucks?|garbage trucks?|trains?|aeroplanes?|airplanes?|helicopters?|racing cars?)\b/i,
  },
  {
    folder: "Superheroes",
    pattern:
      /\b(spider-?man|marvel|avengers|batman|superman|justice league|hulk|iron ?man|captain america|wonder woman|super ?heroes?|x-men|power rangers|ninja turtles)\b/i,
  },
  {
    folder: "Disney Junior",
    pattern:
      /\b(disney junior|mickey mouse|minnie mouse|donald duck|frozen|moana|encanto|disney princess|winnie the pooh|doc mcstuffins|sofia the first|vampirina|puppy dog pals)\b/i,
  },
  {
    folder: "Songs & Learning",
    pattern:
      /\b(nursery rhymes?|sing.?along|abc songs?|alphabet|phonics|counting|numbers songs?|learn(ing)? (colou?rs|shapes)|cocomelon|baby shark|super simple songs|little baby bum|kids? songs|storytime|sesame street)\b/i,
  },
  {
    folder: "Everyday Adventures",
    pattern: /\b(peppa pig|bluey|daniel tiger|paw patrol)\b/i,
  },
];

export function suggestFolder(name: string): SuggestedFolder {
  for (const { folder, pattern } of RULES) {
    if (pattern.test(name)) return folder;
  }
  return DEFAULT_FOLDER;
}

export { FOLDERS as FOLDER_TAXONOMY };
