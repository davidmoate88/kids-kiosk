"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useProfile } from "@/components/ProfileContext";
import { getParentPath } from "@/lib/nav";

export default function KioskShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, ready } = useProfile();

  const isPicker = pathname === "/";
  // The TV kiosk entry point has no profile picker and no navigation to
  // any other section — it's meant to be the only thing reachable on a
  // locked-down TV browser, so it skips the profile gate and nav chrome
  // entirely, same as the picker screen.
  const isTv = pathname.startsWith("/tv");
  // The parent dashboard is a separate, adult-facing area with its own
  // auth (see auth.ts/proxy.ts) and layout — it has nothing to do with
  // which kid profile is active, so it gets the same bypass as /tv.
  const isParents = pathname.startsWith("/parents");

  useEffect(() => {
    if (!ready) return;
    if (!profile && !isPicker && !isTv && !isParents) {
      router.replace("/");
    }
  }, [ready, profile, isPicker, isTv, isParents, router]);

  if (isPicker || isTv || isParents) {
    return <>{children}</>;
  }

  if (!ready || !profile) {
    return <div className="flex-1" />;
  }

  const parentPath = getParentPath(pathname);

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex-1 pb-28 landscape:pb-20">{children}</div>
      <nav
        className="fixed bottom-0 inset-x-0 h-24 landscape:h-16 bg-white/95 backdrop-blur border-t-4 border-black/5 flex items-center justify-between px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <button
          onClick={() => router.push("/home")}
          disabled={pathname === "/home"}
          className="tap-pop flex flex-col items-center justify-center gap-1 w-24 h-20 landscape:w-16 landscape:h-12 rounded-2xl disabled:opacity-40 bg-warm/20 active:bg-warm/30"
          aria-label="Home"
        >
          <span className="text-4xl landscape:text-2xl leading-none">🏠</span>
          <span className="text-sm landscape:text-xs font-bold text-foreground/70">Home</span>
        </button>

        {parentPath && parentPath !== "/home" ? (
          <button
            onClick={() => router.push(parentPath)}
            className="tap-pop flex flex-col items-center justify-center gap-1 w-24 h-20 landscape:w-16 landscape:h-12 rounded-2xl bg-black/5 active:bg-black/10"
            aria-label="Back"
          >
            <span className="text-4xl landscape:text-2xl leading-none">⬅️</span>
            <span className="text-sm landscape:text-xs font-bold text-foreground/70">Back</span>
          </button>
        ) : (
          <div className="w-24 landscape:w-16" />
        )}

        <button
          onClick={() => router.push("/")}
          className="tap-pop flex flex-col items-center justify-center gap-1 w-24 h-20 landscape:w-16 landscape:h-12 rounded-2xl bg-black/5 active:bg-black/10"
          aria-label="Switch player"
        >
          <span className="text-4xl landscape:text-2xl leading-none">{profile.avatar}</span>
          <span className="text-sm landscape:text-xs font-bold text-foreground/70">{profile.name}</span>
        </button>
      </nav>
    </div>
  );
}
