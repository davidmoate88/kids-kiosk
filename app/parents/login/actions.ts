"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error?: string } | undefined;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  // Where to land after unlocking. Auth.js appends ?callbackUrl= from the
  // proxy redirect (or requireAuth's redirect); default to /watch. Only
  // accept same-origin, root-relative paths to avoid an open redirection.
  const callbackUrlRaw = formData.get("callbackUrl");
  const callbackUrl =
    typeof callbackUrlRaw === "string" && callbackUrlRaw.startsWith("/") && !callbackUrlRaw.startsWith("//")
      ? callbackUrlRaw
      : "/watch";

  try {
    await signIn("credentials", {
      pin: formData.get("pin"),
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Incorrect PIN." };
    }
    // Auth.js signals a successful sign-in redirect by throwing — only
    // credential failures should be handled above, everything else
    // (including that redirect) must be rethrown.
    throw error;
  }
}
