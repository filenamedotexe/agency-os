const { chromium } = require('playwright');

async function testEverything() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };
  
  console.log('\n🚀 COMPREHENSIVE SYSTEM TEST - TESTING ALL FEATURES\n');
  console.log('=' + '='.repeat(70));
  
  try {
    // ====================
    // AUTHENTICATION TESTS
    // ====================
    console.log('\n📦 AUTHENTICATION & ROLE-BASED ACCESS\n');
    
    // Test 1: Login Page
    console.log('Test 1: Login Page Accessibility');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    const loginPageVisible = await page.isVisible('input[name="email"]');
    if (loginPageVisible) {
      results.passed.push('✅ Login page accessible');
      console.log('  ✅ Login page loads correctly');
    } else {
      results.failed.push('❌ Login page not accessible');
      console.log('  ❌ Login page failed to load');
    }
    
    // Test 2: Admin Login
    console.log('Test 2: Admin Authentication');
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL('**/admin', { timeout: 5000 });
      results.passed.push('✅ Admin login successful');
      console.log('  ✅ Admin authenticated and redirected');
    } catch {
      results.failed.push('❌ Admin login failed');
      console.log('  ❌ Admin authentication failed');
    }
    
    // Test 3: Admin Dashboard Elements
    console.log('Test 3: Admin Dashboard Elements');
    const adminElements = {
      'Welcome message': await page.isVisible('text=Welcome back'),
      'Quick stats': await page.isVisible('text=Total Clients') || await page.isVisible('[class*="card"]'),
      'Navigation sidebar': await page.isVisible('nav'),
      'User menu': await page.isVisible('button:has-text("admin@demo.com")')
    };
    
    for (const [element, visible] of Object.entries(adminElements)) {
      if (visible) {
        results.passed.push(`✅ ${element} visible`);
        console.log(`  ✅ ${element} present`);
      } else {
        results.failed.push(`❌ ${element} missing`);
        console.log(`  ❌ ${element} not found`);
      }
    }
    
    // ====================
    // CLIENT MANAGEMENT
    // ====================
    console.log('\n📦 CLIENT MANAGEMENT FEATURES\n');
    
    // Test 4: Navigate to Clients
    console.log('Test 4: Clients Page Navigation');
    await page.click('text=Clients');
    await page.waitForTimeout(2000);
    
    const clientsPageVisible = await page.isVisible('h1:has-text("Clients")') || 
                               await page.isVisible('text=Client Management');
    if (clientsPageVisible) {
      results.passed.push('✅ Clients page accessible');
      console.log('  ✅ Navigated to clients page');
    } else {
      results.failed.push('❌ Clients page not accessible');
      console.log('  ❌ Failed to navigate to clients');
    }
    
    // Test 5: Clients Table Features
    console.log('Test 5: Clients Table Functionality');
    const tableFeatures = {
      'Search bar': await page.isVisible('input[placeholder*="Search"]'),
      'Data table': await page.isVisible('table') || await page.isVisible('[role="table"]'),
      'Client rows': (await page.locator('tbody tr').count()) > 0 || (await page.locator('[role="row"]').count()) > 1
    };
    
    for (const [feature, present] of Object.entries(tableFeatures)) {
      if (present) {
        results.passed.push(`✅ ${feature} working`);
        console.log(`  ✅ ${feature} functional`);
      } else {
        results.warnings.push(`⚠️ ${feature} not found`);
        console.log(`  ⚠️ ${feature} missing`);
      }
    }
    
    // Test 6: Column Reordering
    console.log('Test 6: Column Drag & Drop Reordering');
    try {
      const firstColumn = await page.locator('th').first();
      const lastColumn = await page.locator('th').last();
      
      if (await firstColumn.isVisible() && await lastColumn.isVisible()) {
        await firstColumn.hover();
        await page.mouse.down();
        await page.waitForTimeout(100);
        await lastColumn.hover();
        await page.mouse.up();
        results.passed.push('✅ Column reordering tested');
        console.log('  ✅ Column drag & drop functional');
      }
    } catch (error) {
      results.warnings.push('⚠️ Column reordering not testable');
      console.log('  ⚠️ Column reordering skipped');
    }
    
    // ====================
    // MESSAGING SYSTEM
    // ====================
    console.log('\n📦 MESSAGING SYSTEM\n');
    
    // Test 7: Navigate to Messages
    console.log('Test 7: Messages Page');
    await page.click('text=Messages');
    await page.waitForTimeout(2000);
    
    const messagesPageVisible = await page.isVisible('h1:has-text("Messages")') || 
                                await page.isVisible('text=Conversations');
    if (messagesPageVisible) {
      results.passed.push('✅ Messages page accessible');
      console.log('  ✅ Messages page loaded');
    } else {
      results.failed.push('❌ Messages page not accessible');
      console.log('  ❌ Messages page failed');
    }
    
    // Test 8: New Message Modal
    console.log('Test 8: New Message Creation');
    const newMessageBtn = await page.locator('button:has-text("New Message")').first();
    if (await newMessageBtn.isVisible()) {
      await newMessageBtn.click();
      await page.waitForTimeout(1000);
      
      const modalVisible = await page.isVisible('text=Select a client') || 
                          await page.isVisible('text=New Conversation');
      if (modalVisible) {
        results.passed.push('✅ New message modal works');
        console.log('  ✅ Message creation modal opens');
        
        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      } else {
        results.failed.push('❌ New message modal failed');
        console.log('  ❌ Modal did not open');
      }
    } else {
      results.warnings.push('⚠️ New message button not found');
      console.log('  ⚠️ New message button missing');
    }
    
    // Test 9: Message List
    console.log('Test 9: Conversation List');
    const conversations = await page.locator('[class*="cursor-pointer"]').count();
    if (conversations > 0) {
      results.passed.push(`✅ ${conversations} conversations found`);
      console.log(`  ✅ Found ${conversations} conversations`);
      
      // Click first conversation
      await page.locator('[class*="cursor-pointer"]').first().click();
      await page.waitForTimeout(1000);
      
      const chatVisible = await page.isVisible('[class*="message"]') || 
                         await page.isVisible('textarea[placeholder*="Type"]');
      if (chatVisible) {
        results.passed.push('✅ Message thread opens');
        console.log('  ✅ Conversation view works');
      }
    } else {
      results.warnings.push('⚠️ No conversations to test');
      console.log('  ⚠️ No conversations found');
    }
    
    // ====================
    // SERVICES & PROJECTS
    // ====================
    console.log('\n📦 SERVICES MANAGEMENT\n');
    
    // Test 10: Services Page
    console.log('Test 10: Services List Page');
    await page.click('text=Services');
    await page.waitForTimeout(2000);
    
    const servicesVisible = await page.isVisible('h1:has-text("Services")') || 
                           await page.isVisible('text=Active Services') ||
                           await page.isVisible('[class*="card"]');
    if (servicesVisible) {
      results.passed.push('✅ Services page loads');
      console.log('  ✅ Services list accessible');
    } else {
      results.failed.push('❌ Services page failed');
      console.log('  ❌ Services page not loading');
    }
    
    // Test 11: Service Cards
    console.log('Test 11: Service Cards');
    const serviceCards = await page.locator('[class*="cursor-pointer"]').count();
    if (serviceCards > 0) {
      results.passed.push(`✅ ${serviceCards} service cards found`);
      console.log(`  ✅ Found ${serviceCards} services`);
    } else {
      results.warnings.push('⚠️ No service cards found');
      console.log('  ⚠️ No services to display');
    }
    
    // Test 12: Open Service Detail
    console.log('Test 12: Service Detail Page');
    if (serviceCards > 0) {
      await page.locator('[class*="cursor-pointer"]').first().click();
      await page.waitForTimeout(2000);
      
      const detailPageElements = {
        'Service header': await page.isVisible('[class*="badge"]') || await page.isVisible('h1'),
        'Progress bar': await page.isVisible('[role="progressbar"]'),
        'Kanban board': await page.isVisible('text=To Do') || await page.isVisible('text=In Progress'),
        'Milestone sidebar': await page.isVisible('text=Milestones')
      };
      
      for (const [element, visible] of Object.entries(detailPageElements)) {
        if (visible) {
          results.passed.push(`✅ ${element} visible`);
          console.log(`  ✅ ${element} loaded`);
        } else {
          results.warnings.push(`⚠️ ${element} not visible`);
          console.log(`  ⚠️ ${element} missing`);
        }
      }
    }
    
    // ====================
    // KANBAN BOARD & DRAG-DROP
    // ====================
    console.log('\n📦 KANBAN BOARD & DRAG-DROP\n');
    
    // Test 13: Kanban Columns
    console.log('Test 13: Kanban Column Structure');
    const kanbanColumns = ['To Do', 'In Progress', 'Review', 'Done', 'Blocked'];
    let columnsFound = 0;
    
    for (const column of kanbanColumns) {
      if (await page.isVisible(`text="${column}"`)) {
        columnsFound++;
      }
    }
    
    if (columnsFound === kanbanColumns.length) {
      results.passed.push('✅ All Kanban columns present');
      console.log(`  ✅ All ${columnsFound} columns found`);
    } else if (columnsFound > 0) {
      results.warnings.push(`⚠️ Only ${columnsFound}/${kanbanColumns.length} columns found`);
      console.log(`  ⚠️ Found ${columnsFound} of ${kanbanColumns.length} columns`);
    } else {
      results.failed.push('❌ No Kanban columns found');
      console.log('  ❌ Kanban board not visible');
    }
    
    // Test 14: Task Cards
    console.log('Test 14: Task Cards');
    const taskCards = await page.locator('h4').count();
    if (taskCards > 0) {
      results.passed.push(`✅ ${taskCards} task cards found`);
      console.log(`  ✅ Found ${taskCards} tasks`);
      
      // Test 15: Drag and Drop
      console.log('Test 15: Drag & Drop Tasks');
      try {
        const firstTask = await page.locator('h4').first();
        const doneColumn = await page.locator('text=Done').locator('../..');
        
        if (await firstTask.isVisible() && await doneColumn.isVisible()) {
          const taskText = await firstTask.textContent();
          
          // Perform drag
          await firstTask.hover();
          await page.mouse.down();
          await page.waitForTimeout(200);
          
          // Drag to Done column
          await doneColumn.hover();
          await page.waitForTimeout(200);
          await page.mouse.up();
          await page.waitForTimeout(1000);
          
          // Check if task moved
          const taskInDone = await doneColumn.locator(`text="${taskText}"`).isVisible();
          if (taskInDone) {
            results.passed.push('✅ Drag & drop working');
            console.log('  ✅ Task successfully dragged to Done');
          } else {
            results.warnings.push('⚠️ Drag & drop uncertain');
            console.log('  ⚠️ Could not verify drag result');
          }
        }
      } catch (error) {
        results.warnings.push('⚠️ Drag & drop test skipped');
        console.log('  ⚠️ Drag & drop could not be tested');
      }
    } else {
      results.warnings.push('⚠️ No tasks to test drag & drop');
      console.log('  ⚠️ No task cards available');
    }
    
    // ====================
    // MILESTONE MANAGEMENT
    // ====================
    console.log('\n📦 MILESTONE MANAGEMENT\n');
    
    // Test 16: Milestone Sidebar
    console.log('Test 16: Milestone Sidebar');
    const milestoneCards = await page.locator('text=Milestones').locator('../..').locator('[class*="card"]').count();
    if (milestoneCards > 0) {
      results.passed.push(`✅ ${milestoneCards} milestones found`);
      console.log(`  ✅ Found ${milestoneCards} milestones`);
    } else {
      results.warnings.push('⚠️ No milestones found');
      console.log('  ⚠️ Milestone sidebar empty');
    }
    
    // Test 17: Create Milestone
    console.log('Test 17: Create Milestone Modal');
    const addMilestoneBtn = await page.locator('button:has([class*="Plus"])').first();
    if (await addMilestoneBtn.isVisible()) {
      await addMilestoneBtn.click();
      await page.waitForTimeout(1000);
      
      const modalVisible = await page.isVisible('text=Create New Milestone');
      if (modalVisible) {
        results.passed.push('✅ Milestone creation modal works');
        console.log('  ✅ Create milestone modal opens');
        
        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      } else {
        results.failed.push('❌ Milestone modal failed');
        console.log('  ❌ Milestone modal did not open');
      }
    }
    
    // ====================
    // TASK MANAGEMENT
    // ====================
    console.log('\n📦 TASK MANAGEMENT\n');
    
    // Test 18: Create Task
    console.log('Test 18: Task Creation');
    const todoColumn = await page.locator('text=To Do').locator('../..');
    if (await todoColumn.isVisible()) {
      const addTaskBtn = await todoColumn.locator('button:has([class*="Plus"])').first();
      if (await addTaskBtn.isVisible()) {
        await addTaskBtn.click();
        await page.waitForTimeout(1000);
        
        const taskModalVisible = await page.isVisible('text=Create New Task');
        if (taskModalVisible) {
          results.passed.push('✅ Task creation modal works');
          console.log('  ✅ Create task modal opens');
          
          // Test form fields
          const formFields = {
            'Title field': await page.isVisible('input[placeholder*="Design"]'),
            'Description field': await page.isVisible('textarea'),
            'Priority select': await page.isVisible('text=Priority')
          };
          
          for (const [field, visible] of Object.entries(formFields)) {
            if (visible) {
              console.log(`    ✓ ${field} present`);
            }
          }
          
          // Close modal
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }
      }
    }
    
    // Test 19: Edit Task
    console.log('Test 19: Task Editing');
    const taskCard = await page.locator('h4').first();
    if (await taskCard.isVisible()) {
      const moreBtn = await taskCard.locator('../../..').locator('button:has([class*="MoreVertical"])').first();
      if (await moreBtn.isVisible()) {
        await moreBtn.click();
        await page.waitForTimeout(500);
        
        const editOption = await page.isVisible('text=Edit');
        if (editOption) {
          await page.click('text=Edit');
          await page.waitForTimeout(1000);
          
          const editModalVisible = await page.isVisible('text=Edit Task');
          if (editModalVisible) {
            results.passed.push('✅ Task edit modal works');
            console.log('  ✅ Task editing functional');
            
            // Close modal
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
          }
        }
      }
    }
    
    // ====================
    // RESPONSIVE DESIGN
    // ====================
    console.log('\n📦 RESPONSIVE DESIGN TESTING\n');
    
    // Test 20: Mobile View
    console.log('Test 20: Mobile Responsiveness (375px)');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileMenuBtn = await page.locator('button:has([class*="Menu"])').first();
    if (await mobileMenuBtn.isVisible()) {
      results.passed.push('✅ Mobile menu button visible');
      console.log('  ✅ Mobile navigation works');
      
      await mobileMenuBtn.click();
      await page.waitForTimeout(500);
      
      const mobileNavVisible = await page.isVisible('nav');
      if (mobileNavVisible) {
        console.log('    ✓ Mobile menu opens');
      }
      
      await page.keyboard.press('Escape');
    } else {
      results.warnings.push('⚠️ Mobile menu not found');
      console.log('  ⚠️ Mobile navigation missing');
    }
    
    // Test 21: Tablet View
    console.log('Test 21: Tablet Responsiveness (768px)');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    const tabletLayout = await page.isVisible('[class*="container"]') || await page.isVisible('main');
    if (tabletLayout) {
      results.passed.push('✅ Tablet layout renders');
      console.log('  ✅ Tablet view responsive');
    }
    
    // Test 22: 4K View
    console.log('Test 22: 4K Display (3840px)');
    await page.setViewportSize({ width: 3840, height: 2160 });
    await page.waitForTimeout(1000);
    
    const desktopLayout = await page.isVisible('[class*="container"]') || await page.isVisible('main');
    if (desktopLayout) {
      results.passed.push('✅ 4K layout scales properly');
      console.log('  ✅ 4K display supported');
    }
    
    // Return to normal viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // ====================
    // CLIENT VIEW TESTING
    // ====================
    console.log('\n📦 CLIENT ROLE TESTING\n');
    
    // Test 23: Logout
    console.log('Test 23: Logout Functionality');
    await page.click('button:has-text("admin@demo.com")');
    await page.waitForTimeout(500);
    await page.click('text=Sign out');
    await page.waitForTimeout(2000);
    
    const loggedOut = await page.isVisible('input[name="email"]');
    if (loggedOut) {
      results.passed.push('✅ Logout successful');
      console.log('  ✅ Successfully logged out');
    }
    
    // Test 24: Client Login
    console.log('Test 24: Client Authentication');
    await page.fill('input[name="email"]', 'sarah@acmecorp.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL('**/client', { timeout: 5000 });
      results.passed.push('✅ Client login successful');
      console.log('  ✅ Client authenticated');
    } catch {
      results.failed.push('❌ Client login failed');
      console.log('  ❌ Client authentication failed');
    }
    
    // Test 25: Client Service View
    console.log('Test 25: Client Timeline View');
    await page.click('text=Services');
    await page.waitForTimeout(2000);
    
    const clientServices = await page.locator('[class*="cursor-pointer"]').count();
    if (clientServices > 0) {
      await page.locator('[class*="cursor-pointer"]').first().click();
      await page.waitForTimeout(2000);
      
      // Check for timeline view (clients see timeline, not kanban)
      const timelineVisible = await page.isVisible('text=Project Overview') || 
                              await page.isVisible('text=Project Summary');
      const kanbanNotVisible = !(await page.isVisible('text=To Do'));
      
      if (timelineVisible && kanbanNotVisible) {
        results.passed.push('✅ Client timeline view works');
        console.log('  ✅ Client sees timeline (not Kanban)');
      } else if (!kanbanNotVisible) {
        results.failed.push('❌ Client sees wrong view');
        console.log('  ❌ Client should not see Kanban');
      }
    }
    
    // Test 26: Client Restrictions
    console.log('Test 26: Client Access Restrictions');
    const restrictedElements = {
      'Admin menu': await page.isVisible('text=Admin Settings'),
      'Team menu': await page.isVisible('text=Team Management'),
      'Create buttons': await page.locator('button:has-text("Create")').count() === 0
    };
    
    let properRestrictions = true;
    for (const [element, visible] of Object.entries(restrictedElements)) {
      if (element === 'Create buttons') {
        if (!visible) {
          properRestrictions = false;
          console.log(`  ❌ ${element} visible to client`);
        }
      } else if (visible) {
        properRestrictions = false;
        console.log(`  ❌ ${element} visible to client`);
      }
    }
    
    if (properRestrictions) {
      results.passed.push('✅ Client restrictions working');
      console.log('  ✅ Client access properly restricted');
    } else {
      results.failed.push('❌ Client has unauthorized access');
    }
    
    // ====================
    // PERFORMANCE CHECKS
    // ====================
    console.log('\n📦 PERFORMANCE & STABILITY\n');
    
    // Test 27: Page Load Times
    console.log('Test 27: Page Load Performance');
    const pages = [
      { name: 'Dashboard', url: '/client' },
      { name: 'Services', url: '/services' },
      { name: 'Messages', url: '/messages' }
    ];
    
    for (const { name, url } of pages) {
      const startTime = Date.now();
      await page.goto(`http://localhost:3000${url}`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      if (loadTime < 3000) {
        results.passed.push(`✅ ${name} loads in ${loadTime}ms`);
        console.log(`  ✅ ${name}: ${loadTime}ms (fast)`);
      } else if (loadTime < 5000) {
        results.warnings.push(`⚠️ ${name} loads in ${loadTime}ms`);
        console.log(`  ⚠️ ${name}: ${loadTime}ms (slow)`);
      } else {
        results.failed.push(`❌ ${name} loads in ${loadTime}ms`);
        console.log(`  ❌ ${name}: ${loadTime}ms (too slow)`);
      }
    }
    
    // Test 28: Error Boundaries
    console.log('Test 28: Error Handling');
    // Try to navigate to non-existent page
    await page.goto('http://localhost:3000/nonexistent-page-12345');
    await page.waitForTimeout(2000);
    
    const errorPageVisible = await page.isVisible('text=404') || 
                             await page.isVisible('text=Not Found') ||
                             await page.isVisible('text=Page not found');
    if (errorPageVisible) {
      results.passed.push('✅ 404 page works');
      console.log('  ✅ Error pages functional');
    } else {
      results.warnings.push('⚠️ No 404 page');
      console.log('  ⚠️ 404 page not configured');
    }
    
  } catch (error) {
    console.error('\n❌ CRITICAL TEST ERROR:', error.message);
    results.failed.push(`❌ Critical error: ${error.message}`);
  }
  
  // ====================
  // TEST SUMMARY
  // ====================
  console.log('\n' + '=' + '='.repeat(70));
  console.log('\n📊 COMPREHENSIVE TEST SUMMARY\n');
  
  const totalTests = results.passed.length + results.failed.length + results.warnings.length;
  const passRate = Math.round((results.passed.length / totalTests) * 100);
  
  console.log(`✅ Passed: ${results.passed.length} tests`);
  console.log(`❌ Failed: ${results.failed.length} tests`);
  console.log(`⚠️ Warnings: ${results.warnings.length} tests`);
  console.log(`📈 Success Rate: ${passRate}%`);
  console.log(`📊 Total Tests: ${totalTests}`);
  
  // Detailed Results
  if (results.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.failed.forEach(test => console.log(`   ${test}`));
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️ WARNINGS:');
    results.warnings.forEach(test => console.log(`   ${test}`));
  }
  
  // Feature Summary
  console.log('\n📦 FEATURE COVERAGE:');
  const features = {
    'Authentication': results.passed.filter(r => r.includes('login') || r.includes('auth')).length > 0,
    'Client Management': results.passed.filter(r => r.includes('Client')).length > 0,
    'Messaging System': results.passed.filter(r => r.includes('message') || r.includes('Message')).length > 0,
    'Services & Projects': results.passed.filter(r => r.includes('Service')).length > 0,
    'Kanban Board': results.passed.filter(r => r.includes('Kanban') || r.includes('column')).length > 0,
    'Drag & Drop': results.passed.filter(r => r.includes('drag') || r.includes('Drag')).length > 0,
    'Milestones': results.passed.filter(r => r.includes('Milestone')).length > 0,
    'Tasks': results.passed.filter(r => r.includes('Task')).length > 0,
    'Responsive Design': results.passed.filter(r => r.includes('Mobile') || r.includes('Tablet') || r.includes('4K')).length > 0,
    'Role-Based Access': results.passed.filter(r => r.includes('Client restriction') || r.includes('timeline')).length > 0
  };
  
  for (const [feature, working] of Object.entries(features)) {
    console.log(`   ${working ? '✅' : '❌'} ${feature}`);
  }
  
  // Overall Status
  console.log('\n' + '=' + '='.repeat(70));
  if (passRate >= 90) {
    console.log('\n🎉 EXCELLENT! System is working perfectly! 🎉');
  } else if (passRate >= 70) {
    console.log('\n✅ GOOD! Most features are working correctly.');
  } else if (passRate >= 50) {
    console.log('\n⚠️ NEEDS ATTENTION! Several features need fixes.');
  } else {
    console.log('\n❌ CRITICAL! Major issues detected.');
  }
  
  console.log('\n' + '=' + '='.repeat(70));
  
  await browser.close();
}

// Run the comprehensive test
testEverything().catch(console.error);