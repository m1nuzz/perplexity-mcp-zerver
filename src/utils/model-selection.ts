/**
 * Model Selection Automation for Perplexity AI
 * Handles UI interactions for selecting AI models in Perplexity
 */

import type { Page } from "puppeteer";
import { logInfo, logError, logWarn } from "./logging.js";
import type { ModelConfig } from "./model-config.js";
import { AVAILABLE_MODELS, getModelConfig } from "./model-config.js";

// Model selection UI selectors (stable selectors)
const MODEL_BUTTON_SELECTOR = 'button[aria-haspopup="menu"][data-state="closed"]'; // Main model button
const MODEL_DROPDOWN_SELECTOR = '[role="menu"][data-placement]'; // Model dropdown menu
const MODEL_OPTION_SELECTOR = '[role="menuitem"]'; // Individual model options

// Timeout for model selection operations
const MODEL_SELECTION_TIMEOUT = 10000;

/**
 * Check if model selection UI is available on the page
 * @param page - Puppeteer page instance
 * @returns true if model selection is available, false otherwise
 */
export async function isModelSelectionAvailable(page: Page): Promise<boolean> {
  try {
    const button = await page.$(MODEL_BUTTON_SELECTOR);
    return button !== null;
  } catch (error) {
    logWarn("Error checking model selection availability:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Get the currently selected model from the UI
 * @param page - Puppeteer page instance
 * @returns The display name of the currently selected model, or null if not found
 */
export async function getCurrentlySelectedModel(page: Page): Promise<string | null> {
  try {
    // Try to get the model from the button text
    const modelName = await page.evaluate((selector) => {
      const button = document.querySelector(selector);
      if (!button) return null;

      // Try multiple ways to get the model name
      const textContent = button.textContent?.trim();
      const ariaLabel = button.getAttribute("aria-label");

      return textContent || ariaLabel || null;
    }, MODEL_BUTTON_SELECTOR);

    return modelName;
  } catch (error) {
    logWarn("Error getting currently selected model:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Open the model selection dropdown
 * @param page - Puppeteer page instance
 * @returns true if dropdown was opened successfully, false otherwise
 */
export async function openModelDropdown(page: Page): Promise<boolean> {
  try {
    logInfo("Opening model selection dropdown...");

    // Wait for and click the model button
    await page.waitForSelector(MODEL_BUTTON_SELECTOR, { timeout: MODEL_SELECTION_TIMEOUT });

    // Click the button to open dropdown
    await page.click(MODEL_BUTTON_SELECTOR);

    // Wait for dropdown to appear
    await page.waitForSelector(MODEL_DROPDOWN_SELECTOR, { timeout: 2000 });

    logInfo("Model dropdown opened successfully");
    return true;
  } catch (error) {
    logError("Failed to open model dropdown:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Close the model selection dropdown
 * @param page - Puppeteer page instance
 * @returns true if dropdown was closed successfully, false otherwise
 */
export async function closeModelDropdown(page: Page): Promise<boolean> {
  try {
    // Click outside the dropdown or press Escape
    await page.keyboard.press("Escape");

    // Wait for dropdown to disappear
    await page.waitForSelector(MODEL_DROPDOWN_SELECTOR, { hidden: true, timeout: 2000 }).catch(() => {
      // If it doesn't disappear, it's not critical
    });

    return true;
  } catch (error) {
    logWarn("Error closing model dropdown:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Select a specific model from the dropdown
 * @param page - Puppeteer page instance
 * @param modelConfig - The model configuration to select
 * @returns true if model was selected successfully, false otherwise
 */
export async function selectModelFromDropdown(page: Page, modelConfig: ModelConfig): Promise<boolean> {
  try {
    logInfo(`Selecting model: ${modelConfig.displayName}`);

    // Wait for dropdown to be visible
    await page.waitForSelector(MODEL_DROPDOWN_SELECTOR, { timeout: MODEL_SELECTION_TIMEOUT });

    // Find and click the model option
    const modelSelected = await page.evaluate(
      (optionSelector, targetText) => {
        const options = Array.from(document.querySelectorAll(optionSelector));

        // Find the option that contains our target model text
        const targetOption = options.find((option) => {
          const text = option.textContent?.trim() || "";
          return text.includes(targetText);
        });

        if (targetOption) {
          (targetOption as HTMLElement).click();
          return true;
        }

        return false;
      },
      MODEL_OPTION_SELECTOR,
      modelConfig.selectorText,
    );

    if (!modelSelected) {
      logError(`Model "${modelConfig.displayName}" not found in dropdown`);
      return false;
    }

    // Wait a moment for the selection to take effect
    await page.waitForTimeout(500);

    logInfo(`Model "${modelConfig.displayName}" selected successfully`);
    return true;
  } catch (error) {
    logError("Error selecting model from dropdown:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Get all available models from the dropdown
 * @param page - Puppeteer page instance
 * @returns Array of model names found in the dropdown
 */
export async function getAvailableModelsFromDropdown(page: Page): Promise<string[]> {
  try {
    // Ensure dropdown is open
    const isDropdownOpen = await page.$(MODEL_DROPDOWN_SELECTOR) !== null;

    if (!isDropdownOpen) {
      await openModelDropdown(page);
      await page.waitForTimeout(500);
    }

    // Extract model names
    const models = await page.evaluate((optionSelector) => {
      const options = Array.from(document.querySelectorAll(optionSelector));
      return options
        .map((option) => option.textContent?.trim())
        .filter((text): text is string => Boolean(text) && text.length > 0);
    }, MODEL_OPTION_SELECTOR);

    // Close dropdown if we opened it
    if (!isDropdownOpen) {
      await closeModelDropdown(page);
    }

    return models;
  } catch (error) {
    logWarn("Error getting available models from dropdown:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Set the model for Perplexity AI search
 * This is the main entry point for model selection
 * @param page - Puppeteer page instance
 * @param modelName - The name of the model to use
 * @returns true if model was set successfully, false otherwise
 */
export async function setModel(page: Page, modelName: string): Promise<boolean> {
  try {
    logInfo(`Setting model to: ${modelName}`);

    // Get model configuration
    const modelConfig = getModelConfig(modelName);

    if (!modelConfig) {
      logError(`Model configuration not found for: ${modelName}`);
      return false;
    }

    // Check current model
    const currentModel = await getCurrentlySelectedModel(page);

    if (currentModel && currentModel.includes(modelConfig.displayName)) {
      logInfo(`Model "${modelConfig.displayName}" is already selected`);
      return true;
    }

    // Open dropdown
    const dropdownOpened = await openModelDropdown(page);
    if (!dropdownOpened) {
      logError("Failed to open model dropdown");
      return false;
    }

    // Select the model
    const modelSelected = await selectModelFromDropdown(page, modelConfig);

    // Close dropdown
    await closeModelDropdown(page);

    return modelSelected;
  } catch (error) {
    logError("Error setting model:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}