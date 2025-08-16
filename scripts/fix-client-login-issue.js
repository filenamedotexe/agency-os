const { chromium } = require('playwright');

async function fixClientLoginIssue() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable detailed logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`🔥 BROWSER ERROR: ${msg.text()}`);
    }
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`🚨 HTTP ${response.status()}: ${response.url()}`);
    }
  });
  
  console.log('🔧 DEBUGGING CLIENT LOGIN ISSUE\n');
  console.log('=' + '='.repeat(50));
  
  try {
    // Step 1: Login as admin first
    console.log('\n1. Admin Login');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    if (page.url().includes('/admin')) {
      console.log('   ✅ Admin logged in');
    } else {
      console.log('   ❌ Admin login failed');
      throw new Error('Admin login failed');
    }
    
    // Step 2: Careful logout process
    console.log('\n2. Logout Process');
    
    // Look for user menu button
    const userMenuSelectors = [
      'button:has-text("admin@demo.com")',
      'button[aria-label*="User menu"]',
      'button[class*="user-menu"]',
      '[data-testid="user-menu"]'
    ];
    
    let userMenuFound = false;
    for (const selector of userMenuSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`   Found user menu with: ${selector}`);
          await element.click();
          userMenuFound = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!userMenuFound) {
      console.log('   ⚠️  User menu not found, trying alternative logout');
      // Try going directly to login page
      await page.goto('http://localhost:3000/login');
      await page.waitForTimeout(2000);
    } else {
      // Look for sign out option
      await page.waitForTimeout(1000);
      
      const signOutSelectors = [
        'text="Sign out"',
        'text="Logout"',
        'text="Log out"',
        '[aria-label="Sign out"]'
      ];
      
      let signOutClicked = false;
      for (const selector of signOutSelectors) {
        try {
          const element = await page.locator(selector).first();
          if (await element.isVisible()) {
            console.log(`   Found sign out with: ${selector}`);
            await element.click();
            signOutClicked = true;
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      if (signOutClicked) {
        console.log('   ✅ Clicked sign out');
        await page.waitForTimeout(3000);
      } else {
        console.log('   ⚠️  Sign out button not found');
      }
    }
    
    // Step 3: Verify we're on login page
    console.log('\n3. Verify Login Page');
    
    // Wait for navigation and check URL
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    if (!currentUrl.includes('/login')) {
      console.log('   Not on login page, navigating directly...');
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
    }
    
    // Wait for login form to be ready
    console.log('   Waiting for login form...');
    await page.waitForSelector('input[name="email"]', { state: 'visible', timeout: 10000 });
    await page.waitForSelector('input[name="password"]', { state: 'visible', timeout: 10000 });
    await page.waitForSelector('button[type="submit"]', { state: 'visible', timeout: 10000 });
    
    console.log('   ✅ Login form ready');
    
    // Step 4: Client login with proper waits
    console.log('\n4. Client Login');
    
    // Clear fields first
    await page.fill('input[name="email"]', '');
    await page.fill('input[name="password"]', '');
    
    // Fill client credentials
    await page.fill('input[name="email"]', 'sarah@acmecorp.com');
    await page.fill('input[name="password"]', 'password123');
    
    console.log('   Credentials filled, submitting...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation with extended timeout
    await page.waitForTimeout(6000);
    
    const clientUrl = page.url();
    console.log(`   Redirected to: ${clientUrl}`);
    
    if (clientUrl.includes('/client')) {
      console.log('   ✅ Client login successful!');
      
      // Step 5: Test client view
      console.log('\n5. Test Client View');
      await page.goto('http://localhost:3000/services');
      await page.waitForTimeout(2000);
      
      const serviceCards = await page.locator('[class*="cursor-pointer"]').count();
      console.log(`   Found ${serviceCards} services`);
      
      if (serviceCards > 0) {
        await page.locator('[class*="cursor-pointer"]').first().click();
        await page.waitForTimeout(3000);
        
        // Check for timeline view (clients should see timeline, not kanban)
        const hasTimeline = await page.locator('text="Project Overview"').isVisible() ||
                           await page.locator('text="Project Summary"').isVisible() ||
                           await page.locator('[class*="timeline"]').count() > 0;
        
        const hasKanban = await page.locator('text="To Do"').count() > 0;
        
        console.log(`   Timeline view: ${hasTimeline ? '✅' : '❌'}`);
        console.log(`   Kanban hidden: ${!hasKanban ? '✅' : '❌'}`);
        
        if (hasTimeline && !hasKanban) {
          console.log('   ✅ Client view restrictions working correctly');
        } else {
          console.log('   ❌ Client view issue detected');
        }
      }
    } else {
      console.log('   ❌ Client login failed');
      console.log('   Checking for error messages...');
      
      const errorMessage = await page.locator('[role="alert"]').textContent() || 
                          await page.locator('.error').textContent() ||
                          'No error message found';
      console.log(`   Error: ${errorMessage}`);
    }
    
  } catch (error) {
    console.error('\n💥 ERROR:', error.message);
  }
  
  console.log('\n' + '=' + '='.repeat(50));
  console.log('🔍 Diagnosis complete. Check results above.');
  
  await page.waitForTimeout(5000);
  await browser.close();
}

fixClientLoginIssue().catch(console.error);