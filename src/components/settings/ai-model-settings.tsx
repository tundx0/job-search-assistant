"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Bot, Check, Loader2 } from "lucide-react";
import { ApiProvider } from "@/lib/api-keys/user-api-keys";
import { AI_MODELS } from "@/lib/ai/enhanced-provider";

export function AiModelSettings() {
  const [selectedProvider, setSelectedProvider] = useState<ApiProvider | null>(
    null
  );
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [availableProviders, setAvailableProviders] = useState<ApiProvider[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch user's current AI model preference and available providers
  useEffect(() => {
    const fetchUserPreferences = async () => {
      setLoading(true);
      try {
        // Set all providers as available regardless of API key status
        // This allows users to select any provider and then be prompted to add an API key if needed
        const allProviders: ApiProvider[] = ["openai", "google", "anthropic", "deepseek"];
        setAvailableProviders(allProviders);
        
        // Fetch user's available API keys for reference (not used directly)
        await fetch("/api/settings/api-keys");

        // Fetch user's current AI model preference
        const prefResponse = await fetch("/api/settings/ai-model-preference");
        if (prefResponse.ok) {
          const prefData = await prefResponse.json();
          if (prefData.provider) {
            setSelectedProvider(prefData.provider);
            // Use the model ID from the API response if available
            if (prefData.modelId) {
              setSelectedModel(prefData.modelId);
            } else {
              // Fall back to the default model for the provider if no model ID is set
              setSelectedModel(getDefaultModelForProvider(prefData.provider));
            }
          } else {
            // Default to OpenAI if no preference is set
            setSelectedProvider("openai");
            setSelectedModel("gpt-4");
          }
        }
      } catch (error) {
        console.error("Error fetching user preferences:", error);
        toast.error("Failed to load your AI model preferences");
      } finally {
        setLoading(false);
      }
    };

    fetchUserPreferences();
  }, []);

  const saveModelPreference = async () => {
    if (!selectedProvider) {
      toast.error("Please select an AI provider");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/settings/ai-model-preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: selectedProvider,
          modelId:
            selectedModel || getDefaultModelForProvider(selectedProvider),
        }),
      });

      if (response.ok) {
        toast.success("AI model preference saved successfully");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to save AI model preference");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(
        error.message ||
          "An error occurred while saving your AI model preference"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleProviderChange = (provider: ApiProvider) => {
    setSelectedProvider(provider);
    // Set default model for the selected provider
    setSelectedModel(getDefaultModelForProvider(provider));
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
  };

  const getDefaultModelForProvider = (provider: ApiProvider): string => {
    switch (provider) {
      case "openai":
        return "gpt-4";
      case "google":
        return "gemini-2.0-flash";
      case "anthropic":
        return "claude-3-sonnet";
      case "deepseek":
        return "deepseek-llm";
      default:
        return "gpt-4";
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
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">AI Model Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Choose which AI provider and model to use for generating resumes and
          cover letters.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Select AI Provider
          </CardTitle>
          <CardDescription>
            Choose which AI provider to use for your job application assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedProvider || ""}
            onValueChange={(value) =>
              handleProviderChange(value as ApiProvider)
            }
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {availableProviders.map((provider) => (
                <div key={provider} className="flex items-start space-x-2">
                  <RadioGroupItem value={provider} id={`provider-${provider}`} />
                  <Label
                    htmlFor={`provider-${provider}`}
                    className="flex flex-col cursor-pointer"
                  >
                    <span className="font-medium">{providerName(provider)}</span>
                    <span className="text-sm text-gray-500">
                      {providerDescription(provider)}
                    </span>
                  </Label>
                </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {selectedProvider && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Model</CardTitle>
            <CardDescription>
              Choose which {providerName(selectedProvider)} model to use
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedModel || ""}
              onValueChange={handleModelChange}
              className="grid grid-cols-1 gap-4"
            >
              {AI_MODELS[selectedProvider].map((model) => (
                <div key={model.id} className="flex items-start space-x-2">
                  <RadioGroupItem value={model.id} id={`model-${model.id}`} />
                  <Label
                    htmlFor={`model-${model.id}`}
                    className="flex flex-col cursor-pointer"
                  >
                    <span className="font-medium">{model.name}</span>
                    <span className="text-sm text-gray-500">
                      {model.description}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter>
            <Button onClick={saveModelPreference} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Save Preferences
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
