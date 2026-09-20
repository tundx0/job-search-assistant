"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Eye,
  EyeOff,
  Key,
  Loader2,
  Save,
  Trash,
  Pencil,
  X,
} from "lucide-react";
import { ApiProvider } from "@/lib/api-keys/user-api-keys";

// Component doesn't require props

interface ApiKeyState {
  openai: string;
  google: string;
  anthropic: string;
  deepseek: string;
  mcp: string;
}

interface MaskedKeyState {
  openai: string;
  google: string;
  anthropic: string;
  deepseek: string;
  mcp: string;
}

interface EditingState {
  openai: boolean;
  google: boolean;
  anthropic: boolean;
  deepseek: boolean;
  mcp: boolean;
}

interface ApiKeyVisibility {
  openai: boolean;
  google: boolean;
  anthropic: boolean;
  deepseek: boolean;
  mcp: boolean;
}

export function ApiKeysSettings() {
  const [apiKeys, setApiKeys] = useState<ApiKeyState>({
    openai: "",
    google: "",
    anthropic: "",
    deepseek: "",
    mcp: "",
  });

  const [maskedKeys, setMaskedKeys] = useState<MaskedKeyState>({
    openai: "",
    google: "",
    anthropic: "",
    deepseek: "",
    mcp: "",
  });

  const [editing, setEditing] = useState<EditingState>({
    openai: false,
    google: false,
    anthropic: false,
    deepseek: false,
    mcp: false,
  });

  const [showApiKey, setShowApiKey] = useState<ApiKeyVisibility>({
    openai: false,
    google: false,
    anthropic: false,
    deepseek: false,
    mcp: false,
  });

  const [loading, setLoading] = useState<Record<ApiProvider, boolean>>({
    openai: false,
    google: false,
    anthropic: false,
    deepseek: false,
    mcp: false,
  });

  const [savedKeys, setSavedKeys] = useState<Record<ApiProvider, boolean>>({
    openai: false,
    google: false,
    anthropic: false,
    deepseek: false,
    mcp: false,
  });

  // Fetch existing API keys on component mount
  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/settings/api-keys");
      if (response.ok) {
        const data = await response.json();

        // Update the saved keys status and masked keys
        const saved: Record<ApiProvider, boolean> = {
          openai: false,
          google: false,
          anthropic: false,
          deepseek: false,
          mcp: false,
        };

        const masked: MaskedKeyState = {
          openai: "",
          google: "",
          anthropic: "",
          deepseek: "",
          mcp: "",
        };

        data.forEach((key: { provider: ApiProvider; apiKey?: string }) => {
          saved[key.provider] = true;
          if (key.apiKey) {
            masked[key.provider] = key.apiKey;
          }
        });

        setSavedKeys(saved);
        setMaskedKeys(masked);

        // Reset editing state for all providers
        setEditing({
          openai: false,
          google: false,
          anthropic: false,
          deepseek: false,
          mcp: false,
        });

        // Reset input fields
        setApiKeys({
          openai: "",
          google: "",
          anthropic: "",
          deepseek: "",
          mcp: "",
        });
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
    }
  };

  const toggleShowApiKey = (provider: ApiProvider) => {
    setShowApiKey((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  const handleApiKeyChange = (provider: ApiProvider, value: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [provider]: value,
    }));
  };

  const startEditing = (provider: ApiProvider) => {
    setEditing((prev) => ({
      ...prev,
      [provider]: true,
    }));
    // Clear the input field when starting to edit
    setApiKeys((prev) => ({
      ...prev,
      [provider]: "",
    }));
  };

  const cancelEditing = (provider: ApiProvider) => {
    setEditing((prev) => ({
      ...prev,
      [provider]: false,
    }));
    // Clear the input field
    setApiKeys((prev) => ({
      ...prev,
      [provider]: "",
    }));
  };

  const saveApiKey = async (provider: ApiProvider) => {
    let keyToSave = apiKeys[provider];
    
    // For MCP, we pass "GENERATE" if they just clicked the button
    if (provider === "mcp" && !keyToSave && !savedKeys[provider]) {
      keyToSave = "GENERATE";
    }

    if (!keyToSave) return;

    setLoading((prev) => ({ ...prev, [provider]: true }));

    try {
      const response = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          apiKey: keyToSave,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.generatedKey) {
          toast.success(`${providerName(provider)} API key generated! Please copy it now:`, {
            description: data.generatedKey,
            duration: 10000,
          });
        } else {
          toast.success(`${providerName(provider)} API key saved successfully`);
        }
        // Refresh the API keys to get the updated masked key
        fetchApiKeys();
      } else {
        const error = await response.text();
        toast.error(`Failed to save API key: ${error}`);
      }
    } catch (error) {
      console.error("Error saving API key:", error);
      toast.error("Failed to save API key. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const deleteApiKey = async (provider: ApiProvider) => {
    setLoading((prev) => ({ ...prev, [provider]: true }));

    try {
      const response = await fetch(
        `/api/settings/api-keys?provider=${provider}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success(`${providerName(provider)} API key deleted successfully`);

        // Update local state
        setSavedKeys((prev) => ({ ...prev, [provider]: false }));
        setMaskedKeys((prev) => ({ ...prev, [provider]: "" }));
        setApiKeys((prev) => ({ ...prev, [provider]: "" }));

        // Refresh the API keys
        fetchApiKeys();
      } else {
        const error = await response.text();
        toast.error(`Failed to delete API key: ${error}`);
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast.error("Failed to delete API key. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const providerName = (provider: ApiProvider): string => {
    switch (provider) {
      case "openai":
        return "OpenAI";
      case "google":
        return "Google AI";
      case "anthropic":
        return "Anthropic";
      case "deepseek":
        return "DeepSeek";
      case "mcp":
        return "MCP Access Token";
      default:
        return provider;
    }
  };

  const providerDescription = (provider: ApiProvider): string => {
    switch (provider) {
      case "openai":
        return "Power your applications with GPT-4 and other OpenAI models.";
      case "google":
        return "Use Google's Gemini models for advanced AI capabilities.";
      case "anthropic":
        return "Leverage Anthropic's Claude models for safer AI interactions.";
      case "deepseek":
        return "Access DeepSeek's specialized models for technical tasks.";
      case "mcp":
        return "Generate a unique access token for your LLM agents (like Grokbot) to act on your behalf.";
      default:
        return "";
    }
  };

  const renderApiKeyCard = (provider: ApiProvider) => {
    const isKeyVisible = showApiKey[provider];
    const isEditing = editing[provider];
    const hasSavedKey = savedKeys[provider];
    const maskedKey = maskedKeys[provider];

    return (
      <Card key={provider} className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {providerName(provider)}
          </CardTitle>
          <CardDescription>{providerDescription(provider)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor={`${provider}-api-key`}>API Key</Label>
              <div className="flex items-center space-x-2">
                {hasSavedKey && !isEditing ? (
                  <>
                    <div className="flex-1 relative">
                      <Input
                        id={`${provider}-api-key-masked`}
                        value={maskedKey}
                        type={isKeyVisible ? "text" : "password"}
                        placeholder="API Key"
                        disabled={true}
                        className="pr-10"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="absolute right-0 inset-y-0 my-auto"
                        onClick={() => toggleShowApiKey(provider)}
                      >
                        {isKeyVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {isKeyVisible ? "Hide" : "Show"} API Key
                        </span>
                      </Button>
                    </div>
                    {provider !== "mcp" && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => startEditing(provider)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit API Key</span>
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex-1 relative">
                      <Input
                        id={`${provider}-api-key`}
                        value={apiKeys[provider]}
                        type={isKeyVisible ? "text" : "password"}
                        placeholder={provider === "mcp" ? "Click Generate below to create a secure key" : "Enter API Key"}
                        onChange={(e) =>
                          handleApiKeyChange(provider, e.target.value)
                        }
                        readOnly={provider === "mcp"}
                        disabled={provider === "mcp"}
                        className="pr-10"
                      />
                      {provider !== "mcp" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="absolute right-0 inset-y-0 my-auto"
                          onClick={() => toggleShowApiKey(provider)}
                        >
                          {isKeyVisible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {isKeyVisible ? "Hide" : "Show"} API Key
                          </span>
                        </Button>
                      )}
                    </div>
                    {isEditing && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => cancelEditing(provider)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Cancel Editing</span>
                      </Button>
                    )}
                  </>
                )}
              </div>
              {provider === "openai" && (
                <p className="text-xs text-muted-foreground mt-1">
                  You can find your OpenAI API key in the{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-info hover:underline"
                  >
                    OpenAI dashboard
                  </a>
                  .
                </p>
              )}
              {provider === "google" && (
                <p className="text-xs text-muted-foreground mt-1">
                  You can find your Google AI API key in the{" "}
                  <a
                    href="https://ai.google.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-info hover:underline"
                  >
                    Google AI Studio
                  </a>
                  .
                </p>
              )}
              {provider === "anthropic" && (
                <p className="text-xs text-muted-foreground mt-1">
                  You can find your Anthropic API key in your{" "}
                  <a
                    href="https://console.anthropic.com/account/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-info hover:underline"
                  >
                    Anthropic console
                  </a>
                  .
                </p>
              )}
              {provider === "deepseek" && (
                <p className="text-xs text-muted-foreground mt-1">
                  You can find your DeepSeek API key in the{" "}
                  <a
                    href="https://platform.deepseek.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-info hover:underline"
                  >
                    DeepSeek platform
                  </a>
                  .
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={() => deleteApiKey(provider)}
            disabled={loading[provider] || !savedKeys[provider]}
          >
            {loading[provider] ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash className="h-4 w-4 mr-2" />
            )}
            {provider === "mcp" ? "Revoke Key" : "Delete Key"}
          </Button>
          <Button
            onClick={() => saveApiKey(provider)}
            disabled={loading[provider] || (!apiKeys[provider] && !isEditing && provider !== "mcp")}
          >
            {loading[provider] ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {provider === "mcp" && !savedKeys[provider] ? "Generate Key" : "Save Key"}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div>
      <div className="mb-7 border-b border-[var(--rule)] pb-5">
        <h2 className="text-2xl font-semibold tracking-tight">API Keys</h2>
        <p className="text-muted-foreground">
          Add your own API keys to use with different AI providers, or generate an MCP Access Token for your agents. Your keys
          are encrypted and stored securely.
        </p>
      </div>

      <div className="space-y-6">
        {renderApiKeyCard("openai")}
        {renderApiKeyCard("google")}
        {renderApiKeyCard("anthropic")}
        {renderApiKeyCard("deepseek")}
        {renderApiKeyCard("mcp")}
      </div>
    </div>
  );
}
