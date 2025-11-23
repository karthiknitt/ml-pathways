import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load home page successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ML Pathways|Machine Learning/i);
  });

  test('should display main heading or hero section', async ({ page }) => {
    await page.goto('/');

    // Check for common hero elements
    const hasH1 = await page.locator('h1').count() > 0;
    expect(hasH1).toBeTruthy();
  });

  test('should have navigation to problems page', async ({ page }) => {
    await page.goto('/');

    // Look for link to problems
    const problemsLink = page.locator('a[href="/problems"], a:has-text("Problems"), a:has-text("Get Started"), a:has-text("Browse")').first();
    await expect(problemsLink).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to problems page', async ({ page }) => {
    await page.goto('/');

    // Click on problems/get started link
    const link = page.locator('a[href="/problems"], a:has-text("Get Started"), a:has-text("Browse Problems")').first();
    await link.click();

    // Verify navigation
    await expect(page).toHaveURL(/\/problems/);
  });
});
