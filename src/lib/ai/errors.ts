export const MISSING_API_KEY_MESSAGE =
  "No AI API key is available. Add an API key in Settings to generate documents.";

export class MissingApiKeyError extends Error {
  constructor(message: string = MISSING_API_KEY_MESSAGE) {
    super(message);
    this.name = "MissingApiKeyError";
  }
}

export function isMissingApiKeyError(error: unknown): error is MissingApiKeyError {
  return (
    error instanceof MissingApiKeyError ||
    (error instanceof Error && error.name === "MissingApiKeyError")
  );
}
