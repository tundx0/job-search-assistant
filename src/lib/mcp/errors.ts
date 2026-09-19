/** Stable, machine-readable failure codes returned to the agent. */
export type McpErrorCode =
  | "not_found"
  | "validation_error"
  | "no_api_key"
  | "provider_error"
  | "rate_limited"
  | "conflict";

export class McpToolError extends Error {
  constructor(
    readonly code: McpErrorCode,
    message: string,
    /** What the agent (or the user) should do about it. */
    readonly hint?: string
  ) {
    super(message);
    this.name = "McpToolError";
  }

  toPayload() {
    return { error: { code: this.code, message: this.message, hint: this.hint } };
  }
}
