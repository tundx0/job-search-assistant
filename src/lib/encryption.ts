import crypto from "crypto";

const INSECURE_DEFAULT_KEY = "default-dev-encryption-key-32-chars";

function getKeyBuffer(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  const isProduction = process.env.NODE_ENV === "production";

  if (!key || key === INSECURE_DEFAULT_KEY || key.length < 32) {
    throw new Error(
      isProduction
        ? "ENCRYPTION_KEY must be a 32+ character secret in production. Refusing to encrypt or decrypt API keys."
        : "ENCRYPTION_KEY is required to encrypt or decrypt API keys. Set a 32+ character value in .env (see .env.example)."
    );
  }

  return Buffer.from(key.padEnd(32).slice(0, 32));
}

/**
 * Encrypt sensitive data like API keys
 */
export function encryptData(text: string): string {
  if (!text) return "";

  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", getKeyBuffer(), iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    if (error instanceof Error && error.message.includes("ENCRYPTION_KEY")) {
      throw error;
    }
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt sensitive data like API keys
 */
export function decryptData(encryptedText: string): string {
  if (!encryptedText) return "";

  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted data format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      getKeyBuffer(),
      iv
    );

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    if (error instanceof Error && error.message.includes("ENCRYPTION_KEY")) {
      throw error;
    }
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}
