import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

// The real, authoritative session check for server-rendered pages, same
// pattern as app/parents/(protected)/layout.tsx. proxy.ts's `authorized`
// callback is only an optimistic cookie-only redirect; this is the actual
// per-request check, done close to the data. Now that the whole app is
// behind the shared PIN (see auth.ts's comment on why), this guards the
// kid-facing server pages too, not just /parents.
export async function requireAuth(): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    redirect("/parents/login");
  }
}
