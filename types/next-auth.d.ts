import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

// Augmenting "next-auth/jwt" (a re-export barrel) doesn't merge into the
// actual JWT interface the callbacks use — that one lives in
// "@auth/core/jwt", so it has to be targeted directly.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
  }
}
