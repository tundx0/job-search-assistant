import { NextResponse } from "next/server";

import { getMcpAuthConfig } from "@/lib/mcp/config";

/**
 * OAuth 2.0 Protected Resource Metadata (RFC 9728).
 *
 * MCP clients find this document via the `resource_metadata` parameter in our
 * 401 challenge, then use `authorization_servers` to discover where to get a
 * token. It is the first thing a client reads, so it must be public.
 */
export async function GET() {
  let config;
  try {
    config = getMcpAuthConfig();
  } catch (error) {
    // Misconfiguration is a server fault, not a client one. Say so plainly
    // rather than serving a document that points nowhere.
    return NextResponse.json(
      {
        error: "server_error",
        error_description:
          error instanceof Error ? error.message : "MCP auth is not configured",
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      resource: config.resource,
      authorization_servers: [config.issuer],
      scopes_supported: config.scopesSupported,
      bearer_methods_supported: ["header"],
      resource_documentation: `${new URL(config.resource).origin}/docs/mcp`,
    },
    {
      headers: {
        // Public, cacheable, and read before any token exists.
        "Cache-Control": "public, max-age=3600",
        // Browser-based MCP clients fetch this cross-origin. Authorization
        // servers that omit CORS here are a known cause of clients failing to
        // discover where to authenticate.
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
