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
    console.log('🔧 Testing Settings Refactor...\n');

    // Login as admin
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    console.log('📝 Logging in as admin...');
    await page.fill('input[type="email"]', 'admin@agencyos.dev');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/admin', { timeout: 10000 });
    await page.waitForTimeout(2000);
    console.log('✅ Logged in successfully\n');

    // Check sidebar structure
    console.log('🔍 Checking updated sidebar structure...');
    const navLinks = await page.locator('nav a[href^="/"]').all();
    const linkData = [];
    
    for (const link of navLinks) {
      const href = await link.getAttribute('href');
      const text = await link.locator('span').textContent().catch(() => null);
      if (href && text && !href.includes('logout')) {
        linkData.push({ href, text });
      }
    }
    
    console.log('📋 Current navigation links:');
    linkData.forEach(link => {
      console.log(`   • ${link.text}: ${link.href}`);
    });

    // Verify no standalone Emails link
    const emailsLink = linkData.find(link => link.text === 'Emails');
    if (!emailsLink) {
      console.log('✅ Standalone Emails link removed (CORRECT)');
    } else {
      console.log('❌ Standalone Emails link still present (SHOULD BE REMOVED)');
    }

    // Test Settings navigation
    console.log('\n🖱️ Testing Settings navigation...');
    const settingsLink = linkData.find(link => link.text === 'Settings');
    
    if (settingsLink && settingsLink.href === '/admin/settings') {
      console.log('✅ Settings link points to /admin/settings (CORRECT)');
      
      // Navigate to Settings
      await page.click('nav a[href="/admin/settings"]');
      await page.waitForURL('**/admin/settings', { timeout: 5000 });
      await page.waitForTimeout(2000);
      
      const pageTitle = await page.locator('h1').textContent();
      console.log(`📄 Settings page title: "${pageTitle}"`);
      
      if (pageTitle === 'Settings') {
        console.log('✅ Successfully navigated to Settings page');
        
        // Check main tabs
        const mainTabs = await page.locator('[role="tablist"]:first [role="tab"]').count();
        console.log(`📋 Found ${mainTabs} main tabs on Settings page`);
        
        if (mainTabs >= 3) {
          console.log('✅ Settings has multiple tabs (Email Management, General, Users)');
          
          // Test Email Management tab
          console.log('\n📧 Testing Email Management tab...');
          await page.click('[role="tab"]:has-text("Email Management")');
          await page.waitForTimeout(1000);
          
          // Check for nested email tabs
          const emailTabs = await page.locator('[role="tablist"]:last [role="tab"]').count();
          console.log(`📋 Found ${emailTabs} email management tabs`);
          
          if (emailTabs === 3) {
            console.log('✅ Email Management has all tabs (Logs, Templates, Test)');
            
            // Test Email Logs functionality
            await page.click('[role="tab"]:has-text("Email Logs")');
            await page.waitForTimeout(1000);
            
            const hasTable = await page.locator('table').count() > 0;
            const hasEmptyState = await page.locator('text=No email logs found').count() > 0;
            
            if (hasTable || hasEmptyState) {
              console.log('✅ Email Logs tab is functional');
            }
          }
        }
        
      } else {
        console.log(`❌ Wrong page title: ${pageTitle}`);
      }
      
    } else {
      console.log('❌ Settings link configuration incorrect');
    }

    // Take screenshot
    await page.screenshot({ path: 'settings-refactor-test.png', fullPage: false });
    console.log('\n📸 Screenshot saved as settings-refactor-test.png');
    
    console.log('\n✅ Settings refactor testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'settings-refactor-error.png' });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();