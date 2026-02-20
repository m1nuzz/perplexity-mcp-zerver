/**
 * Model Selection Automation - Final Version
 * Works without screenshots, with proper element search
 */

import type { Page } from "puppeteer";
import { logInfo, logWarn } from "./logging.js";
import { getValidatedModel, getModelConfig } from "./model-config.js";
import { isReasoningToggleAvailable, enableReasoningMode } from "./model-reasoning-toggle.js";

/**
 * Check if model selection UI is available
 */
export async function isModelSelectionAvailable(page: Page): Promise<boolean> {
  try {
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent?.trim(), button);
      if (text && /(Claude|Gemini|Sonar|GPT|Grok|More)/.test(text)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Set model in Perplexity UI - searches all elements, not just buttons
 */
export async function setModelFinal(page: Page, modelDisplayName: string): Promise<boolean> {
  try {
    logInfo(`🎯 Setting model to: ${modelDisplayName}`);
    
    // Check current model text
    const currentText = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      for (const btn of buttons) {
        const text = btn.textContent?.trim();
        if (text && /(Claude|Gemini|Sonar|GPT|Grok|More)/.test(text)) {
          return text;
        }
      }
      return null;
    });
    
    logInfo(`🔍 Current selection: ${currentText || 'unknown'}`);
    
    // If already selected, skip
    if (currentText?.includes(modelDisplayName)) {
      logInfo(`✓ Model already selected`);
      return true;
    }
    
    // If we see "More", click it to expand
    if (currentText === 'More') {
      logInfo('🔘 Clicking "More" to expand model list...');
      await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const moreBtn = buttons.find(btn => btn.textContent?.trim() === 'More');
    if (moreBtn) (moreBtn as HTMLElement).click();
  });
      await page.evaluate(() => new Promise(r => setTimeout(r, 1500)));
      
      // Now search for model in ALL elements
      const found = await page.evaluate(async (name) => {
        console.log(`Searching for model: ${name}`);
        
        // Find any element containing the model name
        const elements = Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent?.includes(name) && 
          el.tagName !== 'SCRIPT' && 
          el.tagName !== 'STYLE'
        );
        
        console.log(`Found ${elements.length} elements with model name`);
        
        for (const el of elements) {
          const text = el.textContent?.trim();
          if (text?.includes(name)) {
            console.log(`Found: ${text.substring(0,50)}`);
            
            // Try different click strategies
            const menuItem = el.closest('[role="menuitem"]') || el;
            (menuItem as HTMLElement).click();
            return true;
          }
        }
        return false;
      }, modelDisplayName);
      
      if (found) {
        logInfo(`✅ Model selected: ${modelDisplayName}`);
        await page.evaluate(() => new Promise(r => setTimeout(r, 1000)));
        
        // Try to enable reasoning mode if applicable
        if (modelDisplayName.includes('Claude') || modelDisplayName.includes('Рассуждение')) {
          logInfo('🔍 Checking for reasoning toggle...');
          if (await isReasoningToggleAvailable(page)) {
            logInfo('🔍 Found reasoning toggle, enabling...');
            await enableReasoningMode(page);
          }
        }
        
        return true;
      }
    }
    
    logWarn(`❌ Could not select model: ${modelDisplayName}`);
    return false;
  } catch (error) {
    logWarn(`❌ Model selection failed:`, { error });
    return false;
  }
}

/**
 * Main model selection function
 */
export async function selectModelFinal(page: Page, model: string): Promise<string> {
  const validatedModel = getValidatedModel(model);
  const modelConfig = getModelConfig(validatedModel);
  
  if (!await isModelSelectionAvailable(page)) {
    logWarn('Model selection UI not available');
    return validatedModel;
  }
  
  await setModelFinal(page, modelConfig?.selectorText || validatedModel);
  
  return validatedModel;
}
