import { prisma } from "@/lib/db/prisma";

import type { VerifiedToken } from "./token";

export interface McpAccount {
  id: string;
  email: string;
  name: string;
}

export class AccountNotLinkedError extends Error {
  constructor(readonly subject: string) {
    super(
      "This authorization server account is not linked to a Job Search " +
        "Assistant account. Sign in to the web app and connect it under " +
        "Settings before using the MCP server."
    );
    this.name = "AccountNotLinkedError";
  }
}

/**
 * Resolves a verified token to a local account.
 *
 * Lookup is by `authSubject` only. Matching on the token's email claim would
 * make email a trust boundary: unless the authorization server guarantees
 * verified addresses, anyone who registers a matching address there would
 * inherit the local account, its documents and its stored provider API key.
 * Linking is therefore an explicit, authenticated act in the web app.
 */
export async function resolveAccount(token: VerifiedToken): Promise<McpAccount> {
  const user = await prisma.user.findUnique({
    where: { authSubject: token.subject },
    select: { id: true, email: true, name: true, authIssuer: true },
  });

  if (!user) {
    throw new AccountNotLinkedError(token.subject);
  }

  // A subject is only unique within its issuer. If the issuer changed, the
  // stored link no longer means what it meant when it was created.
  if (user.authIssuer && user.authIssuer !== token.issuer) {
    throw new AccountNotLinkedError(token.subject);
  }

  return { id: user.id, email: user.email, name: user.name };
}

/**
 * Links the signed-in account to an authorization server subject.
 *
 * Called from the web app by an authenticated user, never from a token
 * exchange, so that connecting an agent is always a deliberate action.
 */
export async function linkAccount(
  userId: string,
  subject: string,
  issuer: string
): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { authSubject: subject },
    select: { id: true },
  });

  if (existing && existing.id !== userId) {
    throw new Error("That identity is already linked to another account.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { authSubject: subject, authIssuer: issuer },
  });
}
