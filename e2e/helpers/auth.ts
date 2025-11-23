import { Page, expect } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/');

  // Look for sign in button
  const signInButton = page.getByRole('button', { name: /sign in/i }).first();
  if (await signInButton.isVisible()) {
    await signInButton.click();
  }

  // Fill in credentials
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);

  // Submit
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // Wait for redirect or success
  await page.waitForURL(/dashboard|problems/, { timeout: 10000 });
}

export async function signup(page: Page, email: string, password: string, name?: string) {
  await page.goto('/');

  // Look for sign up button
  const signUpButton = page.getByRole('button', { name: /sign up|get started/i }).first();
  if (await signUpButton.isVisible()) {
    await signUpButton.click();
  }

  // Fill in registration details
  if (name) {
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill(name);
    }
  }

  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);

  // Submit
  await page.getByRole('button', { name: /sign up|create account|register/i }).click();

  // Wait for success
  await page.waitForURL(/dashboard|problems/, { timeout: 10000 });
}

export async function logout(page: Page) {
  // Look for user menu or logout button
  const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Log out"), button:has-text("Sign out")').first();
  if (await userMenu.isVisible()) {
    await userMenu.click();

    const logoutButton = page.getByRole('button', { name: /log out|sign out/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    }
  }

  // Wait for redirect to home
  await page.waitForURL('/', { timeout: 5000 });
}

export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Check if we can see user-specific elements
    const userIndicator = page.locator('[data-testid="user-menu"], button:has-text("Log out"), a[href="/dashboard"]');
    return await userIndicator.first().isVisible({ timeout: 3000 });
  } catch {
    return false;
  }
}
