import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getDb } from "@/db";
import { users } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // No adapter configured on purpose — the Credentials provider isn't
  // compatible with database sessions anyway, and JWT is all a
  // single-family app needs.
  session: { strategy: "jwt" },
  pages: {
    signIn: "/parents/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const db = getDb();
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase().trim()))
          .limit(1);

        if (!user) {
          return null;
        }

        const passwordMatches = await compare(password, user.passwordHash);
        if (!passwordMatches) {
          return null;
        }

        return { id: user.id, email: user.email, name: user.name };
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
    authorized({ request, auth: session }) {
      const isProtected = request.nextUrl.pathname.startsWith("/parents") &&
        request.nextUrl.pathname !== "/parents/login";
      return isProtected ? Boolean(session?.user) : true;
    },
  },
});
