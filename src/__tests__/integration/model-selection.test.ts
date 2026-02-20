/**
 * Integration tests for model selection feature
 * Tests model configuration, validation, and selection automation
 */

import { describe, expect, it } from "vitest";
import type { ModelConfig } from "../../utils/model-config.js";
import {
  AVAILABLE_MODELS,
  getModelConfig,
  getDefaultModel,
  isModelAllowed,
  getValidatedModel,
  BANNED_MODEL_PATTERNS,
} from "../../utils/model-config.js";

describe("Model Configuration", () => {
  it("should have default model configured", () => {
    const defaultModel = getDefaultModel();
    expect(defaultModel).toBeDefined();
    expect(defaultModel.isDefault).toBe(true);
    expect(defaultModel.name).toBe("claude-sonnet-4.6");
  });

  it("should have exactly one default model", () => {
    const defaultModels = AVAILABLE_MODELS.filter((m) => m.isDefault);
    expect(defaultModels).toHaveLength(1);
  });

  it("should have all required models", () => {
    const modelNames = AVAILABLE_MODELS.map((m) => m.name);
    expect(modelNames).toContain("claude-sonnet-4.6");
    expect(modelNames).toContain("gemini-3.1-pro");
    expect(modelNames).toContain("gemini-3-flash");
    expect(modelNames).toContain("gpt-5.2");
    expect(modelNames).toContain("grok-4.1");
    expect(modelNames).toContain("kimi-k2.5");
    expect(modelNames).toContain("claude-opus-4.6");
    expect(modelNames).toContain("reasoning");
  });

  it("should return correct model config by name", () => {
    const model = getModelConfig("gemini-3.1-pro");
    expect(model).toBeDefined();
    expect(model?.displayName).toBe("Gemini 3.1 Pro");
    expect(model?.selectorText).toBe("Gemini 3.1 Pro");
  });

  it("should return correct model config by display name", () => {
    const model = getModelConfig("Gemini 3 Flash");
    expect(model).toBeDefined();
    expect(model?.name).toBe("gemini-3-flash");
  });

  it("should return undefined for non-existent model", () => {
    const model = getModelConfig("non-existent-model");
    expect(model).toBeUndefined();
  });
});

describe("Model Validation", () => {
  it("should allow valid model names", () => {
    expect(isModelAllowed("claude-sonnet-4.6")).toBe(true);
    expect(isModelAllowed("gemini-3.1-pro")).toBe(true);
    expect(isModelAllowed("gpt-5.2")).toBe(true);
  });

  it("should block banned model patterns", () => {
    expect(isModelAllowed("Model")).toBe(false);
    expect(isModelAllowed("model")).toBe(false);
    expect(isModelAllowed("MODEL")).toBe(false);
    expect(isModelAllowed("Sonar")).toBe(false);
    expect(isModelAllowed("sonar")).toBe(false);
    expect(isModelAllowed("Модель")).toBe(false);
    expect(isModelAllowed("модель")).toBe(false);
  });

  it("should block generic model names", () => {
    // Test all banned patterns
    const bannedNames = ["model", "sonar", "модель", "modelo"];

    for (const name of bannedNames) {
      expect(isModelAllowed(name)).toBe(false);
      expect(isModelAllowed(name.toUpperCase())).toBe(false);
      expect(isModelAllowed(name.charAt(0).toUpperCase() + name.slice(1))).toBe(false);
    }
  });

  it("should allow model names with similar substrings", () => {
    // "sonar" is banned, but "claude-sonnet" is allowed
    expect(isModelAllowed("claude-sonnet-4.6")).toBe(true);
    expect(isModelAllowed("sonnet")).toBe(true);
  });
});

describe("Validated Model Selection", () => {
  it("should return default model when undefined is passed", () => {
    const validated = getValidatedModel(undefined);
    expect(validated).toBe("claude-sonnet-4.6");
  });

  it("should return default model when empty string is passed", () => {
    const validated = getValidatedModel("");
    expect(validated).toBe("claude-sonnet-4.6");
  });

  it("should return valid model name when valid model is passed", () => {
    const validated = getValidatedModel("gemini-3.1-pro");
    expect(validated).toBe("gemini-3.1-pro");
  });

  it("should return default model when banned model is passed", () => {
    const validated = getValidatedModel("Model");
    expect(validated).toBe("claude-sonnet-4.6");
  });

  it("should return default model when non-existent model is passed", () => {
    const validated = getValidatedModel("non-existent-model");
    expect(validated).toBe("claude-sonnet-4.6");
  });

  it("should handle model names case-insensitively", () => {
    expect(getValidatedModel("GEMINI-3.1-PRO")).toBe("gemini-3.1-pro");
    expect(getValidatedModel("Gpt-5.2")).toBe("gpt-5.2");
    expect(getValidatedModel("CLAUDE-sonnet-4.6")).toBe("claude-sonnet-4.6");
  });
});

describe("Model Configuration Integrity", () => {
  it("should have unique model names", () => {
    const names = AVAILABLE_MODELS.map((m: ModelConfig) => m.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it("should have unique display names", () => {
    const displayNames = AVAILABLE_MODELS.map((m: ModelConfig) => m.displayName);
    const uniqueDisplayNames = new Set(displayNames);
    expect(uniqueDisplayNames.size).toBe(displayNames.length);
  });

  it("should have matching selector text for each model", () => {
    for (const model of AVAILABLE_MODELS) {
      expect(model.selectorText).toBe(model.displayName);
    }
  });

  it("should not have empty model properties", () => {
    for (const model of AVAILABLE_MODELS) {
      expect(model.name).toBeTruthy();
      expect(model.displayName).toBeTruthy();
      expect(model.selectorText).toBeTruthy();
    }
  });
});

describe("Banned Patterns Coverage", () => {
  it("should have comprehensive banned patterns", () => {
    expect(BANNED_MODEL_PATTERNS.length).toBeGreaterThan(0);

    // Verify patterns are valid regex
    for (const pattern of BANNED_MODEL_PATTERNS) {
      expect(() => new RegExp(pattern)).not.toThrow();
    }
  });

  it("should block all case variations of banned words", () => {
    const testCases = [
      { input: "MODEL", shouldBlock: true },
      { input: "Model", shouldBlock: true },
      { input: "model", shouldBlock: true },
      { input: "MoDeL", shouldBlock: true },
      { input: "SONAR", shouldBlock: true },
      { input: "Sonar", shouldBlock: true },
      { input: "sonar", shouldBlock: true },
    ];

    for (const testCase of testCases) {
      expect(isModelAllowed(testCase.input)).toBe(!testCase.shouldBlock);
    }
  });
});