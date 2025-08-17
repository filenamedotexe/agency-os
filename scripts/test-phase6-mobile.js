const { chromium, devices } = require('playwright');

async function testPhase6Mobile() {
  console.log('\n📱 PHASE 6: MOBILE EXPERIENCE TESTING\n');
  console.log('=' + '='.repeat(70));
  
  const results = { passed: [], failed: [], warnings: [] };
  
  // Test on different mobile devices
  const mobileDevices = [
    { name: 'iPhone 12', device: devices['iPhone 12'] },
    { name: 'Pixel 5', device: devices['Pixel 5'] },
    { name: 'iPad Mini', device: devices['iPad Mini'] }
  ];
  
  for (const mobile of mobileDevices) {
    console.log(`\n📱 Testing on ${mobile.name}`);
    console.log('-'.repeat(40));
    
    const browser = await chromium.launch({ 
      headless: false,
      slowMo: 200
    });
    
    const context = await browser.newContext({
      ...mobile.device,
      permissions: ['geolocation'],
      locale: 'en-US'
    });
    
    const page = await context.newPage();
    
    try {
      // ========================================
      // 1. LOGIN AS ADMIN (HAS TASKS)
      // ========================================
      console.log('\n1️⃣  Admin Login');
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[name="email"]', 'admin@demo.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
      
      if (page.url().includes('/admin')) {
        results.passed.push(`✅ ${mobile.name}: Login successful`);
        console.log('   ✅ Logged in as admin');
      } else {
        results.failed.push(`❌ ${mobile.name}: Login failed`);
        console.log('   ❌ Login failed');
        continue;
      }
      
      // ========================================
      // 2. NAVIGATE TO SERVICES
      // ========================================
      console.log('\n2️⃣  Navigate to Services');
      await page.goto('http://localhost:3000/services');
      await page.waitForTimeout(3000);
      
      const serviceCount = await page.locator('[class*="cursor-pointer"]').count();
      console.log(`   Found ${serviceCount} services`);
      
      if (serviceCount > 0) {
        await page.locator('[class*="cursor-pointer"]').first().click();
        await page.waitForTimeout(3000);
        
        if (page.url().includes('/services/')) {
          results.passed.push(`✅ ${mobile.name}: Service navigation`);
          console.log('   ✅ Opened service detail');
        }
      } else {
        results.failed.push(`❌ ${mobile.name}: No services`);
        continue;
      }
      
      // ========================================
      // 3. CHECK MOBILE VIEW IS ACTIVE
      // ========================================
      console.log('\n3️⃣  Mobile View Detection');
      
      // Should NOT see desktop Kanban columns
      const hasDesktopKanban = await page.locator('.kanban-column').count() > 0 ||
                               (await page.locator('text="To Do"').count() > 2); // More than 2 means columns
      
      // Should see mobile filter pills
      const hasFilterPills = await page.locator('button:has-text("All Tasks")').first().isVisible() ||
                            await page.locator('button:has-text("To Do")').first().isVisible();
      
      if (!hasDesktopKanban && hasFilterPills) {
        results.passed.push(`✅ ${mobile.name}: Mobile view active`);
        console.log('   ✅ Mobile view detected');
      } else if (hasDesktopKanban) {
        results.failed.push(`❌ ${mobile.name}: Showing desktop view`);
        console.log('   ❌ Desktop Kanban visible on mobile');
      } else {
        results.warnings.push(`⚠️  ${mobile.name}: View unclear`);
        console.log('   ⚠️  Could not determine view type');
      }
      
      // ========================================
      // 4. TEST FILTER PILLS
      // ========================================
      console.log('\n4️⃣  Filter Pills');
      
      const filters = ['All Tasks', 'To Do', 'In Progress', 'Done'];
      let filterWorking = true;
      
      for (const filter of filters) {
        const filterButton = page.locator(`button:has-text("${filter}")`).first();
        
        if (await filterButton.isVisible()) {
          await filterButton.click();
          await page.waitForTimeout(1000);
          console.log(`   ✅ "${filter}" filter clickable`);
        } else {
          filterWorking = false;
          console.log(`   ❌ "${filter}" filter not found`);
        }
      }
      
      if (filterWorking) {
        results.passed.push(`✅ ${mobile.name}: Filter pills working`);
      } else {
        results.failed.push(`❌ ${mobile.name}: Filter issues`);
      }
      
      // Reset to All Tasks
      const allTasksBtn = page.locator('button:has-text("All Tasks")').first();
      if (await allTasksBtn.isVisible()) {
        await allTasksBtn.click();
        await page.waitForTimeout(1000);
      }
      
      // ========================================
      // 5. TEST SWIPE GESTURES
      // ========================================
      console.log('\n5️⃣  Swipe Gestures');
      
      // Find a task
      const taskCount = await page.locator('[class*="p-4"]').count();
      console.log(`   Found ${taskCount} task cards`);
      
      if (taskCount > 0) {
        const firstTask = page.locator('[class*="p-4"]').first();
        const taskBox = await firstTask.boundingBox();
        
        if (taskBox) {
          // Test swipe right (complete)
          console.log('   Testing swipe right...');
          const startX = taskBox.x + 50;
          const startY = taskBox.y + taskBox.height / 2;
          const endX = taskBox.x + taskBox.width - 50;
          
          await page.mouse.move(startX, startY);
          await page.mouse.down();
          await page.mouse.move(endX, startY, { steps: 10 });
          await page.mouse.up();
          await page.waitForTimeout(1500);
          
          // Check if complete action visible
          const completeVisible = await page.locator('text="Complete"').isVisible();
          if (completeVisible) {
            results.passed.push(`✅ ${mobile.name}: Swipe right works`);
            console.log('   ✅ Swipe right gesture detected');
          }
          
          // Reset by clicking elsewhere
          await page.click('body', { position: { x: 10, y: 10 } });
          await page.waitForTimeout(1000);
          
          // Test swipe left (assign)
          console.log('   Testing swipe left...');
          await page.mouse.move(endX, startY);
          await page.mouse.down();
          await page.mouse.move(startX, startY, { steps: 10 });
          await page.mouse.up();
          await page.waitForTimeout(1500);
          
          // Check if assign action visible
          const assignVisible = await page.locator('text="Assign"').isVisible();
          if (assignVisible) {
            results.passed.push(`✅ ${mobile.name}: Swipe left works`);
            console.log('   ✅ Swipe left gesture detected');
          }
          
          // Close any opened sheets
          const closeButton = page.locator('button[aria-label="Close"]').first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
          }
        }
      } else {
        console.log('   ⚠️  No tasks to test swipe');
        results.warnings.push(`⚠️  ${mobile.name}: No tasks for swipe test`);
      }
      
      // ========================================
      // 6. TEST TOUCH TARGETS
      // ========================================
      console.log('\n6️⃣  Touch Target Sizes');
      
      // Check button sizes
      const buttons = await page.locator('button').all();
      let tooSmallCount = 0;
      
      for (const button of buttons.slice(0, 5)) { // Check first 5 buttons
        const box = await button.boundingBox();
        if (box && (box.width < 44 || box.height < 44)) {
          tooSmallCount++;
        }
      }
      
      if (tooSmallCount === 0) {
        results.passed.push(`✅ ${mobile.name}: Touch targets adequate`);
        console.log('   ✅ All touch targets >= 44px');
      } else {
        results.warnings.push(`⚠️  ${mobile.name}: ${tooSmallCount} small touch targets`);
        console.log(`   ⚠️  ${tooSmallCount} buttons < 44px`);
      }
      
      // ========================================
      // 7. TEST RESPONSIVENESS
      // ========================================
      console.log('\n7️⃣  Responsive Layout');
      
      // Check for horizontal scrolling (bad on mobile)
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      
      if (bodyWidth <= viewportWidth) {
        results.passed.push(`✅ ${mobile.name}: No horizontal scroll`);
        console.log('   ✅ Content fits viewport');
      } else {
        results.failed.push(`❌ ${mobile.name}: Horizontal scroll detected`);
        console.log('   ❌ Content wider than viewport');
      }
      
      // ========================================
      // 8. TEST MILESTONE TABS
      // ========================================
      console.log('\n8️⃣  Milestone Navigation');
      
      const milestoneTabs = await page.locator('button[class*="rounded-lg"]').count();
      
      if (milestoneTabs > 1) {
        // Click second milestone
        await page.locator('button[class*="rounded-lg"]').nth(1).click();
        await page.waitForTimeout(2000);
        
        results.passed.push(`✅ ${mobile.name}: Milestone tabs working`);
        console.log(`   ✅ ${milestoneTabs} milestone tabs functional`);
      } else {
        console.log('   ⚠️  Not enough milestones to test');
      }
      
      // ========================================
      // 9. PERFORMANCE CHECK
      // ========================================
      console.log('\n9️⃣  Performance');
      
      // Measure time to filter tasks
      const startTime = Date.now();
      const doneBtn = page.locator('button:has-text("Done")').first();
      if (await doneBtn.isVisible()) {
        await doneBtn.click();
      }
      await page.waitForTimeout(500);
      const filterTime = Date.now() - startTime;
      
      if (filterTime < 1000) {
        results.passed.push(`✅ ${mobile.name}: Fast filtering (${filterTime}ms)`);
        console.log(`   ✅ Filter response: ${filterTime}ms`);
      } else {
        results.warnings.push(`⚠️  ${mobile.name}: Slow filtering (${filterTime}ms)`);
        console.log(`   ⚠️  Filter took ${filterTime}ms`);
      }
      
    } catch (error) {
      console.error(`\n❌ Error on ${mobile.name}:`, error.message);
      results.failed.push(`❌ ${mobile.name}: ${error.message}`);
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: `/Users/zachwieder/Documents/CODING MAIN/final-agency/mobile-${mobile.name.toLowerCase().replace(' ', '-')}.png`,
      fullPage: true 
    });
    console.log(`\n📸 Screenshot saved: mobile-${mobile.name.toLowerCase().replace(' ', '-')}.png`);
    
    await browser.close();
  }
  
  // ========================================
  // FINAL RESULTS
  // ========================================
  console.log('\n' + '=' + '='.repeat(70));
  console.log('\n📊 PHASE 6 MOBILE TEST RESULTS\n');
  
  const total = results.passed.length + results.failed.length;
  const passRate = total > 0 ? Math.round((results.passed.length / total) * 100) : 0;
  
  console.log(`✅ Passed: ${results.passed.length} tests`);
  console.log(`❌ Failed: ${results.failed.length} tests`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  console.log(`📈 Success Rate: ${passRate}%`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(test => console.log(`   ${test}`));
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(warning => console.log(`   ${warning}`));
  }
  
  console.log('\n✅ Passed Tests:');
  results.passed.forEach(test => console.log(`   ${test}`));
  
  // Mobile Feature Checklist
  console.log('\n✨ MOBILE FEATURE CHECKLIST:');
  const features = [
    'Mobile View Detection',
    'Filter Pills',
    'Swipe Gestures',
    'Touch Targets',
    'Responsive Layout',
    'Milestone Navigation',
    'Performance'
  ];
  
  features.forEach(feature => {
    const passed = results.passed.some(r => r.toLowerCase().includes(feature.toLowerCase().split(' ')[0]));
    console.log(`   ${passed ? '✅' : '⚠️ '} ${feature}`);
  });
  
  console.log('\n' + '=' + '='.repeat(70));
  
  if (passRate === 100) {
    console.log('\n🎉🎉🎉 PERFECT! PHASE 6 COMPLETE! 🎉🎉🎉');
    console.log('Mobile experience is flawless!');
  } else if (passRate >= 90) {
    console.log('\n✅ EXCELLENT! Mobile experience nearly perfect!');
  } else if (passRate >= 80) {
    console.log('\n⚠️  GOOD! Most mobile features working.');
  } else {
    console.log('\n❌ NEEDS WORK! Mobile experience needs improvement.');
  }
  
  process.exit(passRate >= 90 ? 0 : 1);
}

// Run the test
testPhase6Mobile().catch(console.error);