/**
 * Configuration for the MCP server's role as an OAuth 2.1 Resource Server.
 *
 * Deliberately provider-agnostic: the authorization server is known only by
 * its issuer URL and JWKS endpoint, so swapping providers is a config change
 * rather than a code change.
 */

export interface McpAuthConfig {
  /**
   * Canonical resource identifier for this MCP server. Clients send this as
   * the RFC 8707 `resource` parameter and the authorization server stamps it
   * into the token audience. Must match exactly, including scheme and path.
   */
  resource: string;
  /** Authorization server issuer URL, matched against the token `iss`. */
  issuer: string;
  /** JWKS endpoint used to fetch signing keys. */
  jwksUri: string;
  /** Scopes this resource understands, advertised in the metadata document. */
  scopesSupported: string[];
}

export const SCOPES = {
  /** Read applications, documents and profile. */
  READ: "jsa:read",
  /** Spend the account's AI provider credit generating or scoring documents. */
  GENERATE: "jsa:generate",
} as const;

export type Scope = (typeof SCOPES)[keyof typeof SCOPES];

/**
 * Cap on how many billable generations a single server process will perform.
 * Consent is not a rate limit: the user approves one tool call, and an agent
 * loop happens inside it. This is the backstop.
 */
export const MAX_GENERATIONS_PER_PROCESS = Number(
  process.env.MCP_MAX_GENERATIONS ?? 5
);

let cached: McpAuthConfig | null = null;

/**
 * Reads MCP auth configuration from the environment.
 *
 * Throws rather than falling back to defaults: a resource server that cannot
 * name its own issuer or audience cannot validate anything, and silently
 * accepting tokens would be worse than refusing to start.
 */
export function getMcpAuthConfig(): McpAuthConfig {
  if (cached) return cached;

  const resource = process.env.MCP_RESOURCE_URL;
  const issuer = process.env.OAUTH_ISSUER;

  if (!resource) {
    throw new Error(
      "MCP_RESOURCE_URL is not set. It must be the canonical URL of the MCP " +
        "endpoint, e.g. https://example.com/api/mcp"
    );
  }

  if (!issuer) {
    throw new Error(
      "OAUTH_ISSUER is not set. It must be the authorization server's issuer " +
        "URL, e.g. https://auth.example.com"
    );
  }

  // Default to the standard discovery location so most providers need no
  // extra configuration.
  const jwksUri =
    process.env.OAUTH_JWKS_URI ??
    `${issuer.replace(/\/$/, "")}/.well-known/jwks.json`;

  cached = {
    resource: resource.replace(/\/$/, ""),
    issuer: issuer.replace(/\/$/, ""),
    jwksUri,
    scopesSupported: [SCOPES.READ, SCOPES.GENERATE],
  };

  return cached;
}

/** Test seam: clears the memoised config. */
export function resetMcpAuthConfigForTests() {
  cached = null;
}
