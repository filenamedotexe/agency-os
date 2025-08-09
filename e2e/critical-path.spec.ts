import { test, expect } from '@playwright/test';

/**
 * CRITICAL PATH TESTS ONLY
 * These test the absolute core functionality that must work
 * Everything else can be caught by Sentry in production
 */

test.describe('Critical User Journeys', () => {
  
  test('Admin can login and see dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@agencyos.dev');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    
    // Should redirect to admin dashboard
    await page.waitForURL('**/admin', { timeout: 10000 });
    await expect(page.locator('h2:has-text("Admin Dashboard")')).toBeVisible();
  });

  test('Admin can view clients page', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@agencyos.dev');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/admin');
    
    // Navigate to clients
    await page.goto('/clients');
    
    // Table should be visible (desktop) or cards (mobile)
    const isDesktop = await page.viewportSize()?.width! >= 768;
    if (isDesktop) {
      await expect(page.locator('table')).toBeVisible();
    } else {
      await expect(page.locator('.card').first()).toBeVisible();
    }
  });

  test('Client can login and see their dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'client@agencyos.dev');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    
    // Should redirect to client dashboard
    await page.waitForURL('**/client', { timeout: 10000 });
    await expect(page.locator('h2:has-text("My Dashboard")')).toBeVisible();
  });

  test('Add Client button opens dialog', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@agencyos.dev');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/admin');
    
    // Go to clients page
    await page.goto('/clients');
    
    // Click add client
    await page.click('button:has-text("Add Client")');
    
    // Dialog should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Add New Client')).toBeVisible();
  });

  test('Mobile responsiveness works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/login');
    
    // Login form should be visible and usable
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });
});