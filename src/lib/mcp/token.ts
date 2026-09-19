import { createRemoteJWKSet, jwtVerify, errors as joseErrors } from "jose";

import { getMcpAuthConfig, type Scope } from "./config";

export interface VerifiedToken {
  /** Stable identifier for the end user at the authorization server. */
  subject: string;
  /** Issuer that minted the token, already checked against config. */
  issuer: string;
  scopes: string[];
  expiresAt: Date | null;
}

export class TokenError extends Error {
  constructor(
    readonly code: "invalid_token" | "insufficient_scope",
    message: string,
    /** Scope that would have satisfied the request, for the challenge header. */
    readonly requiredScope?: string
  ) {
    super(message);
    this.name = "TokenError";
  }
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    // createRemoteJWKSet caches keys and re-fetches on unknown `kid`, which is
    // what makes authorization-server key rotation transparent here.
    jwks = createRemoteJWKSet(new URL(getMcpAuthConfig().jwksUri));
  }
  return jwks;
}

/** Test seam: drops the cached key set. */
export function resetJwksForTests() {
  jwks = null;
}

/**
 * Normalises the `aud` claim, which may be a string or an array.
 */
function audienceList(aud: unknown): string[] {
  if (typeof aud === "string") return [aud];
  if (Array.isArray(aud)) return aud.filter((a): a is string => typeof a === "string");
  return [];
}

/**
 * Scopes may arrive as a space-delimited `scope` string (RFC 8693) or as a
 * `scp` array, depending on the authorization server.
 */
function scopeList(payload: Record<string, unknown>): string[] {
  const raw = payload.scope ?? payload.scp;
  if (typeof raw === "string") return raw.split(" ").filter(Boolean);
  if (Array.isArray(raw)) return raw.filter((s): s is string => typeof s === "string");
  return [];
}

/**
 * Verifies a bearer token for this resource server.
 *
 * Audience binding is the load-bearing check: without it a token minted for
 * some other service can be replayed here and would be honoured, which is the
 * confused-deputy problem the MCP spec's resource indicators exist to close.
 */
export async function verifyAccessToken(token: string): Promise<VerifiedToken> {
  const config = getMcpAuthConfig();

  let payload: Record<string, unknown>;
  try {
    const result = await jwtVerify(token, getJwks(), {
      issuer: config.issuer,
      // `audience` is checked explicitly below so the failure is attributable.
    });
    payload = result.payload as Record<string, unknown>;
  } catch (error) {
    if (error instanceof joseErrors.JWTExpired) {
      throw new TokenError("invalid_token", "The access token has expired");
    }
    if (error instanceof joseErrors.JWTClaimValidationFailed) {
      throw new TokenError(
        "invalid_token",
        `Token claim ${error.claim} failed validation`
      );
    }
    throw new TokenError("invalid_token", "The access token could not be verified");
  }

  const audiences = audienceList(payload.aud);
  if (!audiences.includes(config.resource)) {
    // Refuse tokens minted for a different resource, even from our own issuer.
    throw new TokenError(
      "invalid_token",
      "The access token was not issued for this MCP server"
    );
  }

  const subject = typeof payload.sub === "string" ? payload.sub : "";
  if (!subject) {
    throw new TokenError("invalid_token", "The access token has no subject");
  }

  return {
    subject,
    issuer: config.issuer,
    scopes: scopeList(payload),
    expiresAt: typeof payload.exp === "number" ? new Date(payload.exp * 1000) : null,
  };
}

/** Throws unless the verified token carries the required scope. */
export function requireScope(token: VerifiedToken, scope: Scope): void {
  if (!token.scopes.includes(scope)) {
    throw new TokenError(
      "insufficient_scope",
      `This action requires the ${scope} scope`,
      scope
    );
  }
}

/**
 * Builds the RFC 9728 challenge that teaches a client where to authenticate.
 * This header is the entire discovery mechanism for MCP clients.
 */
export function buildChallenge(
  baseUrl: string,
  error?: { code: string; description: string; scope?: string }
): string {
  const metadataUrl = `${baseUrl.replace(/\/$/, "")}/.well-known/oauth-protected-resource`;
  const parts = [`Bearer resource_metadata="${metadataUrl}"`];

  if (error) {
    parts.push(`error="${error.code}"`);
    parts.push(`error_description="${error.description.replace(/"/g, "'")}"`);
    if (error.scope) parts.push(`scope="${error.scope}"`);
  }

  return parts.join(", ");
}
