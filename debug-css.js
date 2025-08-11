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

  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  try {
    console.log('🔍 DEBUGGING CSS LOADING ISSUES...\n');

    // Step 1: Check login page first
    console.log('1. Testing login page CSS...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Check if CSS is loaded on login
    const loginCSS = await page.evaluate(() => {
      const button = document.querySelector('button[type="submit"]');
      const styles = button ? window.getComputedStyle(button) : null;
      return {
        hasButton: !!button,
        backgroundColor: styles?.backgroundColor || 'none',
        padding: styles?.padding || 'none',
        borderRadius: styles?.borderRadius || 'none',
        fontSize: styles?.fontSize || 'none'
      };
    });
    console.log('Login page styles:', loginCSS);

    // Step 2: Login and check admin dashboard
    console.log('\n2. Logging in...');
    await page.fill('input[type="email"]', 'admin@agencyos.dev');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/admin', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Check admin dashboard CSS
    const dashboardCSS = await page.evaluate(() => {
      const sidebar = document.querySelector('[data-sidebar]');
      const button = document.querySelector('button');
      const card = document.querySelector('[class*="card"]');
      
      return {
        hasSidebar: !!sidebar,
        hasButton: !!button,
        hasCard: !!card,
        sidebarClasses: sidebar?.className || 'none',
        buttonClasses: button?.className || 'none',
        cardClasses: card?.className || 'none'
      };
    });
    console.log('Dashboard styles:', dashboardCSS);

    // Step 3: Navigate to email management
    console.log('\n3. Testing email management page...');
    await page.goto('http://localhost:3000/admin/emails');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check email page CSS
    const emailPageCSS = await page.evaluate(() => {
      const tabs = document.querySelector('[role="tablist"]');
      const button = document.querySelector('button');
      const table = document.querySelector('table');
      const input = document.querySelector('input');
      
      const tabsStyles = tabs ? window.getComputedStyle(tabs) : null;
      const buttonStyles = button ? window.getComputedStyle(button) : null;
      
      return {
        hasTabs: !!tabs,
        hasButton: !!button,
        hasTable: !!table,
        hasInput: !!input,
        tabsClasses: tabs?.className || 'none',
        buttonClasses: button?.className || 'none',
        tabsBackgroundColor: tabsStyles?.backgroundColor || 'none',
        buttonBackgroundColor: buttonStyles?.backgroundColor || 'none',
        buttonPadding: buttonStyles?.padding || 'none'
      };
    });
    console.log('Email page styles:', emailPageCSS);

    // Step 4: Check CSS files are loading
    const cssRequests = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      const styles = Array.from(document.querySelectorAll('style'));
      
      return {
        cssLinks: links.map(link => ({ href: link.href, loaded: !link.sheet ? 'failed' : 'loaded' })),
        inlineStyles: styles.length,
        totalStylesheets: document.styleSheets.length
      };
    });
    console.log('CSS Resources:', cssRequests);

    // Step 5: Check if Tailwind classes exist
    const tailwindCheck = await page.evaluate(() => {
      const testElement = document.createElement('div');
      testElement.className = 'bg-blue-500 p-4 rounded-lg';
      document.body.appendChild(testElement);
      
      const styles = window.getComputedStyle(testElement);
      const result = {
        backgroundColor: styles.backgroundColor,
        padding: styles.padding,
        borderRadius: styles.borderRadius
      };
      
      document.body.removeChild(testElement);
      return result;
    });
    console.log('Tailwind test classes:', tailwindCheck);

    // Take screenshots
    await page.screenshot({ path: 'debug-email-page.png', fullPage: false });
    console.log('\n📸 Screenshot saved as debug-email-page.png');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    await page.screenshot({ path: 'debug-error.png' });
  } finally {
    await page.waitForTimeout(10000); // Keep browser open to inspect
    await browser.close();
  }
})();