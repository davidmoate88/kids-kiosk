export type ProfileId = "george" | "arthur";

export type Profile = {
  id: ProfileId;
  name: string;
  birthday: string;
  avatar: string;
  color: string;
  colorDark: string;
  /** Simple difficulty tier used to scale games/content by age. */
  tier: "little" | "big";
};

export const PROFILES: Profile[] = [
  {
    id: "george",
    name: "George",
    birthday: "2021-10-21",
    avatar: "🦖",
    color: "#3fa7f7",
    colorDark: "#2a86d1",
    tier: "big",
  },
  {
    id: "arthur",
    name: "Arthur",
    birthday: "2022-08-27",
    avatar: "🦁",
    color: "#ff9f5b",
    colorDark: "#e97f36",
    tier: "little",
  },
];

export function getProfile(id: string | null): Profile | null {
  if (!id) return null;
  return PROFILES.find((p) => p.id === id) ?? null;
}
