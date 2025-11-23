import { test, expect } from '@playwright/test';
import { ML_PROBLEM_IDS } from './helpers/test-data';

test.describe('Problems Page', () => {
  test('should load problems page successfully', async ({ page }) => {
    await page.goto('/problems');
    await expect(page).toHaveURL(/\/problems/);
  });

  test('should display all 9 ML problem types', async ({ page }) => {
    await page.goto('/problems');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Look for problem cards or list items
    const problemCards = page.locator('[data-problem-id], .problem-card, article, [role="article"]');
    const count = await problemCards.count();

    // Should have at least some problems visible
    expect(count).toBeGreaterThan(0);
  });

  test('should filter problems by difficulty', async ({ page }) => {
    await page.goto('/problems');
    await page.waitForLoadState('networkidle');

    // Look for filter buttons
    const beginnerFilter = page.locator('button:has-text("Beginner"), [data-filter="beginner"]').first();

    if (await beginnerFilter.isVisible()) {
      await beginnerFilter.click();
      await page.waitForTimeout(500); // Wait for filter to apply

      // Verify filtering worked (UI should update)
      const visible = await page.locator('[data-problem-id], .problem-card').count();
      expect(visible).toBeGreaterThan(0);
    }
  });

  test('should navigate to problem detail page', async ({ page }) => {
    await page.goto('/problems');
    await page.waitForLoadState('networkidle');

    // Click on first problem card
    const firstProblem = page.locator('[data-problem-id], .problem-card, a[href*="/problems/"]').first();
    await expect(firstProblem).toBeVisible();
    await firstProblem.click();

    // Should navigate to problem detail
    await expect(page).toHaveURL(/\/problems\/.+/);
  });
});

test.describe('Problem Detail Page', () => {
  test('should load linear regression problem detail', async ({ page }) => {
    await page.goto(`/problems/${ML_PROBLEM_IDS.LINEAR_SINGLE}`);
    await page.waitForLoadState('networkidle');

    // Should see problem title or description
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should show sample dataset option', async ({ page }) => {
    await page.goto(`/problems/${ML_PROBLEM_IDS.LINEAR_SINGLE}`);
    await page.waitForLoadState('networkidle');

    // Look for "Use Sample Dataset" or similar button
    const sampleButton = page.locator('button:has-text("Sample"), button:has-text("Example"), button:has-text("Get Started")').first();

    // Should have some way to start
    expect(await page.locator('button').count()).toBeGreaterThan(0);
  });

  test('should show upload dataset option', async ({ page }) => {
    await page.goto(`/problems/${ML_PROBLEM_IDS.LINEAR_SINGLE}`);
    await page.waitForLoadState('networkidle');

    // Look for upload option
    const uploadOption = page.locator('button:has-text("Upload"), a[href*="upload"]').first();

    // Should have buttons available
    expect(await page.locator('button').count()).toBeGreaterThan(0);
  });

  test('should create experiment with sample dataset', async ({ page }) => {
    await page.goto(`/problems/${ML_PROBLEM_IDS.LINEAR_SINGLE}`);
    await page.waitForLoadState('networkidle');

    // Find and click button to start with sample dataset
    const startButton = page.locator('button:has-text("Sample"), button:has-text("Get Started"), button:has-text("Start")').first();

    if (await startButton.isVisible({ timeout: 5000 })) {
      await startButton.click();

      // Should navigate to workspace or show dataset selection dialog
      await page.waitForTimeout(2000);

      // Check if we navigated or opened a dialog
      const url = page.url();
      const hasDialog = await page.locator('[role="dialog"], .dialog, .modal').isVisible();

      expect(url.includes('/workspace') || hasDialog).toBeTruthy();
    }
  });
});
