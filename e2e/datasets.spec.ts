import { test, expect } from '@playwright/test';

test.describe('Datasets Page', () => {
  test('should load datasets page', async ({ page }) => {
    await page.goto('/datasets');

    // May redirect to auth if not logged in, or show datasets page
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url.includes('/datasets') || url === '/').toBeTruthy();
  });

  test('should have upload button or link', async ({ page }) => {
    await page.goto('/datasets');
    await page.waitForLoadState('networkidle');

    // Look for upload option
    const uploadLink = page.locator('a[href="/datasets/upload"], button:has-text("Upload")');
    const hasUploadOption = await uploadLink.count() > 0;

    // Either has upload option or redirected to auth
    expect(hasUploadOption || page.url() === '/').toBeTruthy();
  });
});

test.describe('Dataset Upload', () => {
  test('should load upload page', async ({ page }) => {
    await page.goto('/datasets/upload');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url.includes('/datasets/upload') || url === '/').toBeTruthy();
  });

  test('should have file input', async ({ page }) => {
    await page.goto('/datasets/upload');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/datasets/upload')) {
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeVisible({ timeout: 5000 });
    }
  });

  test.skip('should upload CSV file and show preview', async ({ page }) => {
    // Requires authentication
    await page.goto('/datasets/upload');

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      // Create test CSV
      const csvContent = 'x,y\n1,2\n2,4\n3,6';
      const buffer = Buffer.from(csvContent);

      await fileInput.setInputFiles({
        name: 'test.csv',
        mimeType: 'text/csv',
        buffer: buffer,
      });

      // Wait for preview to appear
      await page.waitForSelector('table, .preview, [data-testid="preview"]', { timeout: 5000 });

      // Verify preview shows data
      const preview = page.locator('table, .preview');
      await expect(preview).toBeVisible();
    }
  });

  test.skip('should validate file type', async ({ page }) => {
    // Test that non-CSV files are rejected
    await page.goto('/datasets/upload');

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      const buffer = Buffer.from('Not a CSV file');

      await fileInput.setInputFiles({
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: buffer,
      });

      // Should show error
      await page.waitForSelector('text=/error|invalid|csv/i', { timeout: 3000 });
    }
  });
});
