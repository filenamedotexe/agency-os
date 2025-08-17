const { chromium, devices } = require('playwright');

async function debugMobileDetection() {
  console.log('\n🔍 DEBUGGING MOBILE DETECTION\n');
  console.log('=' + '='.repeat(70));
  
  const testDevices = [
    { name: 'iPhone 12', device: devices['iPhone 12'] },
    { name: 'Pixel 5', device: devices['Pixel 5'] },
    { name: 'iPad Mini', device: devices['iPad Mini'] }
  ];
  
  for (const testDevice of testDevices) {
    console.log(`\n📱 Testing: ${testDevice.name}`);
    console.log(`   Viewport: ${testDevice.device.viewport.width}x${testDevice.device.viewport.height}`);
    console.log(`   Has Touch: ${testDevice.device.hasTouch}`);
    console.log(`   Is Mobile: ${testDevice.device.isMobile}`);
    console.log('-'.repeat(40));
    
    const browser = await chromium.launch({ 
      headless: false,
      slowMo: 100
    });
    
    const context = await browser.newContext({
      ...testDevice.device,
      permissions: ['geolocation'],
      locale: 'en-US'
    });
    
    const page = await context.newPage();
    
    try {
      // Login as admin
      console.log('   Logging in...');
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[name="email"]', 'admin@demo.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      // Navigate to services
      console.log('   Navigating to services...');
      await page.goto('http://localhost:3000/services');
      await page.waitForTimeout(2000);
      
      // Click first service
      const serviceCards = await page.locator('[class*="cursor-pointer"]').count();
      if (serviceCards > 0) {
        await page.locator('[class*="cursor-pointer"]').first().click();
        await page.waitForTimeout(3000);
        
        // Check what view is shown
        console.log('\n   📊 View Analysis:');
        
        // Check for desktop Kanban columns
        const kanbanColumns = await page.locator('.kanban-column, [class*="kanban"]').count();
        const hasDesktopKanban = await page.locator('text="To Do"').count() > 2;
        console.log(`      Kanban columns found: ${kanbanColumns}`);
        console.log(`      Multiple "To Do" headers: ${hasDesktopKanban}`);
        
        // Check for mobile filter pills
        const allTasksButtons = await page.locator('button:has-text("All Tasks")').count();
        const filterPillsVisible = allTasksButtons > 0;
        console.log(`      "All Tasks" buttons found: ${allTasksButtons}`);
        console.log(`      Filter pills visible: ${filterPillsVisible}`);
        
        // Check for swipeable items
        const taskCards = await page.locator('[class*="p-4"]').count();
        console.log(`      Task cards found: ${taskCards}`);
        
        // Check viewport in browser
        const viewportSize = await page.evaluate(() => ({
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          isMobile: window.innerWidth <= 768,
          isTablet: window.innerWidth > 768 && window.innerWidth < 1024,
          hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
        }));
        
        console.log('\n   🖥️  Browser Detection:');
        console.log(`      Window size: ${viewportSize.innerWidth}x${viewportSize.innerHeight}`);
        console.log(`      Is Mobile (<=768px): ${viewportSize.isMobile}`);
        console.log(`      Is Tablet (768-1024px): ${viewportSize.isTablet}`);
        console.log(`      Has Touch Support: ${viewportSize.hasTouch}`);
        
        // Determine view type
        console.log('\n   ✅ Result:');
        if (filterPillsVisible && !hasDesktopKanban) {
          console.log('      ✅ MOBILE VIEW ACTIVE');
        } else if (hasDesktopKanban) {
          console.log('      ❌ DESKTOP VIEW ACTIVE');
        } else {
          console.log('      ⚠️  UNCLEAR VIEW TYPE');
        }
        
        // Take screenshot
        await page.screenshot({ 
          path: `/Users/zachwieder/Documents/CODING MAIN/final-agency/debug-${testDevice.name.toLowerCase().replace(' ', '-')}.png`,
          fullPage: false 
        });
        console.log(`\n   📸 Screenshot: debug-${testDevice.name.toLowerCase().replace(' ', '-')}.png`);
      }
      
    } catch (error) {
      console.error(`\n   ❌ Error: ${error.message}`);
    }
    
    await browser.close();
  }
  
  console.log('\n' + '=' + '='.repeat(70));
  console.log('\n✅ Debug complete! Check screenshots for visual confirmation.\n');
}

debugMobileDetection().catch(console.error);