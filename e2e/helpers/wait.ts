import { Page, expect } from '@playwright/test';

export async function waitForAPIResponse(page: Page, urlPattern: string | RegExp, timeout: number = 10000) {
  return page.waitForResponse(
    response => {
      const url = response.url();
      const matches = typeof urlPattern === 'string'
        ? url.includes(urlPattern)
        : urlPattern.test(url);
      return matches && response.status() < 400;
    },
    { timeout }
  );
}

export async function waitForElement(page: Page, selector: string, timeout: number = 10000) {
  await page.waitForSelector(selector, { timeout, state: 'visible' });
}

export async function waitForText(page: Page, text: string, timeout: number = 10000) {
  await page.waitForSelector(`text=${text}`, { timeout, state: 'visible' });
}

export async function waitForCodeExecution(page: Page, timeout: number = 30000) {
  // Wait for execution to complete (either success or error)
  try {
    await page.waitForSelector('[data-testid="execution-results"], .execution-output, text=Execution completed', { timeout });
  } catch {
    // Also check for error states
    await page.waitForSelector('[data-testid="execution-error"], .execution-error, text=Error', { timeout: 5000 });
  }
}
