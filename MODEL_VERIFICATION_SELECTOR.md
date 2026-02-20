# Perplexity Model Selection - Debug Selector
# This CSS selector helps verify if the correct model is selected in Perplexity UI

**CSS Selector for model verification:**
```javascript
// Selector that points to the element showing model info in Perplexity chat
document.querySelector("body > main:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > div:nth-child(2)")

// Simpler alternative - look for model attribution text:
document.querySelector('[class*="attribution"], [class*="model"], [class*="info"]').textContent

// Even simpler - look for text containing "Claude" or "Sonnet":
Array.from(document.querySelectorAll('*')).find(el => 
  el.textContent?.includes('Claude') || el.textContent?.includes('Sonnet')
)
```

**Expected text when Sonnet Reasoning is used:**
```
"Подготовлено с использованием Claude Sonnet 4.6 Рассуждение"
```

**Usage in code:**
```typescript
// Check if model is set correctly
const isSonnetReasoning = await page.evaluate(() => {
  const element = document.querySelector('body > main:nth-child(1) > div:nth-child(1) > ... > div:nth-child(2)');
  return element?.textContent?.includes('Claude Sonnet 4.6') && 
         element?.textContent?.includes('Рассуждение');
});
```

**Date:** 2026-02-20