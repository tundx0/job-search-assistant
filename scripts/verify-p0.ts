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

  const generateRoute = await import("../src/app/api/jobs/generate/route");
  const originalError = console.error;
  console.error = () => {};
  try {
    const generateResponse = await generateRoute.POST(
      new Request("http://localhost/api/jobs/generate", { method: "POST" })
    );
    const generateBody = await generateResponse.json();
    assert.equal(typeof generateBody.message, "string");
    assert.match(generateResponse.headers.get("content-type") || "", /json/i);
    assert.ok(
      generateResponse.status >= 400,
      "generate route must return a JSON error rather than throwing HTML 500"
    );
  } finally {
    console.error = originalError;
  }

  const { LocalStorageProvider } = await import("../src/lib/storage/local-provider");
  const local = new LocalStorageProvider();
  await assert.rejects(
    () => local.downloadFile("../package.json"),
    (error: unknown) =>
      error instanceof Error && /Invalid file path|Failed to download/i.test(error.message)
  );
  await assert.rejects(
    () => local.downloadFile("/etc/passwd"),
    (error: unknown) => error instanceof Error
  );

  const {
    sanitizeStorageKey,
    resolveOwnedStorageKey,
    resolveJobOwnedStorageKey,
    resolveStorageFsPath,
    getStorageRoot,
    parseStorageKeyFromUrl,
    parseStorageLocationFromUrl,
    getAuthenticatedFileUrl,
    isLegacyAppStoragePath,
  } = await import("../src/lib/storage/paths");

  const userId = "11111111-1111-1111-1111-111111111111";
  const jobId = "22222222-2222-2222-2222-222222222222";
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

  assert.equal(isLegacyAppStoragePath("/storage/resume.pdf"), true);
  assert.equal(isLegacyAppStoragePath("/storage/v1/object/public/docs/x"), false);
  assert.notEqual(
    parseStorageKeyFromUrl("/storage/v1/object/public/docs/resume.json"),
    "v1/object/public/docs/resume.json"
  );
  assert.deepEqual(
    parseStorageLocationFromUrl("/storage/v1/object/public/docs/resume.json"),
    { key: "resume.json", provider: "supabase", bucket: "docs" }
  );
  assert.equal(
    parseStorageKeyFromUrl("https://xyz.supabase.co/storage/v1/object/public/documents/resume-abc.json"),
    "resume-abc.json"
  );
  assert.deepEqual(
    parseStorageLocationFromUrl(
      "https://xyz.supabase.co/storage/v1/object/public/documents/resume-abc.json"
    ),
    { key: "resume-abc.json", provider: "supabase", bucket: "documents" }
  );
  assert.deepEqual(
    parseStorageLocationFromUrl(
      `https://job-files.s3.us-east-1.amazonaws.com/resume-${jobId}.json`
    ),
    { key: `resume-${jobId}.json`, provider: "aws", bucket: "job-files" }
  );
  assert.deepEqual(
    parseStorageLocationFromUrl(
      `https://s3.us-east-1.amazonaws.com/job-files/resume-${jobId}.json`
    ),
    { key: `resume-${jobId}.json`, provider: "aws", bucket: "job-files" }
  );
  assert.equal(
    resolveJobOwnedStorageKey(`resume-${jobId}.json`, userId, jobId),
    `resume-${jobId}.json`
  );
  assert.equal(
    resolveJobOwnedStorageKey("users/other-user/resume.json", userId, jobId),
    null
  );
  assert.equal(
    getAuthenticatedFileUrl("users/id/resume.pdf", {
      provider: "aws",
      bucket: "job-files",
    }),
    "/api/storage/file?name=users%2Fid%2Fresume.pdf&provider=aws&bucket=job-files"
  );

  const { sdkBodyToBuffer } = await import("../src/lib/storage/bytes");
  const pdfBytes = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0xff]);
  const recovered = await sdkBodyToBuffer({
    transformToByteArray: async () => pdfBytes,
  });
  assert.deepEqual(Uint8Array.from(recovered), pdfBytes);

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
  console.log("- generate route module loads without a system OpenAI key and returns JSON errors");
  console.log("- missing keys throw a JSON-friendly MissingApiKeyError");
  console.log("- storage rejects ../package.json, absolute paths, and cross-user keys");
  console.log("- legacy S3/Supabase resume URLs parse to owned keys without fetching");
  console.log("- /storage/v1/ is not treated as a local storage key");
  console.log("- authenticated file URLs preserve provider and bucket");
  console.log("- cloud downloads keep raw bytes (no UTF-8 PDF mangling)");
  console.log("- forgot/reset/error/logout are public and not guest-only");
  console.log("- ENCRYPTION_KEY default is refused; reset tokens are hashed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
