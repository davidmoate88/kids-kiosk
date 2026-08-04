import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import ParentsNav from "./ParentsNav";

// The real, authoritative check — proxy.ts's `authorized` callback is only
// an optimistic cookie-only redirect (it has to be, running on every
// request including prefetches); this is the actual per-request check,
// done close to the data, same two-layer pattern as the auth.ts comment
// describes.
export default async function ParentsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/parents/login");
  }

  return (
    <div className="min-h-dvh" style={{ background: "var(--tv-bg)", color: "var(--tv-text)" }}>
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--tv-divider)" }}
      >
        <div className="flex items-center gap-8">
          <span className="font-semibold">Kids Kiosk — Parents</span>
          <ParentsNav />
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/parents/login" });
          }}
        >
          <button
            type="submit"
            className="rounded-lg px-3 py-1.5 text-sm"
            style={{ border: "1px solid var(--tv-divider)" }}
          >
            Sign out
          </button>
        </form>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
