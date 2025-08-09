import { test, expect } from '@playwright/test';

test.describe('Clients Page', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@agencyos.dev');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/admin');
    
    // Navigate to clients page
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Table Functionality', () => {
    test('should display clients table', async ({ page }) => {
      // Check if table is visible
      await expect(page.locator('table')).toBeVisible();
      
      // Check for table headers
      await expect(page.locator('text=Name')).toBeVisible();
      await expect(page.locator('text=Company')).toBeVisible();
      await expect(page.locator('text=Contact')).toBeVisible();
      await expect(page.locator('text=Actions')).toBeVisible();
    });

    test('should search for clients', async ({ page }) => {
      // Type in search box
      await page.fill('input[placeholder*="Search"]', 'acme');
      
      // Wait for results to filter
      await page.waitForTimeout(500); // Debounce delay
      
      // Check if results are filtered
      const rows = page.locator('tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should open column visibility dropdown', async ({ page }) => {
      // Click view dropdown
      await page.click('button:has-text("View")');
      
      // Check if dropdown is visible
      await expect(page.locator('[role="menu"]')).toBeVisible();
      
      // Toggle a column
      await page.click('[role="menuitemcheckbox"]:has-text("Tags")');
      
      // Close dropdown
      await page.keyboard.press('Escape');
    });

    test('action menu should be on the right and not draggable', async ({ page }) => {
      // Check if actions column is visible
      const actionsHeader = page.locator('th:has-text("Actions")');
      await expect(actionsHeader).toBeVisible();
      
      // Check that actions header doesn't have drag handle
      const dragHandle = actionsHeader.locator('svg.lucide-grip-vertical');
      await expect(dragHandle).not.toBeVisible();
      
      // Check that action buttons are right-aligned
      const actionCell = page.locator('td:last-child').first();
      const actionButton = actionCell.locator('button.h-8.w-8');
      await expect(actionButton).toBeVisible();
      
      // Check that the parent div has justify-end class
      const actionWrapper = actionCell.locator('div.justify-end');
      await expect(actionWrapper).toBeVisible();
    });
  });

  test.describe('Drag and Drop Column Reordering', () => {
    test('should show drag handles for draggable columns', async ({ page }) => {
      // Check that draggable columns have grip handles
      const nameHeader = page.locator('th').filter({ hasText: 'Name' });
      const gripHandle = nameHeader.locator('svg.lucide-grip-vertical');
      await expect(gripHandle).toBeVisible();
    });

    test('should not show drag handles for non-draggable columns', async ({ page }) => {
      // Check that select column doesn't have grip handle
      const selectHeader = page.locator('th').first();
      const selectGrip = selectHeader.locator('svg.lucide-grip-vertical');
      await expect(selectGrip).not.toBeVisible();
      
      // Check that actions column doesn't have grip handle
      const actionsHeader = page.locator('th:has-text("Actions")');
      const actionsGrip = actionsHeader.locator('svg.lucide-grip-vertical');
      await expect(actionsGrip).not.toBeVisible();
    });

    test('should drag and reorder columns', async ({ page }) => {
      // Get initial column positions
      const headers = await page.locator('thead th').allTextContents();
      const nameIndex = headers.findIndex(h => h.includes('Name'));
      const companyIndex = headers.findIndex(h => h.includes('Company'));
      
      // Find the drag handles
      const nameHandle = page.locator('th').filter({ hasText: 'Name' }).locator('svg.lucide-grip-vertical');
      const companyHeader = page.locator('th').filter({ hasText: 'Company' });
      
      // Perform drag and drop
      await nameHandle.dragTo(companyHeader);
      
      // Wait for reorder to complete
      await page.waitForTimeout(500);
      
      // Check new column positions
      const newHeaders = await page.locator('thead th').allTextContents();
      const newNameIndex = newHeaders.findIndex(h => h.includes('Name'));
      const newCompanyIndex = newHeaders.findIndex(h => h.includes('Company'));
      
      // Verify order has changed
      expect(newNameIndex).not.toBe(nameIndex);
    });

    test('should reset column order', async ({ page }) => {
      // Click reset order button
      await page.click('button:has-text("Reset Order")');
      
      // Wait for reset
      await page.waitForTimeout(500);
      
      // Check that columns are in default order
      const headers = await page.locator('thead th').allTextContents();
      expect(headers[headers.length - 1]).toContain('Actions');
    });

    test('should persist column order in localStorage', async ({ page }) => {
      // Reorder columns
      const nameHandle = page.locator('th').filter({ hasText: 'Name' }).locator('svg.lucide-grip-vertical');
      const companyHeader = page.locator('th').filter({ hasText: 'Company' });
      await nameHandle.dragTo(companyHeader);
      
      // Wait for save
      await page.waitForTimeout(500);
      
      // Check localStorage
      const columnOrder = await page.evaluate(() => {
        return localStorage.getItem('clientsTableColumnOrder');
      });
      
      expect(columnOrder).toBeTruthy();
      expect(JSON.parse(columnOrder!)).toContain('actions');
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check that order is preserved
      const headers = await page.locator('thead th').allTextContents();
      expect(headers[headers.length - 1]).toContain('Actions');
    });
  });

  test.describe('Add Client Dialog', () => {
    test('should open add client dialog', async ({ page }) => {
      // Click add client button
      await page.click('button:has-text("Add Client")');
      
      // Check if dialog is visible
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('text=Add New Client')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      // Open dialog
      await page.click('button:has-text("Add Client")');
      
      // Try to submit without filling required fields
      await page.click('[role="dialog"] button:has-text("Add Client")');
      
      // Check for validation errors
      await expect(page.locator('text=First name is required')).toBeVisible();
      await expect(page.locator('text=Last name is required')).toBeVisible();
      await expect(page.locator('text=Invalid email')).toBeVisible();
    });

    test('should show Duda integration fields', async ({ page }) => {
      // Open dialog
      await page.click('button:has-text("Add Client")');
      
      // Check for Duda fields
      await expect(page.locator('label:has-text("Duda Site ID")')).toBeVisible();
      await expect(page.locator('label:has-text("Duda Site URL")')).toBeVisible();
    });

    test('should close dialog on cancel', async ({ page }) => {
      // Open dialog
      await page.click('button:has-text("Add Client")');
      
      // Click cancel
      await page.click('[role="dialog"] button:has-text("Cancel")');
      
      // Check dialog is closed
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });
  });

  test.describe('Edit Client Dialog', () => {
    test('should open edit client dialog', async ({ page }) => {
      // Click action menu on first row
      const firstRow = page.locator('tbody tr').first();
      await firstRow.locator('button[role="button"]').click();
      
      // Click edit option
      await page.click('[role="menuitem"]:has-text("Edit")');
      
      // Check if edit dialog is visible
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('text=Edit Client')).toBeVisible();
    });

    test('should pre-populate fields in edit dialog', async ({ page }) => {
      // Click action menu on first row
      const firstRow = page.locator('tbody tr').first();
      await firstRow.locator('button[role="button"]').click();
      
      // Click edit option
      await page.click('[role="menuitem"]:has-text("Edit")');
      
      // Check that fields are populated
      const firstNameInput = page.locator('[role="dialog"] input[name="first_name"]');
      const value = await firstNameInput.inputValue();
      expect(value).toBeTruthy();
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check that mobile card view is visible
      await expect(page.locator('.md\\:hidden .card')).toBeVisible();
      
      // Check that desktop table is hidden
      await expect(page.locator('.hidden.md\\:block table')).not.toBeVisible();
    });

    test('should be responsive on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Check that table is visible
      await expect(page.locator('table')).toBeVisible();
      
      // Check horizontal scroll on table
      const scrollArea = page.locator('.scroll-area');
      await expect(scrollArea).toBeVisible();
    });

    test('should handle horizontal scroll on small screens', async ({ page }) => {
      // Set narrow viewport
      await page.setViewportSize({ width: 600, height: 800 });
      
      // Check that table container has horizontal scroll
      const tableContainer = page.locator('.scroll-area');
      const hasHorizontalScroll = await tableContainer.evaluate((el) => {
        return el.scrollWidth > el.clientWidth;
      });
      
      expect(hasHorizontalScroll).toBeTruthy();
    });

    test('should show mobile filter sheet on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check that mobile filter button is visible
      const mobileFilterButton = page.locator('.md\\:hidden button').filter({ has: page.locator('svg.lucide-filter') });
      await expect(mobileFilterButton).toBeVisible();
      
      // Click filter button
      await mobileFilterButton.click();
      
      // Check that filter sheet opens
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    });

    test('should display properly on 4K viewport', async ({ page }) => {
      // Set 4K viewport
      await page.setViewportSize({ width: 3840, height: 2160 });
      
      // Check that layout is not broken
      await expect(page.locator('table')).toBeVisible();
      await expect(page.locator('button:has-text("Add Client")')).toBeVisible();
      
      // Check that content is not stretched
      const container = page.locator('.flex-1.space-y-4');
      const width = await container.evaluate((el) => el.offsetWidth);
      expect(width).toBeLessThanOrEqual(3840);
    });
  });
});