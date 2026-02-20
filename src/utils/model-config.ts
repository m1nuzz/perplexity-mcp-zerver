/**
 * Model Configuration for Perplexity MCP Server
 * Defines available models and validation rules
 */

export interface ModelConfig {
  name: string;
  displayName: string;
  selectorText: string;
  isDefault?: boolean;
}

/**
 * Available models in Perplexity AI
 * These are the models displayed in the model selection dropdown
 */
export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    name: "claude-sonnet-4.6",
    displayName: "Claude Sonnet 4.6",
    selectorText: "Claude Sonnet 4.6",
    isDefault: true,
  },
  {
    name: "gemini-3.1-pro",
    displayName: "Gemini 3.1 Pro",
    selectorText: "Gemini 3.1 Pro",
  },
  {
    name: "gemini-3-flash",
    displayName: "Gemini 3 Flash",
    selectorText: "Gemini 3 Flash",
  },
  {
    name: "gpt-5.2",
    displayName: "GPT-5.2",
    selectorText: "GPT-5.2",
  },
  {
    name: "grok-4.1",
    displayName: "Grok 4.1",
    selectorText: "Grok 4.1",
  },
  {
    name: "kimi-k2.5",
    displayName: "Kimi K2.5",
    selectorText: "Kimi K2.5",
  },
  {
    name: "claude-opus-4.6",
    displayName: "Claude Opus 4.6",
    selectorText: "Claude Opus 4.6",
  },
  {
    name: "reasoning",
    displayName: "Reasoning",
    selectorText: "Reasoning",
  },
  {
    name: "sonar",
    displayName: "Sonar",
    selectorText: "Sonar",
  },
];

/**
 * Banned model patterns that should never be used
 * These are typically default/generic model names
 */
export const BANNED_MODEL_PATTERNS: RegExp[] = [
  /^model$/i, // "Model" in any case
  /^sonar$/i, // "Sonar" in any case (too generic)
  /^модель$/i, // "Модель" in Russian
  /^modelo$/i, // "Modelo" in Spanish/Portuguese
  /^モデル$/i, // "Model" in Japanese
];

/**
 * Validate if a model name is allowed
 * @param modelName - The model name to validate
 * @returns true if the model is allowed, false otherwise
 */
export function isModelAllowed(modelName: string): boolean {
  // Check against banned patterns
  for (const pattern of BANNED_MODEL_PATTERNS) {
    if (pattern.test(modelName.trim())) {
      return false;
    }
  }
  return true;
}

/**
 * Get a model configuration by name
 * @param modelName - The name or display name of the model
 * @returns ModelConfig if found, undefined otherwise
 */
export function getModelConfig(modelName: string): ModelConfig | undefined {
  // Normalize the input
  const normalizedName = modelName.toLowerCase().trim();

  // Try exact name match first
  let model = AVAILABLE_MODELS.find((m) => m.name.toLowerCase() === normalizedName);

  if (!model) {
    // Try display name match
    model = AVAILABLE_MODELS.find((m) => m.displayName.toLowerCase() === normalizedName);
  }

  if (!model) {
    // Try selector text match
    model = AVAILABLE_MODELS.find((m) => m.selectorText.toLowerCase() === normalizedName);
  }

  return model;
}

/**
 * Get the default model configuration
 * @returns The default ModelConfig
 */
export function getDefaultModel(): ModelConfig {
  const defaultModel = AVAILABLE_MODELS.find((m) => m.isDefault);
  if (!defaultModel) {
    throw new Error("No default model configured");
  }
  return defaultModel;
}

/**
 * Filter models to only allow valid ones
 * @param modelName - The requested model name
 * @returns The validated model name or the default model name if invalid
 */
export function getValidatedModel(modelName: string | undefined): string {
  if (!modelName) {
    return getDefaultModel().name;
  }

  const modelConfig = getModelConfig(modelName);

  if (!modelConfig) {
    logWarn(`Model "${modelName}" not found, using default`);
    return getDefaultModel().name;
  }

  if (!isModelAllowed(modelConfig.name)) {
    logWarn(`Model "${modelName}" is not allowed, using default`);
    return getDefaultModel().name;
  }

  return modelConfig.name;
}