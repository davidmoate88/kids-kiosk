import { redirect } from "next/navigation";
import { getWatchFolders } from "@/lib/watch-folders";

export const dynamic = "force-dynamic";

export default async function SurprisePage() {
  const folders = await getWatchFolders();

  const allVideos = folders.flatMap((f) =>
    f.categories.flatMap((c) => c.videos),
  );

  if (allVideos.length === 0) {
    redirect("/home");
  }

  const pick = allVideos[Math.floor(Math.random() * allVideos.length)];
  redirect(
    `/watch?v=${encodeURIComponent(pick.videoId)}&src=${encodeURIComponent(pick.source)}`,
  );
}
