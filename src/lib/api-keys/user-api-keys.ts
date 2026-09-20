import { prisma } from "@/lib/db/prisma";
import { encryptData, decryptData } from "@/lib/encryption";

export type ApiProvider = "openai" | "google" | "anthropic" | "deepseek" | "mcp";

/**
 * Save a user's API key for a specific provider
 */
export async function saveUserApiKey(
  userId: string,
  provider: ApiProvider,
  apiKey: string
): Promise<void> {
  // Encrypt the API key before storing
  const encryptedKey = encryptData(apiKey);

  try {
    // Upsert - create if not exists, update if exists
    await prisma.userApiKey.upsert({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
      update: {
        apiKey: encryptedKey,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId,
        provider,
        apiKey: encryptedKey,
        isActive: true,
      },
    });
  } catch (error) {
    console.error(
      `Error saving ${provider} API key for user ${userId}:`,
      error
    );
    throw new Error(`Failed to save ${provider} API key. Please try again.`);
  }
}

/**
 * Get a user's API key for a specific provider
 */
export async function getUserApiKey(
  userId: string,
  provider: ApiProvider
): Promise<string | null> {
  try {
    const apiKeyRecord = await prisma.userApiKey.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });

    if (!apiKeyRecord || !apiKeyRecord.isActive) {
      return null;
    }

    // Decrypt the API key before returning
    return decryptData(apiKeyRecord.apiKey);
  } catch (error) {
    if (error instanceof Error && error.message.includes("ENCRYPTION_KEY")) {
      throw error;
    }
    console.error(
      `Error retrieving ${provider} API key for user ${userId}:`,
      error
    );
    return null;
  }
}

/**
 * Delete a user's API key for a specific provider
 */
export async function deleteUserApiKey(
  userId: string,
  provider: ApiProvider
): Promise<boolean> {
  try {
    await prisma.userApiKey.delete({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });
    return true;
  } catch (error) {
    console.error(
      `Error deleting ${provider} API key for user ${userId}:`,
      error
    );
    return false;
  }
}

/**
 * Get all API keys for a user
 * @param userId The user ID
 * @param includeMaskedKeys Whether to include masked versions of the API keys
 * @returns Array of API key objects
 */
export async function getUserApiKeys(
  userId: string,
  includeMaskedKeys: boolean = false
) {
  try {
    // If we need masked keys, we need to select the apiKey field
    const selectFields = includeMaskedKeys
      ? {
          provider: true,
          apiKey: true,
          createdAt: true,
          updatedAt: true,
        }
      : {
          provider: true,
          createdAt: true,
          updatedAt: true,
        };

    const apiKeys = await prisma.userApiKey.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: selectFields,
    });

    // If we need to include masked keys, process them
    if (includeMaskedKeys) {
      return apiKeys.map((key) => {
        if (!key.apiKey) return key;

        // Create a masked version of the API key
        // We'll show the first 4 and last 4 characters, masking the rest
        const encrypted = key.apiKey as string;
        let maskedKey = "";

        try {
          const decrypted = decryptData(encrypted);
          if (decrypted.length <= 8) {
            maskedKey = "••••••••"; // Just show dots if key is too short
          } else {
            const prefix = decrypted.substring(0, 4);
            const suffix = decrypted.substring(decrypted.length - 4);
            const maskedPortion = "•".repeat(
              Math.min(decrypted.length - 8, 16)
            );
            maskedKey = `${prefix}${maskedPortion}${suffix}`;
          }
        } catch (e) {
          console.error(`Error decrypting API key for user ${userId}:`, e);
          maskedKey = "••••••••"; // Fallback if decryption fails
        }

        return {
          ...key,
          apiKey: maskedKey,
        };
      });
    }

    return apiKeys;
  } catch (error) {
    console.error(`Error retrieving API keys for user ${userId}:`, error);
    return [];
  }
}

/**
 * Update user's preferred AI model and model ID
 */
export async function updateUserAiModelPreference(
  userId: string,
  modelPreference: ApiProvider | null,
  modelId?: string | null
): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        aiModelPreference: modelPreference,
        aiModelId: modelId || null
      },
    });
    return true;
  } catch (error) {
    console.error(
      `Error updating AI model preference for user ${userId}:`,
      error
    );
    return false;
  }
}

/**
 * Get user's preferred AI model and model ID
 */
export async function getUserAiModelPreference(
  userId: string
): Promise<{ provider: ApiProvider | null; modelId: string | null }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        aiModelPreference: true,
        aiModelId: true 
      },
    });

    return { 
      provider: user?.aiModelPreference as ApiProvider | null,
      modelId: user?.aiModelId || null
    };
  } catch (error) {
    console.error(
      `Error getting AI model preference for user ${userId}:`,
      error
    );
    return { provider: null, modelId: null };
  }
}

/**
 * Check if a user has a valid API key for a specific provider
 */
export async function hasValidApiKey(
  userId: string,
  provider: ApiProvider
): Promise<boolean> {
  const apiKey = await getUserApiKey(userId, provider);
  return !!apiKey;
}
