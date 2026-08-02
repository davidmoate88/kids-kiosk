import WatchClient from "@/components/WatchClient";
import { getWatchFolders } from "@/lib/watch-folders";

export default async function WatchPage() {
  const folders = await getWatchFolders();
  return <WatchClient folders={folders} />;
}
