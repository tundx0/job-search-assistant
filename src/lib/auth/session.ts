import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth-options";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();

  if (!session?.user?.email) {
    return null;
  }

  return session.user;
}
