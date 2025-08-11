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
    console.log('🚀 Starting sidebar visual check...\n');

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
    
    // Wait for styles to load
    await page.waitForTimeout(2000);
    
    // Check computed styles
    console.log('Checking sidebar styles...');
    
    // Check the actual sidebar wrapper element
    const sidebarWrapper = await page.locator('.group.peer').first();
    if (await sidebarWrapper.count() > 0) {
      const wrapperStyles = await sidebarWrapper.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          visibility: styles.visibility,
          width: styles.width
        };
      });
      console.log('Sidebar wrapper styles:', wrapperStyles);
    }
    
    // Check the inner sidebar element
    const sidebar = await page.locator('[data-sidebar="sidebar"]').first();
    if (await sidebar.count() > 0) {
      const sidebarStyles = await sidebar.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor,
          display: styles.display,
          width: styles.width
        };
      });
      console.log('Sidebar element styles:', sidebarStyles);
    }
    
    // Check CSS variables
    const cssVars = await page.evaluate(() => {
      const root = document.documentElement;
      const computedStyle = window.getComputedStyle(root);
      return {
        sidebarBg: computedStyle.getPropertyValue('--sidebar-background'),
        sidebarFg: computedStyle.getPropertyValue('--sidebar-foreground'),
        sidebarBorder: computedStyle.getPropertyValue('--sidebar-border'),
        sidebarAccent: computedStyle.getPropertyValue('--sidebar-accent')
      };
    });
    console.log('CSS Variables:', cssVars);
    
    // Check if Tailwind styles are loaded
    const tailwindLoaded = await page.evaluate(() => {
      const testDiv = document.createElement('div');
      testDiv.className = 'bg-primary';
      document.body.appendChild(testDiv);
      const styles = window.getComputedStyle(testDiv);
      document.body.removeChild(testDiv);
      return styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
    });
    console.log('Tailwind CSS loaded:', tailwindLoaded ? '✅' : '❌');
    
    // Take screenshot
    await page.screenshot({ path: 'sidebar-visual-check.png', fullPage: false });
    console.log('\n📸 Screenshot saved as sidebar-visual-check.png');
    
    // Check menu button styles
    const menuButton = await page.locator('[data-sidebar="menu-button"]').first();
    if (await menuButton.count() > 0) {
      const buttonStyles = await menuButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          padding: styles.padding
        };
      });
      console.log('\nMenu button styles:', buttonStyles);
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
    await page.screenshot({ path: 'sidebar-error-check.png' });
  } finally {
    console.log('\nKeeping browser open for 5 seconds to inspect...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();