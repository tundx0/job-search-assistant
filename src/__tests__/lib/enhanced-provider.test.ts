import {
  getAvailableModels,
  generateText,
  getProviderModels,
  getModelDisplayName,
} from "@/lib/ai/enhanced-provider";

// Mock environment variables
process.env.OPENAI_API_KEY = "mock-openai-key";
process.env.GOOGLE_API_KEY = "mock-google-key";

// Mock the API key functions
jest.mock("@/lib/api-keys/user-api-keys", () => ({
  getUserApiKey: jest.fn().mockImplementation((userId, provider) => {
    // Return mock API keys for testing
    if (provider === "openai") return "sk-test-openai";
    if (provider === "google") return "test-google";
    if (provider === "anthropic") return "sk-ant-test123";
    if (provider === "deepseek") return "sk-ds-test123";
    return null;
  }),
  getUserAiModelPreference: jest.fn().mockResolvedValue("openai"),
  ApiProvider: {
    OPENAI: "openai",
    GOOGLE: "google",
    ANTHROPIC: "anthropic",
    DEEPSEEK: "deepseek",
  },
}));

// Mock the OpenAI library
jest.mock("openai", () => {
  // Create a constructor function that returns a mock instance
  const mockOpenAI = jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: "OpenAI generated response" } }],
        }),
      },
    },
  }));

  // Return the constructor as the default export
  return mockOpenAI;
});

// Make OpenAI constructor available globally
jest.mock(
  "@/lib/ai/enhanced-provider",
  () => {
    // Get the actual module
    const originalModule = jest.requireActual("@/lib/ai/enhanced-provider");

    // Set the OpenAI constructor in the global scope
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).OpenAI = jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: "OpenAI generated response" } }],
          }),
        },
      },
    }));

    // Return the original module
    return originalModule;
  },
  { virtual: true }
);

jest.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        startChat: jest.fn().mockReturnValue({
          sendMessage: jest.fn().mockResolvedValue({
            response: {
              text: () => "Google generated response",
            },
          }),
        }),
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => "Google generated response",
          },
        }),
      }),
    })),
  };
});

// Mock fetch for Anthropic and DeepSeek API calls
global.fetch = jest.fn();

describe("Enhanced AI Provider", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fetch for Anthropic and DeepSeek
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("anthropic.com")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              content: [{ text: "Anthropic generated response" }],
            }),
        });
      } else if (url.includes("deepseek.com")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [
                { message: { content: "DeepSeek generated response" } },
              ],
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  describe("getAvailableModels", () => {
    it("returns all models when all provider keys are available", () => {
      const apiKeys: { [key: string]: string } = {
        openai: "sk-test-openai",
        google: "test-google",
        anthropic: "sk-ant-test123",
        deepseek: "sk-ds-test123",
      };

      const models: { id: string; provider: string }[] =
        getAvailableModels(apiKeys);

      // Should include models from all providers
      expect(models.some((m) => m.provider === "openai")).toBe(true);
      expect(models.some((m) => m.provider === "google")).toBe(true);
      expect(models.some((m) => m.provider === "anthropic")).toBe(true);
      expect(models.some((m) => m.provider === "deepseek")).toBe(true);
    });

    it("includes system providers even without user API keys", () => {
      const apiKeys: { [key: string]: string } = {};

      const models: { id: string; provider: string }[] =
        getAvailableModels(apiKeys);

      // Should include models from system providers
      expect(models.some((m) => m.provider === "openai")).toBe(true);
      expect(models.some((m) => m.provider === "google")).toBe(true);

      // Should not include models from providers without system keys
      expect(models.some((m) => m.provider === "anthropic")).toBe(false);
      expect(models.some((m) => m.provider === "deepseek")).toBe(false);
    });

    it("returns all available models", () => {
      const models: { id: string; provider: string }[] = getAvailableModels();

      // Verify models from all providers are included
      expect(models.some((m) => m.id.includes("gpt"))).toBe(true);
      expect(models.some((m) => m.id.includes("gemini"))).toBe(true);
      expect(models.some((m) => m.id.includes("claude"))).toBe(true);
      expect(models.some((m) => m.id.includes("deepseek"))).toBe(true);
    });
  });

  describe("getProviderModels", () => {
    it("returns OpenAI models", () => {
      const openaiModels: { id: string; provider: string }[] =
        getProviderModels("openai");

      expect(openaiModels.length).toBeGreaterThan(0);
      expect(openaiModels.every((m) => m.provider === "openai")).toBe(true);
      expect(openaiModels.some((m) => m.id === "gpt-4")).toBe(true);
    });

    it("returns Google models", () => {
      const googleModels: { id: string; provider: string }[] =
        getProviderModels("google");

      expect(googleModels.length).toBeGreaterThan(0);
      expect(googleModels.every((m) => m.provider === "google")).toBe(true);
      expect(googleModels.some((m) => m.id.includes("gemini"))).toBe(true);
    });

    it("returns Anthropic models", () => {
      const anthropicModels: { id: string; provider: string }[] =
        getProviderModels("anthropic");

      expect(anthropicModels.length).toBeGreaterThan(0);
      expect(anthropicModels.every((m) => m.provider === "anthropic")).toBe(
        true
      );
      expect(anthropicModels.some((m) => m.id.includes("claude"))).toBe(true);
    });

    it("returns DeepSeek models", () => {
      const deepseekModels: { id: string; provider: string }[] =
        getProviderModels("deepseek");

      expect(deepseekModels.length).toBeGreaterThan(0);
      expect(deepseekModels.every((m) => m.provider === "deepseek")).toBe(true);
      expect(deepseekModels.some((m) => m.id.includes("deepseek"))).toBe(true);
    });
  });

  describe("getModelDisplayName", () => {
    it("returns display name for a model ID", () => {
      // Test OpenAI models
      expect(getModelDisplayName("gpt-4")).toBe("GPT-4");
      expect(getModelDisplayName("gpt-3.5-turbo")).toBe("GPT-3.5 Turbo");

      // Test Google models
      expect(getModelDisplayName("gemini-2.0-pro")).toBe("Gemini 2.0 Pro");

      // Test Anthropic models
      expect(getModelDisplayName("claude-3-opus")).toBe("Claude 3 Opus");

      // Test DeepSeek models
      expect(getModelDisplayName("deepseek-coder")).toBe("DeepSeek Coder");

      // Test unknown model ID
      expect(getModelDisplayName("unknown-model")).toBe("unknown-model");
    });

    it("returns display names for OpenAI models", () => {
      expect(getModelDisplayName("gpt-4")).toBe("GPT-4");
      expect(getModelDisplayName("gpt-4-turbo")).toBe("GPT-4 Turbo");
      expect(getModelDisplayName("gpt-3.5-turbo")).toBe("GPT-3.5 Turbo");
    });

    it("returns display names for Google models", () => {
      expect(getModelDisplayName("gemini-2.0-pro")).toBe("Gemini 2.0 Pro");
      expect(getModelDisplayName("gemini-2.0-flash")).toBe("Gemini 2.0 Flash");
    });

    it("returns display names for Anthropic models", () => {
      expect(getModelDisplayName("claude-3-opus")).toBe("Claude 3 Opus");
      expect(getModelDisplayName("claude-3-sonnet")).toBe("Claude 3 Sonnet");
      expect(getModelDisplayName("claude-3-haiku")).toBe("Claude 3 Haiku");
    });

    it("returns display names for DeepSeek models", () => {
      expect(getModelDisplayName("deepseek-coder")).toBe("DeepSeek Coder");
      expect(getModelDisplayName("deepseek-llm")).toBe("DeepSeek LLM");
    });
  });

  describe("generateText", () => {
    const mockUserId = "user-123";
    const mockPrompt = "Generate a resume summary";
    const mockSystemPrompt = "You are a helpful assistant";

    it("generates text with OpenAI", async () => {
      const result = await generateText(
        mockUserId,
        mockPrompt,
        mockSystemPrompt,
        {
          provider: "openai",
          modelId: "gpt-4",
          temperature: 0.7,
          maxTokens: 1000,
        }
      );

      expect(result).toBe("OpenAI generated response");
    });

    it("generates text with Google", async () => {
      const result = await generateText(
        mockUserId,
        mockPrompt,
        mockSystemPrompt,
        {
          provider: "google",
          modelId: "gemini-2.0-pro",
          temperature: 0.7,
          maxTokens: 1000,
        }
      );

      expect(result).toBe("Google generated response");
    });

    it("generates text with Anthropic", async () => {
      const result = await generateText(
        mockUserId,
        mockPrompt,
        mockSystemPrompt,
        {
          provider: "anthropic",
          modelId: "claude-3-opus",
          temperature: 0.7,
          maxTokens: 1000,
        }
      );

      expect(result).toBe("Anthropic generated response");
    });

    it("generates text with DeepSeek", async () => {
      const result = await generateText(
        mockUserId,
        mockPrompt,
        mockSystemPrompt,
        {
          provider: "deepseek",
          modelId: "deepseek-coder",
          temperature: 0.7,
          maxTokens: 1000,
        }
      );

      expect(result).toBe("DeepSeek generated response");
    });

    it("falls back to system API keys when user key is not available", async () => {
      // Mock getUserApiKey to return null to simulate missing user key
      const { getUserApiKey } = jest.requireMock(
        "@/lib/api-keys/user-api-keys"
      );
      getUserApiKey.mockImplementationOnce(() => null);

      const result = await generateText(
        mockUserId,
        mockPrompt,
        mockSystemPrompt,
        {
          provider: "openai",
          modelId: "gpt-4",
        }
      );

      expect(result).toBe("OpenAI generated response");
    });

    it("throws an error when no API key is available", async () => {
      // Save original environment and mock values
      const originalOpenAIKey = process.env.OPENAI_API_KEY;
      const originalGoogleKey = process.env.GOOGLE_API_KEY;
      const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
      const originalDeepSeekKey = process.env.DEEPSEEK_API_KEY;

      // Clear all API keys to simulate no keys available
      process.env.OPENAI_API_KEY = "";
      process.env.GOOGLE_API_KEY = "";
      process.env.ANTHROPIC_API_KEY = "";
      process.env.DEEPSEEK_API_KEY = "";

      // Mock getUserApiKey to return null
      const { getUserApiKey } = jest.requireMock(
        "@/lib/api-keys/user-api-keys"
      );
      getUserApiKey.mockImplementationOnce(() => null);

      // Expect the function to throw an error
      await expect(
        generateText(mockUserId, mockPrompt, mockSystemPrompt, {
          provider: "openai",
          modelId: "gpt-4",
        })
      ).rejects.toThrow("No API key available for OpenAI");

      // Restore original API keys
      process.env.OPENAI_API_KEY = originalOpenAIKey;
      process.env.GOOGLE_API_KEY = originalGoogleKey;
      process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
      process.env.DEEPSEEK_API_KEY = originalDeepSeekKey;
    });
  });
});
