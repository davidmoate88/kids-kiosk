import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getDb } from "@/db";
import { parentPin } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // No adapter configured on purpose — the Credentials provider isn't
  // compatible with database sessions anyway, and JWT is all a
  // single-family app needs.
  session: { strategy: "jwt" },
  // Auth.js rejects requests whose Host header it doesn't recognize, as a
  // spoofing guard for multi-tenant hosting platforms. This app is either
  // reached directly on the LAN by IP or (later) through a Cloudflare
  // tunnel that terminates the connection itself — there's no untrusted
  // proxy in front of it forging the header, so trusting it is safe here.
  trustHost: true,
  pages: {
    signIn: "/parents/login",
  },
  providers: [
    Credentials({
      credentials: {
        pin: { label: "PIN", type: "password" },
      },
      async authorize(credentials) {
        const pin = credentials?.pin;
        if (typeof pin !== "string" || !pin) {
          return null;
        }

        const db = getDb();
        const [row] = await db.select().from(parentPin).limit(1);
        if (!row) {
          return null;
        }

        const pinMatches = await compare(pin, row.pinHash);
        if (!pinMatches) {
          return null;
        }

        return { id: row.id };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      return session;
    },
    // Optimistic check only — proxy.ts runs this on every request including
    // prefetches, so it must stay cookie-only (no DB calls). The real check
    // happens again via auth() in app/parents/layout.tsx, close to the data.
    //
    // Only /parents is gated — the app is still LAN-only (no Cloudflare
    // Tunnel live yet, see docs/DEPLOY_HOME_SERVER.md), and kids' content
    // (/watch, /tv) stays zero-touch on purpose: the physical Android TV
    // kiosk and family tablets have no reasonable way to type a PIN. This
    // gate should be revisited if/when the app actually goes internet-facing.
    authorized({ request, auth: session }) {
      const isProtected = request.nextUrl.pathname.startsWith("/parents") &&
        request.nextUrl.pathname !== "/parents/login";
      return isProtected ? Boolean(session?.user) : true;
    },
  },
});
