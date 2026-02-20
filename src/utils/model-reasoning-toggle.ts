/**
 * Reasoning Mode Toggle for Perplexity AI
 * Handles the "Рассуждение" (thinking mode) toggle switch
 */

import type { Page } from "puppeteer";
import { logInfo, logWarn } from "./logging.js";

const REASONING_TOGGLE_SELECTOR = 'button[value="on"][role="switch"]'; // The toggle switch
const REASONING_MENU_ITEM_SELECTOR = 'div[role="menuitem"]:has-text("Рассуждение")'; // Reasoning menu item

/**
 * Check if reasoning mode toggle is present in the model dropdown
 */
export async function isReasoningToggleAvailable(page: Page): Promise<boolean> {
  try {
    const toggle = await page.$(REASONING_TOGGLE_SELECTOR);
    return toggle !== null;
  } catch (error) {
    logWarn("Error checking reasoning toggle availability:", { error });
    return false;
  }
}

/**
 * Enable reasoning mode by clicking the toggle
 * This only works when the model dropdown is open
 */
export async function enableReasoningMode(page: Page): Promise<boolean> {
  try {
    logInfo("Enabling reasoning mode (Рассуждение)...");
    
    // Check if toggle exists and is not already enabled
    const isEnabled = await page.evaluate((selector) => {
      const toggle = document.querySelector(selector);
      return toggle?.getAttribute('aria-checked') === 'true';
    }, REASONING_TOGGLE_SELECTOR);
    
    if (isEnabled) {
      logInfo("Reasoning mode is already enabled");
      return true;
    }
    
    // Click the toggle
    await page.click(REASONING_TOGGLE_SELECTOR);
    logInfo("Reasoning mode enabled successfully");
    
    // Wait a moment for the mode to activate
    await page.evaluate(() => new Promise(r => setTimeout(r, 500)));
    
    return true;
  } catch (error) {
    logWarn("Failed to enable reasoning mode:", { error });
    return false;
  }
}

/**
 * Get the full selector path to reasoning menu item
 * This can be used for debugging/monitoring
 */
export function getReasoningSelectorForVerification(): string {
  return REASONING_MENU_ITEM_SELECTOR;
}