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
    console.log('🚀 Testing FIXED UI after PostCSS/Tailwind fix...\n');

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
    
    // Take screenshot
    await page.screenshot({ path: 'ui-fixed.png', fullPage: false });
    console.log('📸 Screenshot saved as ui-fixed.png');
    
    console.log('\n✅ UI should now be properly styled with Tailwind!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'ui-fixed-error.png' });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();