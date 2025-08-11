const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('🚀 Testing refactored UI with new design system...\n');

    // Navigate and login
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    console.log('Logging in as admin...');
    await page.fill('input[type="email"]', 'admin@agencyos.dev');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/admin', { timeout: 10000 });
    console.log('✅ Logged in successfully\n');
    
    // Wait for page to fully load
    await page.waitForTimeout(2000);
    
    // Take screenshots at different viewports
    console.log('📸 Taking screenshots at different viewports...\n');
    
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'ui-desktop.png', fullPage: true });
    console.log('Desktop screenshot saved');
    
    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'ui-tablet.png', fullPage: true });
    console.log('Tablet screenshot saved');
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'ui-mobile.png', fullPage: true });
    console.log('Mobile screenshot saved');
    
    console.log('\n✅ UI testing complete!');
    console.log('Check the screenshots to see the refactored design.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'ui-error.png' });
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();