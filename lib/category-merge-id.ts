// Shared between the server (lib/watch-folders.ts) and client TV components
// (TvApp.tsx, TvFavourites.tsx) — kept free of any db/postgres import so
// pulling it into a "use client" component doesn't drag watch-folders.ts's
// server-only DB code into the browser bundle.

const MERGE_PREFIX = "merge:";

export function mergeCategoryId(stremioCategoryId: string, youtubeCategoryId: string): string {
  return `${MERGE_PREFIX}${stremioCategoryId}:${youtubeCategoryId}`;
}

// All localStorage keys a given category id could plausibly be stored under
// — itself, plus (for a merged id) the two original ids it was assembled
// from, so a favourite set before its show ever merged is still found and
// can still be fully cleared, not just recognised as read-only.
function relatedFavouriteIds(categoryId: string): string[] {
  if (!categoryId.startsWith(MERGE_PREFIX)) return [categoryId];
  return [categoryId, ...categoryId.slice(MERGE_PREFIX.length).split(":")];
}

export function categoryMatchesFavourite(categoryId: string, favouriteIds: Set<string>): boolean {
  return relatedFavouriteIds(categoryId).some((id) => favouriteIds.has(id));
}

// Toggling a merged category's favourite has to clear every id it could be
// stored under, not just the merged id itself — otherwise a legacy
// pre-merge favourite (stored under the original id) stays permanently
// favourited: adding the merged id on top of it, never removing it, since a
// plain `next.has(categoryId)` check never finds it in the first place.
export function toggleFavouriteId(categoryId: string, favouriteIds: Set<string>): Set<string> {
  const next = new Set(favouriteIds);
  if (categoryMatchesFavourite(categoryId, favouriteIds)) {
    for (const id of relatedFavouriteIds(categoryId)) next.delete(id);
  } else {
    next.add(categoryId);
  }
  return next;
}
