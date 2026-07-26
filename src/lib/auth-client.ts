import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "https://bank-analyzer-six.vercel.app",
});

export const { signIn, signOut, useSession } = authClient;
