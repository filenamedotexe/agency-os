const { chromium } = require('playwright');

const testUsers = [
  { email: 'admin@agencyos.dev', role: 'admin', shouldSeeEmails: true },
  { email: 'john@agencyos.dev', role: 'team', shouldSeeEmails: false },
  { email: 'client1@acme.com', role: 'client', shouldSeeEmails: false }
];

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  for (const user of testUsers) {
    console.log(`\n🧪 Testing ${user.role.toUpperCase()} user: ${user.email}`);
    console.log('='.repeat(50));

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    try {
      // Login
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      
      console.log(`📝 Logging in as ${user.role}...`);
      await page.fill('input[type="email"]', user.email);
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Wait for redirect based on role
      if (user.role === 'admin') {
        await page.waitForURL('**/admin', { timeout: 10000 });
      } else if (user.role === 'team') {
        await page.waitForURL('**/team', { timeout: 10000 });
      } else if (user.role === 'client') {
        await page.waitForURL('**/client', { timeout: 10000 });
      }
      
      await page.waitForTimeout(2000);
      console.log(`✅ Logged in successfully as ${user.role}`);

      // Check sidebar navigation
      console.log(`🔍 Checking sidebar navigation for ${user.role}...`);
      
      // Get all navigation links
      const navLinks = await page.locator('nav a[href^="/"]').all();
      const linkData = [];
      
      for (const link of navLinks) {
        const href = await link.getAttribute('href');
        const text = await link.locator('span').textContent().catch(() => null);
        if (href && text && !href.includes('logout')) {
          linkData.push({ href, text });
        }
      }
      
      console.log(`📋 Available navigation links:`);
      linkData.forEach(link => {
        console.log(`   • ${link.text}: ${link.href}`);
      });

      // Check for Emails link specifically
      const emailsLink = linkData.find(link => link.href === '/admin/emails');
      
      if (user.shouldSeeEmails) {
        if (emailsLink) {
          console.log(`✅ Emails link found for ${user.role} (CORRECT)`);
          
          // Test navigation to emails page
          console.log(`🖱️ Testing navigation to emails page...`);
          await page.click('nav a[href="/admin/emails"]');
          await page.waitForURL('**/admin/emails', { timeout: 5000 });
          await page.waitForTimeout(2000);
          
          const pageTitle = await page.locator('h1').textContent();
          if (pageTitle === 'Email Management') {
            console.log(`✅ Successfully navigated to Email Management page`);
            
            // Check if page has proper tabs
            const tabs = await page.locator('[role="tablist"] [role="tab"]').count();
            console.log(`📋 Found ${tabs} tabs on email management page`);
            
            if (tabs === 3) {
              console.log(`✅ All email management tabs present (Email Logs, Templates, Send Test)`);
            }
          } else {
            console.log(`❌ Wrong page title: ${pageTitle}`);
          }
          
        } else {
          console.log(`❌ Emails link NOT found for ${user.role} (SHOULD BE PRESENT)`);
        }
      } else {
        if (emailsLink) {
          console.log(`❌ Emails link found for ${user.role} (SHOULD NOT BE PRESENT)`);
        } else {
          console.log(`✅ Emails link not found for ${user.role} (CORRECT)`);
        }
      }

      // Take screenshot for each role
      await page.screenshot({ 
        path: `step8-${user.role}-sidebar.png`, 
        fullPage: false 
      });
      console.log(`📸 Screenshot saved: step8-${user.role}-sidebar.png`);

    } catch (error) {
      console.error(`❌ Test failed for ${user.role}:`, error.message);
      await page.screenshot({ path: `step8-${user.role}-error.png` });
    } finally {
      await context.close();
      console.log(`🔄 Completed test for ${user.role}`);
    }
  }

  await browser.close();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 STEP 8 TESTING COMPLETE!');
  console.log('✅ Expected: Admin sees Emails link, Team/Client do not');
  console.log('📧 Emails link should navigate to /admin/emails');
  console.log('📋 Email Management page should have 3 tabs');
  console.log('='.repeat(60));
})();