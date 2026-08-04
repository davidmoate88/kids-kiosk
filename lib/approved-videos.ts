// As of the Phase 2 cutover, /watch and /tv read from Postgres
// (lib/watch-folders.ts) instead of this file — everything below is now
// only the bootstrap dataset for scripts/seed.ts, kept so a fresh database
// (e.g. a new deployment) can be seeded with the original curated list
// rather than starting empty. Edits here no longer affect the live app;
// use the /parents dashboard instead.

export type ApprovedVideo = {
  id: string;
  videoId: string;
  title: string;
};

/** Folders group the tabs below into a first screen of big, simple buckets. */
export type Folder = "Songs & Learning" | "Shows" | "Vehicles";

export type ApprovedChannel = {
  id: string;
  channelId: string;
  name: string;
  folder: Folder;
};

export type ApprovedPlaylist = {
  id: string;
  playlistId: string;
  name: string;
  folder: Folder;
};

/** Which folder the hand-picked individual videos above belong in. */
export const VIDEOS_FOLDER: Folder = "Songs & Learning";

/**
 * Individually watched-and-approved videos. Safest tier — nothing here
 * changes until someone edits this file. Swap these placeholders for
 * whatever David has actually vetted.
 */
export const APPROVED_VIDEOS: ApprovedVideo[] = [
  { id: "caterpillar-song", videoId: "yQyEmZIw1e8", title: "Caterpillar Song" },
  { id: "phonics-song", videoId: "1v3Dk41C_10", title: "Phonics Song" },
  { id: "brush-your-teeth", videoId: "tYDuAfY77Do", title: "Brush Your Teeth Song" },
];

/**
 * Trusted channels — every video the channel has ever uploaded is fetched
 * live and shown, not just the ones below. Only add a channel here once
 * you're comfortable with everything they post, since new uploads appear
 * automatically without a review step.
 */
export const APPROVED_CHANNELS: ApprovedChannel[] = [
  { id: "ms-rachel", channelId: "UCG2CL6EUjG8TVT1Tpl9nJdg", name: "Ms Rachel", folder: "Songs & Learning" },
  { id: "bluey", channelId: "UCVzLLZkDuFGAE2BGdBuBNBg", name: "Bluey", folder: "Shows" },
  { id: "paw-patrol", channelId: "UCSVSJ1OCSv5ClFgKFTHIDew", name: "PAW Patrol", folder: "Shows" },
  { id: "the-mud-tour", channelId: "UC0Melcr-RF_kOQNonS5SqJg", name: "The Mud Tour", folder: "Vehicles" },
];

/**
 * Trusted playlists. Two uses:
 *  1. David's own curated playlist — make it on your YouTube account
 *     (Public or Unlisted — Private can't be read without signing the
 *     app into your account), add videos from the YouTube app whenever
 *     you like, and they appear here with no code changes.
 *  2. A single show from within a bigger channel — e.g. rather than
 *     trusting all of Disney Jr.'s uploads, point at their own official
 *     "Spidey and His Amazing Friends" playlist so only that show shows
 *     up. Paste the ID from the playlist URL's "list=" parameter.
 */
export const APPROVED_PLAYLISTS: ApprovedPlaylist[] = [
  { id: "kids-approved-videos", playlistId: "PLGT-cs6iQ9hA", name: "Kids Approved Videos", folder: "Songs & Learning" },
  {
    id: "spidey",
    playlistId: "PL2m1vjiMH_hOMZ1crFOqPDX4etZoyWRKu",
    name: "Spidey and His Amazing Friends",
    folder: "Shows",
  },
  {
    id: "sofia-the-first",
    playlistId: "PL2m1vjiMH_hM1NOvGb-HSrC3sCyPTqCl-",
    name: "Sofia the First",
    folder: "Shows",
  },
  {
    id: "pupstruction",
    playlistId: "PL2m1vjiMH_hNexgL4ym6ir4yNNclUz2wa",
    name: "Pupstruction",
    folder: "Shows",
  },
  {
    id: "mickey-mouse-funhouse",
    playlistId: "PL2m1vjiMH_hPSsYrZEaWYpbiKN-djTrQ5",
    name: "Mickey Mouse Funhouse",
    folder: "Shows",
  },
  {
    id: "mickey-mouse-mixed-up-adventures",
    playlistId: "PL2m1vjiMH_hPYQp2uVHIW0jxwLO5DEvDl",
    name: "Mickey Mouse Mixed-Up Adventures",
    folder: "Shows",
  },
  {
    id: "mickey-mouse-roadster-racers",
    playlistId: "PL2m1vjiMH_hNZzP_dJqPkrk-NKVacw4sd",
    name: "Mickey Mouse Roadster Racers",
    folder: "Shows",
  },
  {
    id: "iron-man-and-his-awesome-friends",
    playlistId: "PL2m1vjiMH_hMLTuM_CBxo3nir28x5cNZc",
    name: "Iron Man and His Awesome Friends",
    folder: "Shows",
  },
  {
    id: "ozzy-fox",
    playlistId: "PLKQXT0dZRy5A",
    name: "Ozzy Fox",
    folder: "Shows",
  },
  {
    id: "magicampers",
    playlistId: "PL2m1vjiMH_hON0IkNMaLo_jeRo0lYX6gA",
    name: "Magicampers",
    folder: "Shows",
  },
  {
    id: "minnies-bow-toons",
    playlistId: "PL2m1vjiMH_hP1JsGIKTJCgqTIe6rQFw0g",
    name: "Minnie's Bow-Toons",
    folder: "Shows",
  },
  {
    id: "cars-toon-maters-tall-tales",
    playlistId: "PL2m1vjiMH_hPifQqYFBBheEtiKgYdbVHq",
    name: "Cars Toon: Mater's Tall Tales",
    folder: "Shows",
  },
];
