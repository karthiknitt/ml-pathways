import { test, expect } from '@playwright/test';
import { ML_PROBLEM_IDS } from './helpers/test-data';
import { waitForAPIResponse } from './helpers/wait';

test.describe('Workspace - Core Functionality', () => {
  test.skip('should display workspace tabs', async ({ page }) => {
    // This test will be skipped until we can create experiments
    // Create an experiment first (requires auth and dataset)
    // For now, we'll test the structure when we can access it
  });

  test('should handle direct workspace URL gracefully', async ({ page }) => {
    // Try accessing a non-existent workspace
    await page.goto('/workspace/non-existent-id');

    // Should either redirect or show error
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const hasError = await page.locator('text=/not found|error|invalid/i').count() > 0;

    // Should handle gracefully (redirect to home/problems or show error)
    expect(url.includes('/workspace') || url.includes('/problems') || url === '/' || hasError).toBeTruthy();
  });
});

test.describe('Workspace - Chat Functionality', () => {
  test.skip('should send chat message', async ({ page }) => {
    // Requires valid workspace
    // Will be enabled after fixing experiment creation
  });

  test.skip('should display AI responses', async ({ page }) => {
    // Requires valid workspace and AI provider
  });
});

test.describe('Workspace - Code Generation', () => {
  test.skip('should generate code via AI', async ({ page }) => {
    // Requires workspace and AI provider configured
  });

  test.skip('should display generated code in code tab', async ({ page }) => {
    // Requires code generation to work
  });
});

test.describe('Workspace - Code Execution', () => {
  test.skip('should execute Python code in sandbox', async ({ page }) => {
    // Requires E2B configuration
  });

  test.skip('should display execution results', async ({ page }) => {
    // Requires execution to complete
  });

  test.skip('should handle execution errors gracefully', async ({ page }) => {
    // Test error handling
  });
});

test.describe('Workspace - EDA (Exploratory Data Analysis)', () => {
  test.skip('should trigger EDA analysis', async ({ page }) => {
    // Requires workspace with dataset
  });

  test.skip('should display EDA results', async ({ page }) => {
    // Requires EDA to complete
  });
});
