const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('🔍 DEBUGGING SIDEBAR STRUCTURE\n');

    // Login as admin
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@agencyos.dev');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/admin', { timeout: 10000 });
    await page.waitForTimeout(2000);
    console.log('✅ Logged in as admin\n');

    // Debug all links in the page
    console.log('📋 ALL LINKS IN SIDEBAR:');
    
    // Try different selectors
    const selectors = [
      'nav a',
      'aside a',
      '[role="navigation"] a',
      'a[href^="/"]'
    ];
    
    for (const selector of selectors) {
      const links = await page.locator(selector).all();
      if (links.length > 0) {
        console.log(`\nUsing selector: "${selector}" - Found ${links.length} links:`);
        for (const link of links) {
          try {
            const href = await link.getAttribute('href');
            const text = await link.textContent();
            const isVisible = await link.isVisible();
            if (href && !href.includes('logout')) {
              console.log(`  • [${isVisible ? 'VISIBLE' : 'HIDDEN'}] ${text?.trim()} => ${href}`);
            }
          } catch (e) {
            // Skip if can't get info
          }
        }
      }
    }
    
    // Check for Settings specifically
    console.log('\n🔍 SEARCHING FOR SETTINGS:');
    const settingsSelectors = [
      'a[href="/settings"]',
      'a[href="/admin/settings"]',
      'a:has-text("Settings")',
      'button:has-text("Settings")',
      '*:has-text("Settings")'
    ];
    
    for (const selector of settingsSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`  ✓ Found ${count} matches for: ${selector}`);
        const element = page.locator(selector).first();
        const href = await element.getAttribute('href').catch(() => 'N/A');
        const tagName = await element.evaluate(el => el.tagName).catch(() => 'N/A');
        console.log(`    Tag: ${tagName}, Href: ${href}`);
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'debug-sidebar-structure.png', fullPage: false });
    console.log('\n📸 Screenshot saved as debug-sidebar-structure.png');
    
    // Check HTML structure
    console.log('\n📄 SIDEBAR HTML STRUCTURE:');
    const sidebarHtml = await page.locator('nav, aside, [role="navigation"]').first().innerHTML().catch(() => 'Not found');
    console.log(sidebarHtml.substring(0, 500) + '...');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();