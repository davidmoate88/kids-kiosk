export type ApprovedVideo = {
  id: string;
  videoId: string;
  title: string;
};

export type ApprovedChannel = {
  id: string;
  channelId: string;
  name: string;
};

export type ApprovedPlaylist = {
  id: string;
  playlistId: string;
  name: string;
};

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
  { id: "ms-rachel", channelId: "UCG2CL6EUjG8TVT1Tpl9nJdg", name: "Ms Rachel" },
];

/**
 * Trusted playlists — the easiest way to curate day-to-day: make a
 * playlist on your own YouTube account (Public or Unlisted — Private
 * playlists can't be read without signing the app into your account),
 * add videos to it from the YouTube app whenever you like, and they
 * appear here with no code changes. Paste the ID from the playlist
 * URL's "list=" parameter below.
 */
export const APPROVED_PLAYLISTS: ApprovedPlaylist[] = [
  { id: "kids-approved-videos", playlistId: "PLGT-cs6iQ9hA", name: "Kids Approved Videos" },
];
