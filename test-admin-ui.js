const { chromium } = require('playwright');

(async () => {
  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser console error:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.log('❌ Page error:', error.message);
    });

    console.log('🚀 Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    console.log('📝 Filling login form...');
    await page.fill('input[name="email"]', 'admin@agencyos.dev');
    await page.fill('input[name="password"]', 'password123');
    
    console.log('🔐 Clicking sign in...');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Wait a moment for redirect
    await page.waitForTimeout(2000);

    console.log('📍 Current URL:', page.url());
    
    // If we're on dashboard, navigate to admin
    if (page.url().includes('/dashboard') && !page.url().includes('/admin')) {
      console.log('🔄 Navigating to admin dashboard...');
      await page.goto('http://localhost:3000/admin');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      console.log('📍 New URL:', page.url());
    }

    if (page.url().includes('/admin')) {
      console.log('✅ Successfully redirected to admin dashboard');
      
      // Check for navigation elements
      const nav = await page.locator('nav').first();
      const sidebar = await page.locator('aside').first();
      const mobileNav = await page.locator('[role="navigation"]');
      
      console.log('🔍 Checking UI elements...');
      
      // Check if navigation exists
      const navExists = await nav.count() > 0;
      const sidebarExists = await sidebar.count() > 0;
      
      console.log('Navigation elements:');
      console.log('- Nav element:', navExists ? '✅ Found' : '❌ Missing');
      console.log('- Sidebar element:', sidebarExists ? '✅ Found' : '❌ Missing');
      
      // Check for main content
      const mainContent = await page.locator('main').first();
      const mainExists = await mainContent.count() > 0;
      console.log('- Main content:', mainExists ? '✅ Found' : '❌ Missing');
      
      // Check for dashboard title
      const title = await page.locator('h2:has-text("Admin Dashboard")').first();
      const titleExists = await title.count() > 0;
      console.log('- Dashboard title:', titleExists ? '✅ Found' : '❌ Missing');
      
      // Check for stat cards
      const statCards = await page.locator('[data-testid="stat-card"], .grid .rounded-lg.border').count();
      console.log('- Stat cards found:', statCards);
      
      // Check layout positioning
      console.log('🎨 Checking layout...');
      
      // Set viewport to desktop size to test responsive behavior
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForTimeout(500);
      
      // Take screenshots at different sizes
      await page.screenshot({ path: 'admin-dashboard-desktop.png', fullPage: true });
      console.log('📸 Desktop screenshot saved');
      
      // Check sidebar visibility and positioning
      const sidebarElement = await page.locator('aside').first();
      if (await sidebarElement.count() > 0) {
        const sidebarBox = await sidebarElement.boundingBox();
        const isVisible = await sidebarElement.isVisible();
        const computedStyle = await sidebarElement.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            transform: style.transform,
            zIndex: style.zIndex
          };
        });
        
        console.log('Sidebar visibility:', isVisible);
        console.log('Sidebar computed style:', computedStyle);
        console.log('Sidebar position:', { x: sidebarBox?.x, y: sidebarBox?.y, width: sidebarBox?.width });
        
        if (!isVisible) {
          console.log('❌ SIDEBAR IS NOT VISIBLE - This explains the issue!');
        }
      }
      
      // Check main content positioning  
      const mainElement = await page.locator('main').first();
      if (await mainElement.count() > 0) {
        const mainBox = await mainElement.boundingBox();
        console.log('Main content position:', { x: mainBox?.x, y: mainBox?.y, width: mainBox?.width });
        
        // Check the inner div that should have the margin
        const innerDiv = await page.locator('main > div').first();
        if (await innerDiv.count() > 0) {
          const innerBox = await innerDiv.boundingBox();
          console.log('Inner div position:', { x: innerBox?.x, y: innerBox?.y, width: innerBox?.width });
          
          if (innerBox?.x > 200) {
            console.log('✅ Content properly positioned (sidebar working)');
          } else if (innerBox?.x < 50) {
            console.log('❌ Content overlapping with sidebar');
          } else {
            console.log('⚠️  Content positioning unclear:', innerBox?.x);
          }
        }
      }
      
      // Test mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'admin-dashboard-mobile.png', fullPage: true });
      console.log('📱 Mobile screenshot saved');
      
    } else if (page.url().includes('/login')) {
      console.log('❌ Still on login page - authentication failed');
      
      // Check for error messages
      const errorMessage = await page.locator('.text-destructive, .error, [role="alert"]').first();
      if (await errorMessage.count() > 0) {
        const errorText = await errorMessage.textContent();
        console.log('Error message:', errorText);
      }
    } else {
      console.log('🤔 Redirected to unexpected page:', page.url());
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();