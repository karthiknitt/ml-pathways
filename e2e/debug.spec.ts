import { test } from '@playwright/test';

test('debug page errors', async ({ page }) => {
  const errors: string[] = [];
  const consoleLogs: string[] = [];

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleLogs.push(`CONSOLE ERROR: ${msg.text()}`);
    }
  });

  // Capture page errors
  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}\n${err.stack}`);
  });

  try {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000); // Wait to see if errors appear
  } catch (error: any) {
    console.log('Navigation error:', error.message);
  }

  // Print all captured errors
  console.log('=== CONSOLE LOGS ===');
  consoleLogs.forEach(log => console.log(log));

  console.log('\n=== PAGE ERRORS ===');
  errors.forEach(err => console.log(err));
});
