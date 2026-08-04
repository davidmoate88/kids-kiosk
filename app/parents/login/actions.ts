"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error?: string } | undefined;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn("credentials", {
      pin: formData.get("pin"),
      redirectTo: "/parents",
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
