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

  useEffect(() => {
    if (!ready) return;
    if (!profile && !isPicker) {
      router.replace("/");
    }
  }, [ready, profile, isPicker, router]);

  if (isPicker) {
    return <>{children}</>;
  }

  if (!ready || !profile) {
    return <div className="flex-1" />;
  }

  const parentPath = getParentPath(pathname);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 pb-24">{children}</div>
      <nav
        className="fixed bottom-0 inset-x-0 h-20 bg-white/95 backdrop-blur border-t-4 border-black/5 flex items-center justify-between px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <button
          onClick={() => router.push("/home")}
          disabled={pathname === "/home"}
          className="tap-pop flex flex-col items-center justify-center gap-0.5 w-20 h-16 rounded-2xl disabled:opacity-40 bg-warm/20 active:bg-warm/30"
          aria-label="Home"
        >
          <span className="text-3xl leading-none">🏠</span>
          <span className="text-xs font-bold text-foreground/70">Home</span>
        </button>

        {parentPath && parentPath !== "/home" ? (
          <button
            onClick={() => router.push(parentPath)}
            className="tap-pop flex flex-col items-center justify-center gap-0.5 w-20 h-16 rounded-2xl bg-black/5 active:bg-black/10"
            aria-label="Back"
          >
            <span className="text-3xl leading-none">⬅️</span>
            <span className="text-xs font-bold text-foreground/70">Back</span>
          </button>
        ) : (
          <div className="w-20" />
        )}

        <button
          onClick={() => router.push("/")}
          className="tap-pop flex flex-col items-center justify-center gap-0.5 w-20 h-16 rounded-2xl bg-black/5 active:bg-black/10"
          aria-label="Switch player"
        >
          <span className="text-3xl leading-none">{profile.avatar}</span>
          <span className="text-xs font-bold text-foreground/70">{profile.name}</span>
        </button>
      </nav>
    </div>
  );
}
