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
