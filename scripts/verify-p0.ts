import assert from "node:assert/strict";
import { createHash } from "node:crypto";

async function main() {
  const originalOpenAI = process.env.OPENAI_API_KEY;
  const originalGoogle = process.env.GOOGLE_API_KEY;
  const originalGoogleAI = process.env.GOOGLE_AI_API_KEY;
  const originalEnc = process.env.ENCRYPTION_KEY;

  delete process.env.OPENAI_API_KEY;
  delete process.env.GOOGLE_API_KEY;
  delete process.env.GOOGLE_AI_API_KEY;

  const { getAIProvider, generateText } = await import("../src/lib/ai/provider");
  assert.equal(getAIProvider(), "openai");

  await assert.rejects(
    () => generateText("prompt", "system"),
    (error: unknown) =>
      error instanceof Error &&
      error.name === "MissingApiKeyError" &&
      error.message.includes("Add an API key in Settings")
  );

  const { generateTextWithSystemKey, MissingApiKeyError } = await import(
    "../src/lib/ai/enhanced-provider"
  );
  await assert.rejects(
    () => generateTextWithSystemKey("prompt", "system"),
    (error: unknown) =>
      error instanceof MissingApiKeyError &&
      error.message.includes("Add an API key in Settings")
  );

  await import("../src/app/api/jobs/generate/route");

  const {
    sanitizeStorageKey,
    resolveOwnedStorageKey,
    resolveStorageFsPath,
    getStorageRoot,
    parseStorageKeyFromUrl,
  } = await import("../src/lib/storage/paths");

  const userId = "11111111-1111-1111-1111-111111111111";
  assert.equal(sanitizeStorageKey("../package.json"), null);
  assert.equal(sanitizeStorageKey("/etc/passwd"), null);
  assert.equal(sanitizeStorageKey("..\\package.json"), null);
  assert.equal(resolveOwnedStorageKey("../package.json", userId), null);
  assert.equal(
    resolveOwnedStorageKey("users/other-user/secret.txt", userId),
    null
  );
  assert.equal(
    resolveOwnedStorageKey("resume.pdf", userId),
    `users/${userId}/resume.pdf`
  );
  assert.equal(
    resolveStorageFsPath(getStorageRoot(), "../package.json"),
    null
  );
  assert.equal(
    parseStorageKeyFromUrl("/api/storage/file?name=users%2Fid%2Fresume.pdf"),
    "users/id/resume.pdf"
  );

  const { isPublicPath, isGuestOnlyAuthPath } = await import(
    "../src/lib/auth/public-paths"
  );
  assert.equal(isPublicPath("/auth/forgot-password"), true);
  assert.equal(isPublicPath("/auth/reset-password"), true);
  assert.equal(isPublicPath("/auth/error"), true);
  assert.equal(isPublicPath("/auth/logout"), true);
  assert.equal(isPublicPath("/dashboard"), false);
  assert.equal(isGuestOnlyAuthPath("/auth/forgot-password"), false);
  assert.equal(isGuestOnlyAuthPath("/auth/login"), true);

  delete process.env.ENCRYPTION_KEY;
  const { encryptData } = await import("../src/lib/encryption");
  assert.throws(
    () => encryptData("sk-test"),
    (error: unknown) =>
      error instanceof Error && error.message.includes("ENCRYPTION_KEY")
  );

  process.env.ENCRYPTION_KEY = "default-dev-encryption-key-32-chars";
  assert.throws(
    () => encryptData("sk-test"),
    (error: unknown) =>
      error instanceof Error && error.message.includes("ENCRYPTION_KEY")
  );

  const { hashResetToken } = await import("../src/lib/auth/reset-token");
  const token = "plain-reset-token";
  assert.equal(
    hashResetToken(token),
    createHash("sha256").update(token).digest("hex")
  );
  assert.notEqual(hashResetToken(token), token);

  if (originalOpenAI === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalOpenAI;
  if (originalGoogle === undefined) delete process.env.GOOGLE_API_KEY;
  else process.env.GOOGLE_API_KEY = originalGoogle;
  if (originalGoogleAI === undefined) delete process.env.GOOGLE_AI_API_KEY;
  else process.env.GOOGLE_AI_API_KEY = originalGoogleAI;
  if (originalEnc === undefined) delete process.env.ENCRYPTION_KEY;
  else process.env.ENCRYPTION_KEY = originalEnc;

  console.log("P0 verification passed:");
  console.log("- AI clients do not throw at import when system keys are missing");
  console.log("- generate route module loads without a system OpenAI key");
  console.log("- missing keys throw a JSON-friendly MissingApiKeyError");
  console.log("- storage rejects ../package.json and cross-user keys");
  console.log("- forgot/reset/error/logout are public and not guest-only");
  console.log("- ENCRYPTION_KEY default is refused; reset tokens are hashed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
