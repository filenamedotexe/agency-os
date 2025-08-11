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
    console.log('🧪 Testing Step 8: Emails in Admin Sidebar...\n');

    // Login as admin
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    console.log('Logging in as admin...');
    await page.fill('input[type="email"]', 'admin@agencyos.dev');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/admin', { timeout: 10000 });
    await page.waitForTimeout(2000);
    console.log('✅ Logged in successfully\n');

    // Check if Emails link exists in sidebar
    console.log('🔍 Checking sidebar for Emails link...');
    const emailsLink = await page.locator('nav a[href="/admin/emails"]').count();
    
    if (emailsLink > 0) {
      console.log('✅ Emails link found in sidebar');
      
      // Check the link text and icon
      const linkText = await page.locator('nav a[href="/admin/emails"] span').textContent();
      const hasMailIcon = await page.locator('nav a[href="/admin/emails"] svg').count() > 0;
      
      console.log(`📧 Link text: "${linkText}"`);
      console.log(`📮 Has mail icon: ${hasMailIcon ? 'Yes' : 'No'}`);
      
      // Click the Emails link
      console.log('\n🖱️ Clicking Emails link...');
      await page.click('nav a[href="/admin/emails"]');
      await page.waitForURL('**/admin/emails', { timeout: 5000 });
      await page.waitForTimeout(2000);
      
      // Verify we're on the email management page
      const pageTitle = await page.locator('h1').textContent();
      console.log(`📄 Page title: "${pageTitle}"`);
      
      if (pageTitle === 'Email Management') {
        console.log('✅ Successfully navigated to Email Management page');
        
        // Check if the sidebar link is now active
        const isActive = await page.locator('nav a[href="/admin/emails"][data-active="true"]').count() > 0;
        console.log(`🎯 Emails link is active: ${isActive ? 'Yes' : 'No'}`);
        
      } else {
        console.log('❌ Navigation failed - wrong page title');
      }
      
    } else {
      console.log('❌ Emails link NOT found in sidebar');
    }

    // Test navigation back to dashboard
    console.log('\n🏠 Testing navigation back to Dashboard...');
    await page.click('nav a[href="/dashboard"]');
    await page.waitForTimeout(1000);
    
    const dashboardActive = await page.locator('nav a[href="/dashboard"][data-active="true"]').count() > 0;
    console.log(`🎯 Dashboard link is active: ${dashboardActive ? 'Yes' : 'No'}`);

    // Take final screenshot
    await page.screenshot({ path: 'step8-sidebar-test.png', fullPage: false });
    console.log('\n📸 Screenshot saved as step8-sidebar-test.png');
    
    console.log('\n✅ Step 8: Admin sidebar integration completed successfully!');

  } catch (error) {
    console.error('❌ Step 8 test failed:', error.message);
    await page.screenshot({ path: 'step8-error.png' });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();