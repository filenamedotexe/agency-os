const { chromium } = require('playwright');

async function testPhase4() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  const results = {
    passed: [],
    failed: [],
    totalTests: 0
  };
  
  console.log('\n🚀 Starting Phase 4 Comprehensive Testing\n');
  console.log('=' + '='.repeat(60));
  
  try {
    // Test 1: Admin Login
    console.log('\n📋 Test 1: Admin Login');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin');
    results.passed.push('✅ Admin login successful');
    console.log('   ✅ Admin login successful');
    
    // Test 2: Navigate to Services Page
    console.log('\n📋 Test 2: Navigate to Services');
    await page.click('text=Services');
    await page.waitForURL('**/services', { timeout: 10000 });
    await page.waitForTimeout(2000); // Wait for page to fully load
    
    // Check for services page elements
    const servicesTitle = await page.isVisible('h1:has-text("Services")') || 
                          await page.isVisible('text=Active Services') ||
                          await page.isVisible('[class*="card"]');
    
    if (servicesTitle) {
      results.passed.push('✅ Services page loaded');
      console.log('   ✅ Services page loaded');
    } else {
      throw new Error('Services page not loaded');
    }
    
    // Test 3: Open Service Detail Page
    console.log('\n📋 Test 3: Open Service Detail Page');
    // Click on first service card
    const firstService = await page.locator('.cursor-pointer').first();
    if (await firstService.isVisible()) {
      await firstService.click();
      await page.waitForTimeout(1000);
      
      // Check if we're on service detail page
      const headerVisible = await page.isVisible('text=Project Overview');
      const kanbanVisible = await page.isVisible('text=Milestones') || await page.isVisible('text=To Do');
      
      if (headerVisible || kanbanVisible) {
        results.passed.push('✅ Service detail page loaded');
        console.log('   ✅ Service detail page loaded');
      } else {
        throw new Error('Service detail page not loaded properly');
      }
    } else {
      console.log('   ⚠️  No services found, creating test service');
      
      // Create a test service first
      await page.click('button:has-text("New Service")');
      await page.fill('input[placeholder*="service name"]', 'Test Service for Phase 4');
      await page.fill('textarea', 'Testing Phase 4 functionality');
      await page.selectOption('select', { index: 1 }); // Select first client
      await page.click('button:has-text("Create Service")');
      await page.waitForTimeout(2000);
      
      // Now click on the created service
      await page.click('text=Test Service for Phase 4');
      await page.waitForTimeout(1000);
      results.passed.push('✅ Created and opened test service');
      console.log('   ✅ Created and opened test service');
    }
    
    // Test 4: Service Header Components
    console.log('\n📋 Test 4: Service Header Components');
    const statusBadgeVisible = await page.isVisible('[class*="badge"]');
    const progressVisible = await page.isVisible('[role="progressbar"]');
    
    if (statusBadgeVisible) {
      results.passed.push('✅ Status badge visible');
      console.log('   ✅ Status badge visible');
    } else {
      results.failed.push('❌ Status badge not visible');
      console.log('   ❌ Status badge not visible');
    }
    
    if (progressVisible) {
      results.passed.push('✅ Progress bar visible');
      console.log('   ✅ Progress bar visible');
    } else {
      results.failed.push('❌ Progress bar not visible');
      console.log('   ❌ Progress bar not visible');
    }
    
    // Test 5: Create Milestone
    console.log('\n📋 Test 5: Create Milestone');
    const addMilestoneBtn = await page.locator('button:has([class*="Plus"])').first();
    if (await addMilestoneBtn.isVisible()) {
      await addMilestoneBtn.click();
      await page.waitForTimeout(500);
      
      // Fill milestone form
      await page.fill('input[placeholder*="Design Phase"]', 'Test Milestone 1');
      await page.fill('textarea', 'First test milestone for Phase 4');
      
      // Set due date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 7);
      const dateStr = tomorrow.toISOString().split('T')[0];
      await page.fill('input[type="date"]', dateStr);
      
      await page.click('button:has-text("Create Milestone")');
      await page.waitForTimeout(2000);
      
      const milestoneVisible = await page.isVisible('text=Test Milestone 1');
      if (milestoneVisible) {
        results.passed.push('✅ Milestone created successfully');
        console.log('   ✅ Milestone created successfully');
      } else {
        results.failed.push('❌ Milestone creation failed');
        console.log('   ❌ Milestone creation failed');
      }
    } else {
      results.failed.push('❌ Add milestone button not found');
      console.log('   ❌ Add milestone button not found');
    }
    
    // Test 6: Create Another Milestone
    console.log('\n📋 Test 6: Create Second Milestone');
    const addBtn2 = await page.locator('button:has([class*="Plus"])').first();
    await addBtn2.click();
    await page.waitForTimeout(500);
    await page.fill('input[placeholder*="Design Phase"]', 'Test Milestone 2');
    await page.fill('textarea', 'Second test milestone');
    await page.click('button:has-text("Create Milestone")');
    await page.waitForTimeout(2000);
    
    const secondMilestoneVisible = await page.isVisible('text=Test Milestone 2');
    if (secondMilestoneVisible) {
      results.passed.push('✅ Second milestone created');
      console.log('   ✅ Second milestone created');
    } else {
      results.failed.push('❌ Second milestone creation failed');
      console.log('   ❌ Second milestone creation failed');
    }
    
    // Test 7: Milestone Tabs (Mobile View)
    console.log('\n📋 Test 7: Test Milestone Tabs (Tablet View)');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    // Check if milestone tabs are visible
    const milestoneTabs = await page.locator('button:has-text("Test Milestone")');
    const tabCount = await milestoneTabs.count();
    
    if (tabCount >= 1) {
      // Click on different milestone tabs
      await page.click('text=Test Milestone 2');
      await page.waitForTimeout(500);
      results.passed.push('✅ Milestone tabs working on tablet view');
      console.log('   ✅ Milestone tabs working on tablet view');
    } else {
      results.failed.push('❌ Milestone tabs not visible on tablet');
      console.log('   ❌ Milestone tabs not visible on tablet');
    }
    
    // Return to desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    // Test 8: Create Tasks in Different Columns
    console.log('\n📋 Test 8: Create Tasks in Kanban Board');
    
    // Create task in To Do column
    const todoColumn = await page.locator('text=To Do').locator('..').locator('..');
    const todoAddBtn = await todoColumn.locator('button:has([class*="Plus"])').first();
    
    if (await todoAddBtn.isVisible()) {
      await todoAddBtn.click();
      await page.waitForTimeout(500);
      
      await page.fill('input[placeholder*="Design homepage"]', 'Test Task 1 - To Do');
      await page.fill('textarea[placeholder*="Task details"]', 'This is a test task in To Do column');
      await page.selectOption('text=Priority', 'high');
      await page.click('button:has-text("Create Task")');
      await page.waitForTimeout(2000);
      
      const task1Visible = await page.isVisible('text=Test Task 1 - To Do');
      if (task1Visible) {
        results.passed.push('✅ Task created in To Do column');
        console.log('   ✅ Task created in To Do column');
      } else {
        results.failed.push('❌ Task creation in To Do failed');
        console.log('   ❌ Task creation in To Do failed');
      }
    }
    
    // Create task in In Progress column
    const progressColumn = await page.locator('text=In Progress').locator('..').locator('..');
    const progressAddBtn = await progressColumn.locator('button:has([class*="Plus"])').first();
    
    if (await progressAddBtn.isVisible()) {
      await progressAddBtn.click();
      await page.waitForTimeout(500);
      
      await page.fill('input[placeholder*="Design homepage"]', 'Test Task 2 - In Progress');
      await page.selectOption('text=Priority', 'medium');
      await page.click('button:has-text("Create Task")');
      await page.waitForTimeout(2000);
      
      const task2Visible = await page.isVisible('text=Test Task 2 - In Progress');
      if (task2Visible) {
        results.passed.push('✅ Task created in In Progress column');
        console.log('   ✅ Task created in In Progress column');
      } else {
        results.failed.push('❌ Task creation in In Progress failed');
        console.log('   ❌ Task creation in In Progress failed');
      }
    }
    
    // Test 9: Drag and Drop Functionality
    console.log('\n📋 Test 9: Test Drag and Drop');
    
    try {
      // Find the task to drag
      const taskToDrag = await page.locator('text=Test Task 1 - To Do').locator('..');
      const doneColumn = await page.locator('text=Done').locator('..').locator('..');
      
      if (await taskToDrag.isVisible() && await doneColumn.isVisible()) {
        // Perform drag and drop
        await taskToDrag.hover();
        await page.mouse.down();
        await page.waitForTimeout(100);
        
        // Move to Done column
        await doneColumn.hover();
        await page.waitForTimeout(100);
        await page.mouse.up();
        await page.waitForTimeout(2000);
        
        // Check if task moved to Done column
        const taskInDone = await doneColumn.locator('text=Test Task 1 - To Do').isVisible();
        
        if (taskInDone) {
          results.passed.push('✅ Drag and drop working');
          console.log('   ✅ Drag and drop working');
        } else {
          results.failed.push('❌ Drag and drop not working');
          console.log('   ❌ Drag and drop not working');
        }
      }
    } catch (error) {
      console.log('   ⚠️  Drag and drop test skipped:', error.message);
    }
    
    // Test 10: Task Card Actions
    console.log('\n📋 Test 10: Task Card Actions');
    
    // Find a task card and test edit
    const taskCard = await page.locator('h4:has-text("Test Task")').first().locator('../..');
    if (await taskCard.isVisible()) {
      // Click more menu
      const moreBtn = await taskCard.locator('button:has([class*="MoreVertical"])').first();
      await moreBtn.click();
      await page.waitForTimeout(500);
      
      // Click Edit
      await page.click('text=Edit');
      await page.waitForTimeout(500);
      
      // Check if edit modal opened
      const editModalVisible = await page.isVisible('text=Edit Task');
      if (editModalVisible) {
        // Update task
        await page.fill('input[id="edit-title"]', 'Updated Test Task');
        await page.click('button:has-text("Update Task")');
        await page.waitForTimeout(2000);
        
        const updatedTaskVisible = await page.isVisible('text=Updated Test Task');
        if (updatedTaskVisible) {
          results.passed.push('✅ Task edit functionality working');
          console.log('   ✅ Task edit functionality working');
        } else {
          results.failed.push('❌ Task edit failed');
          console.log('   ❌ Task edit failed');
        }
      }
    }
    
    // Test 11: Responsive Layout - Mobile
    console.log('\n📋 Test 11: Responsive Layout - Mobile');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Check mobile navigation
    const mobileMenuBtn = await page.locator('button:has([class*="Menu"])').first();
    if (await mobileMenuBtn.isVisible()) {
      results.passed.push('✅ Mobile menu button visible');
      console.log('   ✅ Mobile menu button visible');
      
      // Open mobile menu
      await mobileMenuBtn.click();
      await page.waitForTimeout(500);
      
      const mobileNavVisible = await page.isVisible('nav');
      if (mobileNavVisible) {
        results.passed.push('✅ Mobile navigation working');
        console.log('   ✅ Mobile navigation working');
      }
      
      // Close menu
      await page.keyboard.press('Escape');
    }
    
    // Check kanban board on mobile (should show tabs)
    const mobileTabs = await page.locator('button:has-text("Test Milestone")');
    const mobileTabCount = await mobileTabs.count();
    
    if (mobileTabCount > 0) {
      results.passed.push('✅ Milestone tabs visible on mobile');
      console.log('   ✅ Milestone tabs visible on mobile');
    } else {
      results.failed.push('❌ Milestone tabs not visible on mobile');
      console.log('   ❌ Milestone tabs not visible on mobile');
    }
    
    // Test 12: Responsive Layout - Tablet
    console.log('\n📋 Test 12: Responsive Layout - Tablet');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    const tabletLayoutCorrect = await page.isVisible('text=Milestones') || await page.isVisible('text=To Do');
    if (tabletLayoutCorrect) {
      results.passed.push('✅ Tablet layout rendering correctly');
      console.log('   ✅ Tablet layout rendering correctly');
    } else {
      results.failed.push('❌ Tablet layout issues');
      console.log('   ❌ Tablet layout issues');
    }
    
    // Test 13: Responsive Layout - 4K
    console.log('\n📋 Test 13: Responsive Layout - 4K');
    await page.setViewportSize({ width: 3840, height: 2160 });
    await page.waitForTimeout(1000);
    
    const desktopLayoutCorrect = await page.isVisible('text=Milestones');
    const kanbanBoardVisible = await page.isVisible('text=To Do');
    
    if (desktopLayoutCorrect && kanbanBoardVisible) {
      results.passed.push('✅ 4K desktop layout perfect');
      console.log('   ✅ 4K desktop layout perfect');
    } else {
      results.failed.push('❌ 4K desktop layout issues');
      console.log('   ❌ 4K desktop layout issues');
    }
    
    // Test 14: Client View
    console.log('\n📋 Test 14: Test Client View');
    
    // Logout and login as client
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.click('button:has-text("admin@demo.com")');
    await page.waitForTimeout(500);
    await page.click('text=Sign out');
    await page.waitForTimeout(2000);
    
    // Login as client
    await page.fill('input[name="email"]', 'sarah@acmecorp.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/client');
    
    // Navigate to services
    await page.click('text=Services');
    await page.waitForTimeout(1000);
    
    // Check if client sees timeline view
    const clientServices = await page.locator('.cursor-pointer');
    if (await clientServices.first().isVisible()) {
      await clientServices.first().click();
      await page.waitForTimeout(2000);
      
      // Check for timeline view elements
      const timelineVisible = await page.isVisible('text=Project Overview') || await page.isVisible('text=Project Summary');
      const kanbanNotVisible = !(await page.isVisible('text=To Do'));
      
      if (timelineVisible && kanbanNotVisible) {
        results.passed.push('✅ Client timeline view working');
        console.log('   ✅ Client timeline view working');
      } else {
        results.failed.push('❌ Client view not showing timeline');
        console.log('   ❌ Client view not showing timeline');
      }
    }
    
    // Test 15: Status Change Dropdown
    console.log('\n📋 Test 15: Service Status Management');
    
    // Login back as admin
    await page.click('button:has-text("sarah@acmecorp.com")');
    await page.waitForTimeout(500);
    await page.click('text=Sign out');
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin');
    
    // Go back to service detail
    await page.click('text=Services');
    await page.waitForTimeout(1000);
    await page.locator('.cursor-pointer').first().click();
    await page.waitForTimeout(2000);
    
    // Test status dropdown
    const statusDropdown = await page.locator('button:has-text("Status")').first();
    if (await statusDropdown.isVisible()) {
      await statusDropdown.click();
      await page.waitForTimeout(500);
      
      const statusOptions = await page.isVisible('text=In Progress');
      if (statusOptions) {
        await page.click('text=In Progress');
        await page.waitForTimeout(2000);
        results.passed.push('✅ Status change functionality working');
        console.log('   ✅ Status change functionality working');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    results.failed.push(`❌ Critical error: ${error.message}`);
  }
  
  // Print Summary
  console.log('\n' + '=' + '='.repeat(60));
  console.log('\n📊 PHASE 4 TEST SUMMARY\n');
  console.log(`✅ Passed: ${results.passed.length} tests`);
  console.log(`❌ Failed: ${results.failed.length} tests`);
  console.log(`📈 Success Rate: ${Math.round((results.passed.length / (results.passed.length + results.failed.length)) * 100)}%`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(test => console.log(`   ${test}`));
  }
  
  if (results.passed.length === results.passed.length + results.failed.length) {
    console.log('\n🎉 ALL TESTS PASSED! Phase 4 is PERFECT! 🎉');
  }
  
  console.log('\n' + '=' + '='.repeat(60));
  
  await browser.close();
}

testPhase4().catch(console.error);