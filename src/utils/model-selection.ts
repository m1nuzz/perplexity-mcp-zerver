/**
 * Model Selection Automation for Perplexity AI - Enhanced Version
 * Based on actual Perplexity UI inspection results
 */

import type { Page } from "puppeteer";
import { logInfo, logError, logWarn } from "./logging.js";
import { getValidatedModel } from "./model-config.js";
import { isReasoningToggleAvailable, enableReasoningMode } from "./model-reasoning-toggle.js";

// Perplexity AI Model Selection Selectors
// Based on actual UI structure from integration tests
const SELECTORS = {
  // Model button is in top-right, has flex layout, contains model name
  // We need to distinguish from "More" button
  button: 'button[class*="flex"][class*="items-center"][class*="gap-2"]',
  
  // Alternative: Find button that has a model name in it
  buttonByContent: (name: string) => `button:has-text("${name}")`,
  
  // Model dropdown (React Radix UI portal)
  dropdown: 'div[data-radix-popper-content-wrapper][data-state="open"]',
  
  // Model options in dropdown
  option: 'div[role="menuitem"]',
  
  // Specific model option by name
  optionByName: (name: string) => `div[role="menuitem"]:has-text("${name}")`
};

const TIMEOUT = 15000;

/**
 * Check if model selection UI is available
 */
export async function isModelSelectionAvailable(page: Page): Promise<boolean> {
  try {
    // Try to find any button that might be the model selector
    const buttons = await page.$$('button');
    
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent?.trim(), button);
      // Look for model names or common patterns
      if (text && /(Claude|Gemini|Sonar|GPT|Grok|More)/.test(text)) {
        logInfo(`Model selection available (found: "${text}")`);
        return true;
      }
    }
    
    logWarn("Model selection UI not found");
    return false;
  } catch (error) {
    logWarn("Error checking availability:", { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

/**
 * Get currently selected model
 */
export async function getCurrentlySelectedModel(page: Page): Promise<string | null> {
  try {
    const modelName = await page.evaluate(() => {
      // Look for model name in top-right area
      const buttons = Array.from(document.querySelectorAll('button'));
      for (const btn of buttons) {
        const text = btn.textContent?.trim();
        // Skip "More" button, look for actual model names
        if (text && /(Claude|Gemini|Sonar|GPT|Grok|Kimi)/.test(text) && text !== 'More') {
          return text;
        }
      }
      return null;
    });
    
    if (modelName) {
      logInfo(`Current model: ${modelName}`);
    }
    return modelName;
  } catch (error) {
    logWarn("Error getting current model:", { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Set model in Perplexity UI
 */
export async function setModel(page: Page, modelDisplayName: string): Promise<boolean> {
  try {
    logInfo(`Setting model to: ${modelDisplayName}`);
    
    // Get current model
    const current = await getCurrentlySelectedModel(page);
    if (current && current.includes(modelDisplayName)) {
      logInfo(`Model "${modelDisplayName}" already selected`);
      return true;
    }
    
    // If we see "More", click it first
    const hasMore = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => btn.textContent?.trim() === 'More');
    });
    
    if (hasMore) {
      logInfo('Found "More" button, clicking to expand model list');
      await page.click('button:has-text("More")');
      await page.evaluate(() => new Promise(r => setTimeout(r, 1000)));
    }
    
    // Now find the model button (should show actual model name)
    const foundModelButton = await page.evaluate((name) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      for (const btn of buttons) {
        const text = btn.textContent?.trim();
        if (text && text.includes(name)) {
          (btn as HTMLElement).click();
          return true;
        }
      }
      return false;
    }, modelDisplayName);
    
    if (foundModelButton) {
      logInfo(`Successfully clicked model "${modelDisplayName}"`);
      await page.evaluate(() => new Promise(r => setTimeout(r, 1000)));
      return true;
    }
    
    logWarn(`Could not find model "${modelDisplayName}" in UI`);
    return false;
  } catch (error) {
    logWarn(`Failed to set model "${modelDisplayName}":`, { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return false;
  }
}

/**
 * Main model selection function with validation
 */
export async function selectModel(page: Page, model: string): Promise<string> {
  const validatedModel = getValidatedModel(model);
  
  if (!await isModelSelectionAvailable(page)) {
    logWarn("Model selection not available, using validated model: " + validatedModel);
    return validatedModel;
  }
  
  const modelSet = await setModel(page, validatedModel);
  if (!modelSet) {
    logWarn(`Could not set model via UI, falling back to: ${validatedModel}`);
  }
  
  return validatedModel;
}
