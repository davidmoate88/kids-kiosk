import { PICTURES } from "./colouring-pictures";

export type Sticker = { id: string; emoji: string; name: string };

export const COLOURING_STICKERS: Sticker[] = PICTURES.map((p) => ({
  id: `colour-${p.id}`,
  emoji: p.emoji,
  name: `${p.name} Colourer`,
}));

export const ACTIVITY_STICKERS: Sticker[] = [
  { id: "match-whiz", emoji: "🃏", name: "Match Whiz" },
  { id: "speedy-rider", emoji: "🚴", name: "Speedy Rider" },
  { id: "brain-champion", emoji: "🧠", name: "Brain Champion" },
  { id: "planner-pro", emoji: "🗓️", name: "Planner Pro" },
  { id: "feelings-friend", emoji: "😊", name: "Feelings Friend" },
  { id: "timer-team", emoji: "⏳", name: "Timer Team" },
  { id: "great-chooser", emoji: "🤔", name: "Great Chooser" },
  { id: "letter-detective", emoji: "🔤", name: "Letter Detective" },
  { id: "work-box-champ", emoji: "🏁", name: "All-Done Champion" },
];

export const STICKERS: Sticker[] = [...COLOURING_STICKERS, ...ACTIVITY_STICKERS];

function storageKey(profileId: string) {
  return `kk_stickers_${profileId}`;
}

export function getEarnedStickers(profileId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(profileId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/** Returns true if this sticker was newly earned (not already owned). */
export function awardSticker(profileId: string, stickerId: string): boolean {
  const earned = getEarnedStickers(profileId);
  if (earned.includes(stickerId)) return false;
  const next = [...earned, stickerId];
  window.localStorage.setItem(storageKey(profileId), JSON.stringify(next));
  return true;
}
