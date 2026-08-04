"use server";

import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { parentPin } from "@/db/schema";

export type ChangePinState = { error?: string; success?: boolean } | undefined;

export async function changePin(_prev: ChangePinState, formData: FormData): Promise<ChangePinState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not signed in." };
  }

  const currentPin = formData.get("currentPin");
  const newPin = formData.get("newPin");
  const confirmPin = formData.get("confirmPin");

  if (typeof currentPin !== "string" || typeof newPin !== "string" || typeof confirmPin !== "string") {
    return { error: "All fields are required." };
  }
  if (!/^\d{4,8}$/.test(newPin)) {
    return { error: "New PIN must be 4-8 digits." };
  }
  if (newPin !== confirmPin) {
    return { error: "New PINs don't match." };
  }

  const db = getDb();
  const [row] = await db.select().from(parentPin).where(eq(parentPin.id, session.user.id)).limit(1);
  if (!row) {
    return { error: "PIN not found." };
  }

  const currentMatches = await compare(currentPin, row.pinHash);
  if (!currentMatches) {
    return { error: "Current PIN is incorrect." };
  }

  const pinHash = await hash(newPin, 10);
  await db.update(parentPin).set({ pinHash }).where(eq(parentPin.id, row.id));

  return { success: true };
}
