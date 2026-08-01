export type Grapheme = { id: string; letters: string; keyword: string; emoji: string };
export type PhonicsSet = { id: string; label: string; graphemes: Grapheme[] };

/**
 * The classic Letters and Sounds Phase 2 grouping, which UK schemes including
 * Little Wandle retain as their teaching sequence. Keywords/pictures here are
 * our own generic choices, not any scheme's branded mnemonic cards.
 */
export const PHONICS_SETS: PhonicsSet[] = [
  {
    id: "set1",
    label: "Set 1",
    graphemes: [
      { id: "s", letters: "s", keyword: "Sun", emoji: "☀️" },
      { id: "a", letters: "a", keyword: "Ant", emoji: "🐜" },
      { id: "t", letters: "t", keyword: "Tap", emoji: "🚰" },
      { id: "p", letters: "p", keyword: "Pig", emoji: "🐷" },
    ],
  },
  {
    id: "set2",
    label: "Set 2",
    graphemes: [
      { id: "i", letters: "i", keyword: "Ink", emoji: "🖊️" },
      { id: "n", letters: "n", keyword: "Net", emoji: "🥅" },
      { id: "m", letters: "m", keyword: "Map", emoji: "🗺️" },
      { id: "d", letters: "d", keyword: "Dog", emoji: "🐶" },
    ],
  },
  {
    id: "set3",
    label: "Set 3",
    graphemes: [
      { id: "g", letters: "g", keyword: "Goat", emoji: "🐐" },
      { id: "o", letters: "o", keyword: "Octopus", emoji: "🐙" },
      { id: "c", letters: "c", keyword: "Cat", emoji: "🐱" },
      { id: "k", letters: "k", keyword: "Kite", emoji: "🪁" },
    ],
  },
  {
    id: "set4",
    label: "Set 4",
    graphemes: [
      { id: "ck", letters: "ck", keyword: "Duck", emoji: "🦆" },
      { id: "e", letters: "e", keyword: "Egg", emoji: "🥚" },
      { id: "u", letters: "u", keyword: "Umbrella", emoji: "☂️" },
      { id: "r", letters: "r", keyword: "Rabbit", emoji: "🐰" },
    ],
  },
  {
    id: "set5",
    label: "Set 5",
    graphemes: [
      { id: "h", letters: "h", keyword: "Hat", emoji: "🎩" },
      { id: "b", letters: "b", keyword: "Bat", emoji: "🦇" },
      { id: "f", letters: "f", keyword: "Fish", emoji: "🐟" },
      { id: "ff", letters: "ff", keyword: "Puff", emoji: "💨" },
      { id: "l", letters: "l", keyword: "Leg", emoji: "🦵" },
      { id: "ll", letters: "ll", keyword: "Bell", emoji: "🔔" },
      { id: "ss", letters: "ss", keyword: "Hiss", emoji: "🐍" },
    ],
  },
];
