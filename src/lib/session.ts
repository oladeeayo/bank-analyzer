import { headers } from "next/headers";
import { auth } from "./auth";

/**
 * Resolve the authenticated user's id from the server-side session.
 *
 * Returns the user id when a valid session cookie is present, otherwise null.
 * API routes must use this instead of trusting a client-supplied `userId`,
 * which any caller can forge to access another user's data.
 */
export async function getSessionUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}
