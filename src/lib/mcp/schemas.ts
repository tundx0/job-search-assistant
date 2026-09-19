// The MCP SDK advertises tool arguments through `~standard.jsonSchema`, which
// only zod v4 implements. It is installed under the `zod4` alias so the rest of
// the app keeps using zod v3 unchanged — this file is the only consumer.
import * as z from "zod4";

/** Status vocabulary shared with the web UI. */
export const APPLICATION_STATUSES = [
  "pending",
  "submitted",
  "interviewing",
  "rejected",
  "accepted",
] as const;

/**
 * Tools that take no arguments still declare an empty object schema, so every
 * handler has the same (args, ctx) signature. Omitting inputSchema changes the
 * callback arity and silently shifts ctx into the first parameter.
 */
export const emptyInput = z.object({});

export const listApplicationsInput = z.object({
  status: z.enum(APPLICATION_STATUSES).optional()
    .describe("Only return applications in this status."),
  limit: z.number().int().min(1).max(50).default(20)
    .describe("Maximum rows to return."),
  cursor: z.string().uuid().optional()
    .describe("Return rows created before this application id."),
});

export const getApplicationInput = z.object({
  id: z.string().uuid(),
  full: z.boolean().default(false)
    .describe("Return the complete job description instead of a preview."),
});

export const createApplicationInput = z.object({
  jobTitle: z.string().min(2).max(200),
  companyName: z.string().min(1).max(200),
  jobDescription: z.string().min(10).max(50_000),
  jobUrl: z.string().url().optional(),
});

export const updateStatusInput = z.object({
  id: z.string().uuid(),
  status: z.enum(APPLICATION_STATUSES),
});

export const getDocumentInput = z.object({
  applicationId: z.string().uuid(),
  kind: z.enum(["resume", "cover_letter"]),
});

export const generateDocumentsInput = z.object({
  applicationId: z.string().uuid(),
  format: z.enum(["text", "json"]).default("json"),
  regenerate: z.boolean().default(false)
    .describe(
      "Overwrite documents that already exist. Defaults to false so a repeated " +
        "call cannot silently spend the account's AI provider credit again."
    ),
});

export const scoreApplicationInput = z.object({
  applicationId: z.string().uuid(),
  refresh: z.boolean().default(false)
    .describe("Recompute the score even if one already exists."),
});
