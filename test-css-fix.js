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
    console.log('🚀 Testing CSS loading on email page...\n');

    // Navigate and login
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    console.log('Logging in as admin...');
    await page.fill('input[type="email"]', 'admin@agencyos.dev');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/admin', { timeout: 10000 });
    await page.waitForTimeout(2000);
    console.log('✅ Logged in successfully\n');
    
    // Navigate to email management
    console.log('Navigating to email management...');
    await page.goto('http://localhost:3000/admin/emails');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Allow CSS to load
    
    // Check if Tailwind classes are applied
    const hasStyledElements = await page.evaluate(() => {
      // Check if any element has computed styles that indicate Tailwind is working
      const button = document.querySelector('button');
      const styles = button ? window.getComputedStyle(button) : null;
      
      return {
        hasButton: !!button,
        hasBackgroundColor: styles ? styles.backgroundColor !== 'rgba(0, 0, 0, 0)' : false,
        hasPadding: styles ? styles.paddingLeft !== '0px' : false,
        hasBorderRadius: styles ? styles.borderRadius !== '0px' : false
      };
    });
    
    console.log('CSS Styling Check:', hasStyledElements);
    
    // Take screenshot
    await page.screenshot({ path: 'css-check.png', fullPage: false });
    console.log('📸 Screenshot saved as css-check.png');
    
    if (hasStyledElements.hasBackgroundColor || hasStyledElements.hasPadding) {
      console.log('✅ CSS is loading properly!');
    } else {
      console.log('❌ CSS may not be loading - elements look unstyled');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'css-error.png' });
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();