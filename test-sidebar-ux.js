const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down to see what's happening
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('🚀 Starting comprehensive UX test...\n');

    // 1. Go to login page
    console.log('1️⃣ Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // 2. Login as admin
    console.log('2️⃣ Logging in as admin...');
    await page.fill('input[type="email"]', 'admin@agencyos.dev');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/admin', { timeout: 10000 });
    console.log('✅ Successfully logged in and redirected to admin dashboard\n');

    // 3. Test sidebar visibility and styling
    console.log('3️⃣ Testing sidebar visibility and styling...');
    const sidebar = await page.locator('[data-sidebar="sidebar"]');
    const isSidebarVisible = await sidebar.isVisible();
    console.log(`   Sidebar visible: ${isSidebarVisible ? '✅' : '❌'}`);
    
    // Check sidebar background
    const sidebarBg = await sidebar.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    console.log(`   Sidebar background: ${sidebarBg}`);

    // 4. Test navigation items
    console.log('\n4️⃣ Testing navigation items...');
    const navItems = ['Dashboard', 'Clients', 'Services', 'Settings'];
    
    for (const item of navItems) {
      const navButton = page.locator(`[data-sidebar="menu-button"]:has-text("${item}")`);
      const exists = await navButton.count() > 0;
      console.log(`   ${item}: ${exists ? '✅ Found' : '❌ Not found'}`);
      
      if (exists) {
        // Check hover effect
        await navButton.hover();
        const hoverBg = await navButton.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        console.log(`      Hover background: ${hoverBg}`);
      }
    }

    // 5. Test navigation clicks
    console.log('\n5️⃣ Testing navigation clicks...');
    
    // Click on Clients
    console.log('   Clicking on Clients...');
    await page.click('[data-sidebar="menu-button"]:has-text("Clients")');
    await page.waitForURL('**/clients');
    console.log('   ✅ Successfully navigated to Clients page');
    
    // Check if sidebar is still visible
    const sidebarStillVisible = await sidebar.isVisible();
    console.log(`   Sidebar still visible: ${sidebarStillVisible ? '✅' : '❌'}`);
    
    // Click on Services
    console.log('   Clicking on Services...');
    await page.click('[data-sidebar="menu-button"]:has-text("Services")');
    await page.waitForURL('**/services');
    console.log('   ✅ Successfully navigated to Services page');
    
    // Click on Settings
    console.log('   Clicking on Settings...');
    await page.click('[data-sidebar="menu-button"]:has-text("Settings")');
    await page.waitForURL('**/settings');
    console.log('   ✅ Successfully navigated to Settings page');
    
    // Go back to Dashboard
    console.log('   Clicking on Dashboard...');
    await page.click('[data-sidebar="menu-button"]:has-text("Dashboard")');
    await page.waitForURL('**/admin');
    console.log('   ✅ Successfully navigated back to Dashboard');

    // 6. Test sidebar toggle
    console.log('\n6️⃣ Testing sidebar toggle...');
    const toggleButton = page.locator('[data-sidebar="trigger"]');
    const toggleExists = await toggleButton.count() > 0;
    
    if (toggleExists) {
      console.log('   Found toggle button');
      
      // Click toggle to collapse
      await toggleButton.click();
      await page.waitForTimeout(500);
      
      // Check sidebar state
      const sidebarState = await page.locator('.group.peer').getAttribute('data-state');
      console.log(`   Sidebar state after toggle: ${sidebarState}`);
      
      // Click toggle to expand
      await toggleButton.click();
      await page.waitForTimeout(500);
      
      const newSidebarState = await page.locator('.group.peer').getAttribute('data-state');
      console.log(`   Sidebar state after second toggle: ${newSidebarState}`);
    } else {
      console.log('   ❌ Toggle button not found');
    }

    // 7. Test user info in sidebar
    console.log('\n7️⃣ Testing user info in sidebar footer...');
    const userEmail = await page.locator('[data-sidebar="footer"] .truncate').first().textContent();
    console.log(`   User email shown: ${userEmail}`);
    
    const userRole = await page.locator('[data-sidebar="footer"] .capitalize').textContent();
    console.log(`   User role shown: ${userRole}`);
    
    // Check avatar
    const avatar = await page.locator('[data-sidebar="footer"] [data-avatar-fallback]');
    const avatarExists = await avatar.count() > 0;
    console.log(`   Avatar displayed: ${avatarExists ? '✅' : '❌'}`);
    
    if (avatarExists) {
      const initials = await avatar.textContent();
      console.log(`   Avatar initials: ${initials}`);
    }

    // 8. Test sign out button
    console.log('\n8️⃣ Testing sign out button...');
    const signOutButton = page.locator('[data-sidebar="menu-button"]:has-text("Sign out")');
    const signOutExists = await signOutButton.count() > 0;
    
    if (signOutExists) {
      console.log('   Found sign out button');
      
      // Hover to check styling
      await signOutButton.hover();
      const signOutHoverBg = await signOutButton.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      console.log(`   Sign out hover background: ${signOutHoverBg}`);
      
      // Click sign out
      console.log('   Clicking sign out...');
      await signOutButton.click();
      
      // Wait for redirect to login
      await page.waitForURL('**/login', { timeout: 10000 });
      console.log('   ✅ Successfully signed out and redirected to login');
    } else {
      console.log('   ❌ Sign out button not found');
    }

    // 9. Test responsive behavior
    console.log('\n9️⃣ Testing responsive behavior...');
    
    // Login again first
    await page.fill('input[type="email"]', 'admin@agencyos.dev');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin', { timeout: 10000 });
    
    // Test tablet view
    console.log('   Testing tablet view (768px)...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    const sidebarVisibleTablet = await sidebar.isVisible();
    console.log(`   Sidebar visible on tablet: ${sidebarVisibleTablet ? '✅' : '❌'}`);
    
    // Test mobile view
    console.log('   Testing mobile view (375px)...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const sidebarVisibleMobile = await sidebar.isVisible();
    console.log(`   Sidebar visible on mobile: ${!sidebarVisibleMobile ? '✅ Hidden (correct)' : '❌ Visible (should be hidden)'}`);
    
    // Check for mobile menu trigger
    const mobileTrigger = await page.locator('[data-sidebar="trigger"]').isVisible();
    console.log(`   Mobile menu trigger visible: ${mobileTrigger ? '✅' : '❌'}`);
    
    // Return to desktop view
    console.log('   Returning to desktop view...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    const sidebarVisibleDesktop = await sidebar.isVisible();
    console.log(`   Sidebar visible on desktop: ${sidebarVisibleDesktop ? '✅' : '❌'}`);

    console.log('\n✅ All UX tests completed successfully!');
    
    // Take a final screenshot
    await page.screenshot({ path: 'sidebar-test-final.png', fullPage: true });
    console.log('📸 Screenshot saved as sidebar-test-final.png');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'sidebar-test-error.png', fullPage: true });
    console.log('📸 Error screenshot saved as sidebar-test-error.png');
  } finally {
    await browser.close();
  }
})();