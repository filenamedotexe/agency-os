const { chromium } = require('playwright');

async function debugClientView() {
  const browser = await chromium.launch({ 
    headless: false,  // Show browser to see what's happening
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  console.log('\n🔍 DEBUGGING CLIENT VIEW\n');
  console.log('=' + '='.repeat(60));
  
  try {
    // Login as client
    console.log('Logging in as client...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'sarah@acmecorp.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    console.log('Current URL:', page.url());
    
    // Go to services
    console.log('\nNavigating to services...');
    await page.goto('http://localhost:3000/services');
    await page.waitForTimeout(3000);
    
    // Open first service
    console.log('Opening first service...');
    await page.locator('[class*="cursor-pointer"]').first().click();
    await page.waitForTimeout(4000);
    
    console.log('Service URL:', page.url());
    
    // Check what's on the page
    console.log('\n🔍 SEARCHING FOR KANBAN ELEMENTS:');
    
    const kanbanColumns = ['To Do', 'In Progress', 'Review', 'Done', 'Blocked'];
    
    for (const column of kanbanColumns) {
      const count = await page.locator(`text="${column}"`).count();
      if (count > 0) {
        console.log(`  ❌ Found "${column}" ${count} times`);
        
        // Get the context of where it appears
        const elements = await page.locator(`text="${column}"`).all();
        for (let i = 0; i < Math.min(count, 2); i++) {
          const parent = await elements[i].locator('..').innerHTML();
          console.log(`     Context ${i+1}: ${parent.substring(0, 100)}...`);
        }
      } else {
        console.log(`  ✅ "${column}" not found`);
      }
    }
    
    // Check for timeline elements
    console.log('\n🔍 TIMELINE ELEMENTS:');
    
    const timelineElements = [
      'Project Overview',
      'Project Summary',
      'Key Deliverables',
      'Milestones'
    ];
    
    for (const element of timelineElements) {
      const visible = await page.locator(`text="${element}"`).isVisible().catch(() => false);
      console.log(`  ${visible ? '✅' : '❌'} ${element}`);
    }
    
    // Take a screenshot
    await page.screenshot({ 
      path: '/Users/zachwieder/Documents/CODING MAIN/final-agency/debug-client-view.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved as debug-client-view.png');
    
    console.log('\n⏸️  Browser will stay open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  await browser.close();
}

debugClientView().catch(console.error);