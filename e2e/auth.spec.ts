import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should login with admin credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in login form
    await page.fill('input[type="email"]', 'admin@agencyos.dev');
    await page.fill('input[type="password"]', 'password123');
    
    // Click login button
    await page.click('button:has-text("Sign In")');
    
    // Should redirect to admin dashboard
    await page.waitForURL('**/admin');
    await expect(page).toHaveURL(/.*admin/);
  });

  test('should login with client credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in login form
    await page.fill('input[type="email"]', 'client@agencyos.dev');
    await page.fill('input[type="password"]', 'password123');
    
    // Click login button
    await page.click('button:has-text("Sign In")');
    
    // Should redirect to client dashboard
    await page.waitForURL('**/client');
    await expect(page).toHaveURL(/.*client/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in login form with invalid credentials
    await page.fill('input[type="email"]', 'invalid@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Click login button
    await page.click('button:has-text("Sign In")');
    
    // Should show error message
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/login');
    
    // Click signup link
    await page.click('a:has-text("Sign up")');
    await expect(page).toHaveURL(/.*signup/);
    
    // Click signin link
    await page.click('a:has-text("Sign in")');
    await expect(page).toHaveURL(/.*login/);
  });
});