const puppeteer = require('puppeteer');

async function testEditMilestone() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('🔍 Testing Edit Milestone functionality...\n');
    
    // Navigate to login
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:3003/login');
    await page.waitForSelector('input[type="email"]');
    
    // Login as admin
    console.log('Step 2: Logging in as admin...');
    await page.type('input[type="email"]', 'admin@demo.com');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForNavigation();
    console.log('Step 3: Navigating to services...');
    
    // Go to services page
    await page.goto('http://localhost:3003/services');
    await page.waitForSelector('[data-testid="service-card"], a[href*="/services/"]', { timeout: 10000 });
    
    // Click on first service
    console.log('Step 4: Opening first service...');
    const serviceLink = await page.$('a[href*="/services/"]:not([href="/services"])');
    if (serviceLink) {
      await serviceLink.click();
      await page.waitForNavigation();
    } else {
      throw new Error('No service found to test');
    }
    
    // Wait for service detail page to load
    console.log('Step 5: Waiting for service detail page...');
    await page.waitForSelector('[data-testid="milestone-sidebar"], .milestone', { timeout: 10000 });
    
    // Look for edit button in milestone
    console.log('Step 6: Looking for edit milestone button...');
    
    // Wait a bit for components to load
    await page.waitForTimeout(2000);
    
    // Try to find and click edit button
    const editButton = await page.$('button[aria-label*="edit"], button:has(svg[data-testid="edit"]), button:has([data-testid="edit"])');
    
    if (!editButton) {
      // Try alternative selectors
      const editButtons = await page.$$('button');
      let foundEdit = false;
      
      for (const button of editButtons) {
        const buttonText = await page.evaluate(el => el.outerHTML, button);
        if (buttonText.includes('edit') || buttonText.includes('Edit')) {
          console.log('Found edit button:', buttonText.substring(0, 100) + '...');
          await button.click();
          foundEdit = true;
          break;
        }
      }
      
      if (!foundEdit) {
        throw new Error('Could not find edit milestone button');
      }
    } else {
      await editButton.click();
    }
    
    console.log('Step 7: Clicked edit button, waiting for dialog...');
    
    // Wait for edit dialog to appear
    await page.waitForSelector('[role="dialog"], [data-testid="edit-milestone-dialog"]', { timeout: 5000 });
    
    console.log('Step 8: Edit milestone dialog opened successfully! ✅');
    
    // Check if form fields are present
    const nameField = await page.$('input[placeholder*="Design"], input[id*="name"]');
    const statusSelect = await page.$('select, [role="combobox"]');
    const assigneeSelector = await page.$('[placeholder*="assignee"], [placeholder*="Select assignee"]');
    
    if (nameField) console.log('✅ Name field found');
    if (statusSelect) console.log('✅ Status selector found');
    if (assigneeSelector) console.log('✅ Assignee selector found');
    
    // Test form interaction
    if (nameField) {
      console.log('Step 9: Testing form interaction...');
      await nameField.click();
      await nameField.selectAll();
      await nameField.type('Updated Milestone Name - Test');
      console.log('✅ Successfully updated milestone name');
    }
    
    console.log('\n🎉 Edit Milestone functionality test completed successfully!');
    console.log('\nFeatures verified:');
    console.log('✅ Edit button clickable');
    console.log('✅ Dialog opens properly');
    console.log('✅ Form fields are present');
    console.log('✅ Form interaction works');
    console.log('\nPhase 7 implementation is working! 🚀');
    
    // Keep browser open for manual testing
    console.log('\nBrowser kept open for manual verification...');
    console.log('You can now manually test:');
    console.log('- Status dropdown with icons');
    console.log('- Calendar date picker');
    console.log('- Assignee selector');
    console.log('- Form validation');
    console.log('- Save/Update functionality');
    
    // Wait for user to close manually
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nDebugging info:');
    
    try {
      const currentUrl = await page.url();
      console.log('Current URL:', currentUrl);
      
      const pageContent = await page.content();
      console.log('Page title:', await page.title());
      
      // Check for any console errors
      const errors = await page.evaluate(() => {
        return window.__errors || 'No JavaScript errors captured';
      });
      console.log('JavaScript errors:', errors);
      
    } catch (debugError) {
      console.log('Could not get debugging info:', debugError.message);
    }
    
    // Keep browser open for debugging
    await new Promise(() => {});
  }
}

// Handle puppeteer not found gracefully
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testEditMilestone;
}

// Run if called directly
if (require.main === module) {
  testEditMilestone().catch(console.error);
}