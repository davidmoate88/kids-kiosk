// Next.js 16 renamed `middleware.ts` to `proxy.ts` (same request-interception
// mechanism — confirmed against this project's own installed
// node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md).
// This just re-exports Auth.js's optimistic, cookie-only route guard (the
// `authorized` callback in auth.ts) under that convention.
export { auth as proxy } from "@/auth";

export const config = {
  // Skip static assets and the auth API routes themselves; everything else
  // goes through the `authorized` callback in auth.ts.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.\\w+$).*)"],
};
