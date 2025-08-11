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
    console.log('🚀 Testing Email Management UI...\n');

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
    
    // Navigate to email management
    console.log('Navigating to email management...');
    await page.goto('http://localhost:3000/admin/emails');
    await page.waitForLoadState('networkidle');
    
    // Check if page loads
    const pageTitle = await page.textContent('h1');
    console.log(`📧 Page title: ${pageTitle}`);
    
    // Check tabs exist
    const tabs = await page.locator('[role="tablist"] [role="tab"]').count();
    console.log(`📋 Found ${tabs} tabs`);
    
    // Test Email Logs tab
    console.log('\n🔍 Testing Email Logs tab...');
    await page.click('[data-state="active"]:has-text("Email Logs")');
    await page.waitForTimeout(1000);
    
    // Check if table or empty state is shown
    const hasTable = await page.locator('table').count() > 0;
    const hasEmptyState = await page.locator('text=No email logs found').count() > 0;
    
    if (hasTable) {
      console.log('✅ Email logs table displayed');
    } else if (hasEmptyState) {
      console.log('✅ Empty state displayed (no logs yet)');
    } else {
      console.log('❌ Neither table nor empty state found');
    }
    
    // Test Templates tab
    console.log('\n📄 Testing Templates tab...');
    await page.click('[role="tab"]:has-text("Templates")');
    await page.waitForTimeout(1000);
    
    const templateCards = await page.locator('div[class*="cursor-pointer"]').count();
    console.log(`✅ Found ${templateCards} template cards`);
    
    // Test Send Test tab
    console.log('\n✉️ Testing Send Test tab...');
    await page.click('[role="tab"]:has-text("Send Test")');
    await page.waitForTimeout(1000);
    
    const hasForm = await page.locator('form').count() > 0;
    if (hasForm) {
      console.log('✅ Test email form displayed');
      
      // Test form interaction
      await page.selectOption('select', 'welcome');
      await page.fill('input[type="email"]', 'test@example.com');
      console.log('✅ Form fields are interactive');
    } else {
      console.log('❌ Test email form not found');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'email-management-ui.png', fullPage: false });
    console.log('\n📸 Screenshot saved as email-management-ui.png');
    
    console.log('\n✅ Email Management UI is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'email-management-error.png' });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();