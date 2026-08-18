import type { StremioMediaType } from "./stremio-catalog-client";

// Assigns a folder automatically from content type alone at approval/add
// time — no keyword guessing, no manual field to fill in. A folder can
// still be renamed afterwards (SourcesClient's / StremioClient's post-hoc
// folder edit inputs, backed by updateCatalogueFolder / updateTrustedRowFolder),
// so getting a default "wrong" is never a dead end.

export type ContentType = StremioMediaType | "youtube";

const FOLDER_BY_TYPE: Record<ContentType, string> = {
  movie: "Movies",
  series: "Shows",
  youtube: "Songs & Learning",
};

export function folderForType(type: ContentType): string {
  return FOLDER_BY_TYPE[type];
}

// Suggestions offered on the post-hoc folder-rename inputs — not used for
// the initial automatic assignment above.
export const FOLDER_TAXONOMY = [
  "Songs & Learning",
  "Shows",
  "Movies",
  "Vehicles",
  "Disney Junior",
  "Superheroes",
  "Everyday Adventures",
] as const;
