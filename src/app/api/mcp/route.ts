import { createMcpHandler, withMcpAuth } from "mcp-handler";
import type { AuthInfo } from "@modelcontextprotocol/server";
import { z } from "zod";

import { resolveAccount, AccountNotLinkedError, type McpAccount } from "@/lib/mcp/account";
import { getMcpAuthConfig, SCOPES } from "@/lib/mcp/config";
import { McpToolError } from "@/lib/mcp/errors";
import { TokenError, verifyAccessToken } from "@/lib/mcp/token";
import * as schemas from "@/lib/mcp/schemas";
import * as tools from "@/lib/mcp/tools";

/** Generation runs several model calls back to back. */
export const maxDuration = 300;

/** The resolved account travels with the token, not in module scope. */
interface McpAuthExtra extends Record<string, unknown> {
  account: McpAccount;
}

function accountFrom(ctx: { http?: { authInfo?: AuthInfo } }): McpAccount {
  const extra = ctx.http?.authInfo?.extra as McpAuthExtra | undefined;
  if (!extra?.account) {
    // withMcpAuth rejects unauthenticated requests before this point, so this
    // is a wiring fault rather than something a client can provoke.
    throw new McpToolError("validation_error", "No authenticated account on request");
  }
  return extra.account;
}

function ok(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
  };
}

function fail(error: unknown) {
  if (error instanceof McpToolError) {
    return { ...ok(error.toPayload()), isError: true as const };
  }

  if (error instanceof z.ZodError) {
    return {
      ...ok({
        error: {
          code: "validation_error",
          message: "The arguments did not match the tool's schema",
          details: error.errors,
        },
      }),
      isError: true as const,
    };
  }

  console.error("MCP tool failure:", error);
  return {
    ...ok({
      error: {
        code: "provider_error",
        message: error instanceof Error ? error.message : "The tool failed unexpectedly",
      },
    }),
    isError: true as const,
  };
}

/**
 * Scope enforcement happens per tool rather than per request: read tools must
 * stay usable by a read-only token even though the server also exposes
 * billable ones.
 */
function assertScope(ctx: { http?: { authInfo?: AuthInfo } }, scope: string) {
  const scopes = ctx.http?.authInfo?.scopes ?? [];
  if (!scopes.includes(scope)) {
    throw new McpToolError(
      "validation_error",
      `This tool requires the ${scope} scope`,
      "Reconnect the server and grant the scope when asked."
    );
  }
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "list_applications",
      {
        title: "List applications",
        description:
          "List this account's job applications, newest first. Rows are compact " +
          "and omit job description text.",
        inputSchema: schemas.listApplicationsInput,
        annotations: { readOnlyHint: true },
      },
      async (args, ctx) => {
        try {
          assertScope(ctx, SCOPES.READ);
          return ok(await tools.listApplications(accountFrom(ctx), args));
        } catch (error) {
          return fail(error);
        }
      }
    );

    server.registerTool(
      "get_application",
      {
        title: "Get application",
        description:
          "Get one application with its documents and scoring insight. The job " +
          "description is previewed unless full is true.",
        inputSchema: schemas.getApplicationInput,
        annotations: { readOnlyHint: true },
      },
      async (args, ctx) => {
        try {
          assertScope(ctx, SCOPES.READ);
          return ok(await tools.getApplication(accountFrom(ctx), args));
        } catch (error) {
          return fail(error);
        }
      }
    );

    server.registerTool(
      "get_profile",
      {
        title: "Get profile",
        description:
          "Get the account's structured profile: experience, education, projects " +
          "and skills. This is the source material every draft is built from.",
        inputSchema: schemas.emptyInput,
        annotations: { readOnlyHint: true },
      },
      async (_args, ctx) => {
        try {
          assertScope(ctx, SCOPES.READ);
          return ok(await tools.getProfile(accountFrom(ctx)));
        } catch (error) {
          return fail(error);
        }
      }
    );

    server.registerTool(
      "get_document",
      {
        title: "Get document",
        description: "Read back a generated resume or cover letter as text.",
        inputSchema: schemas.getDocumentInput,
        annotations: { readOnlyHint: true },
      },
      async (args, ctx) => {
        try {
          assertScope(ctx, SCOPES.READ);
          return ok(await tools.getDocument(accountFrom(ctx), args));
        } catch (error) {
          return fail(error);
        }
      }
    );

    server.registerTool(
      "create_application",
      {
        title: "Create application",
        description:
          "Record a new job application from a posting. Generates no documents; " +
          "call generate_documents afterwards.",
        inputSchema: schemas.createApplicationInput,
        annotations: { readOnlyHint: false, destructiveHint: false },
      },
      async (args, ctx) => {
        try {
          assertScope(ctx, SCOPES.READ);
          return ok(await tools.createApplication(accountFrom(ctx), args));
        } catch (error) {
          return fail(error);
        }
      }
    );

    server.registerTool(
      "update_application_status",
      {
        title: "Update application status",
        description: "Move an application to a new status.",
        inputSchema: schemas.updateStatusInput,
        annotations: { readOnlyHint: false, idempotentHint: true },
      },
      async (args, ctx) => {
        try {
          assertScope(ctx, SCOPES.READ);
          return ok(await tools.updateApplicationStatus(accountFrom(ctx), args));
        } catch (error) {
          return fail(error);
        }
      }
    );

    server.registerTool(
      "generate_documents",
      {
        title: "Generate documents",
        description:
          "Draft a tailored resume and cover letter for an application and score " +
          "them. Spends the account's AI provider credit. Refuses to overwrite " +
          "existing documents unless regenerate is true.",
        inputSchema: schemas.generateDocumentsInput,
        annotations: { readOnlyHint: false, destructiveHint: true },
      },
      async (args, ctx) => {
        try {
          assertScope(ctx, SCOPES.GENERATE);
          return ok(await tools.generateDocuments(accountFrom(ctx), args));
        } catch (error) {
          return fail(error);
        }
      }
    );

    server.registerTool(
      "score_application",
      {
        title: "Score application",
        description:
          "Score an existing resume against its posting. Returns the stored score " +
          "unless refresh is true, which spends AI provider credit.",
        inputSchema: schemas.scoreApplicationInput,
        annotations: { readOnlyHint: false },
      },
      async (args, ctx) => {
        try {
          assertScope(ctx, SCOPES.GENERATE);
          return ok(await tools.scoreApplication(accountFrom(ctx), args));
        } catch (error) {
          return fail(error);
        }
      }
    );
  },
  {
    serverInfo: { name: "job-search-assistant", version: "1.0.0" },
  }
);

/**
 * Verifies the bearer token and resolves it to a local account.
 *
 * Returning undefined makes withMcpAuth emit the RFC 9728 challenge, which is
 * how clients discover where to authenticate.
 */
async function verifyToken(
  _req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined;

  try {
    const verified = await verifyAccessToken(bearerToken);
    const account = await resolveAccount(verified);

    return {
      token: bearerToken,
      clientId: verified.subject,
      scopes: verified.scopes,
      expiresAt: verified.expiresAt
        ? Math.floor(verified.expiresAt.getTime() / 1000)
        : undefined,
      resource: new URL(getMcpAuthConfig().resource),
      extra: { account } satisfies McpAuthExtra,
    };
  } catch (error) {
    if (error instanceof TokenError || error instanceof AccountNotLinkedError) {
      // Details are deliberately not echoed to the client; the challenge
      // header tells it what to do next.
      console.warn("MCP authentication rejected:", error.message);
      return undefined;
    }
    throw error;
  }
}

const authed = withMcpAuth(handler, verifyToken, {
  required: true,
  resourceMetadataPath: "/.well-known/oauth-protected-resource",
});

export { authed as GET, authed as POST, authed as DELETE };
