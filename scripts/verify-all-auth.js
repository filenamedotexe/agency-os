const { chromium } = require('playwright');

async function verifyAllAuth() {
  const browser = await chromium.launch({ 
    headless: true,
    slowMo: 100
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  console.log('\n🔐 VERIFYING ALL USER AUTHENTICATIONS\n');
  console.log('=' + '='.repeat(60));
  
  const users = [
    { email: 'admin@demo.com', password: 'password123', name: 'Alex Admin', role: 'admin', expectedUrl: '/admin' },
    { email: 'team@demo.com', password: 'password123', name: 'Taylor Team', role: 'team', expectedUrl: '/team' },
    { email: 'sarah@acmecorp.com', password: 'password123', name: 'Sarah Johnson', role: 'client', expectedUrl: '/client' },
    { email: 'mike@techstartup.co', password: 'password123', name: 'Mike Chen', role: 'client', expectedUrl: '/client' },
    { email: 'lisa@retailplus.com', password: 'password123', name: 'Lisa Rodriguez', role: 'client', expectedUrl: '/client' }
  ];
  
  let allPassed = true;
  
  for (const user of users) {
    console.log(`\n Testing: ${user.name} (${user.role})`);
    console.log('-'.repeat(40));
    
    try {
      // Navigate to login page
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      
      // Clear any existing values
      await page.fill('input[name="email"]', '');
      await page.fill('input[name="password"]', '');
      
      // Fill in credentials
      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', user.password);
      
      // Click login
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForTimeout(5000);
      
      // Check URL
      const currentUrl = page.url();
      
      if (currentUrl.includes(user.expectedUrl)) {
        console.log(`  ✅ Login successful`);
        console.log(`  ✅ Redirected to: ${user.expectedUrl}`);
        
        // Check for welcome message or user indicator
        const hasUserIndicator = await page.locator(`text="${user.email}"`).count() > 0 ||
                                 await page.locator(`text="${user.name}"`).count() > 0 ||
                                 await page.locator('text="Welcome"').count() > 0;
        
        if (hasUserIndicator) {
          console.log(`  ✅ User identified in UI`);
        }
        
        // Logout for next test
        await page.goto('http://localhost:3000/login');
        await page.waitForTimeout(1000);
        
      } else {
        console.log(`  ❌ Login failed`);
        console.log(`  ❌ Expected: ${user.expectedUrl}, Got: ${currentUrl}`);
        allPassed = false;
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      allPassed = false;
    }
  }
  
  console.log('\n' + '=' + '='.repeat(60));
  
  if (allPassed) {
    console.log('\n✅ ALL USER AUTHENTICATIONS WORKING!');
    console.log('Ready for Phase 5 testing.');
  } else {
    console.log('\n❌ SOME AUTHENTICATIONS FAILED!');
    console.log('Please fix authentication issues before proceeding.');
  }
  
  await browser.close();
  
  process.exit(allPassed ? 0 : 1);
}

// Run verification
verifyAllAuth().catch(console.error);