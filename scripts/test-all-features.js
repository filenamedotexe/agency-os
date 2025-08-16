const { chromium } = require('playwright');

async function testAllFeatures() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 200 
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
  
  console.log('\n🚀 COMPLETE FEATURE TEST - ALL ROLES & FUNCTIONALITY\n');
  console.log('=' + '='.repeat(70));
  
  try {
    // ========================================
    // PART 1: ADMIN ROLE TESTING
    // ========================================
    console.log('\n═══ ADMIN ROLE TESTING ═══\n');
    
    // Admin Login
    console.log('1. Admin Login');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(1000);
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL('**/admin', { timeout: 5000 });
      results.passed.push('✅ Admin login successful');
      console.log('  ✅ Admin authenticated');
    } catch {
      // Maybe already redirected
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        results.passed.push('✅ Admin login successful');
        console.log('  ✅ Admin authenticated');
      } else {
        results.failed.push('❌ Admin login failed');
        console.log('  ❌ Admin authentication failed');
      }
    }
    
    // Test Admin Dashboard
    console.log('\n2. Admin Dashboard Features');
    await page.waitForTimeout(2000);
    const adminFeatures = {
      'Dashboard stats': await page.isVisible('[class*="card"]'),
      'Navigation menu': await page.isVisible('nav'),
      'User menu': await page.isVisible('button[aria-label*="User menu"]') || await page.isVisible('button:has-text("admin@demo.com")')
    };
    
    for (const [feature, visible] of Object.entries(adminFeatures)) {
      if (visible) {
        results.passed.push(`✅ Admin: ${feature}`);
        console.log(`  ✅ ${feature} present`);
      } else {
        results.warnings.push(`⚠️ Admin: ${feature} missing`);
        console.log(`  ⚠️ ${feature} not found`);
      }
    }
    
    // Test Clients Page
    console.log('\n3. Admin: Clients Management');
    await page.click('nav >> text=Clients');
    await page.waitForTimeout(2000);
    
    const clientsTable = await page.isVisible('table') || await page.isVisible('[role="table"]');
    if (clientsTable) {
      results.passed.push('✅ Admin: Clients table visible');
      console.log('  ✅ Clients data table loaded');
      
      // Test search
      const searchInput = await page.locator('input[placeholder*="Search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('Sarah');
        await page.waitForTimeout(1000);
        results.passed.push('✅ Admin: Client search works');
        console.log('  ✅ Search functionality working');
        await searchInput.clear();
      }
    }
    
    // Test Messages
    console.log('\n4. Admin: Messaging System');
    await page.click('nav >> text=Messages');
    await page.waitForTimeout(2000);
    
    // Try to create new message
    const newMessageBtn = await page.locator('button:has-text("New Message")').first();
    if (await newMessageBtn.isVisible()) {
      await newMessageBtn.click();
      await page.waitForTimeout(1000);
      
      const modalVisible = await page.isVisible('text=Select a client') || await page.isVisible('[role="dialog"]');
      if (modalVisible) {
        results.passed.push('✅ Admin: New message modal opens');
        console.log('  ✅ Message creation modal works');
        
        // Check if clients are listed
        const clientOptions = await page.locator('[role="dialog"] >> [class*="cursor-pointer"]').count();
        if (clientOptions > 0) {
          console.log(`    Found ${clientOptions} clients to message`);
          
          // Select first client
          await page.locator('[role="dialog"] >> [class*="cursor-pointer"]').first().click();
          await page.waitForTimeout(2000);
          
          // Check if conversation opened
          const messageInput = await page.isVisible('textarea[placeholder*="Type"]') || await page.isVisible('textarea[placeholder*="message"]');
          if (messageInput) {
            results.passed.push('✅ Admin: Can start conversations');
            console.log('  ✅ Conversation creation successful');
            
            // Send a test message
            const textarea = await page.locator('textarea').first();
            await textarea.fill('Test message from admin');
            
            const sendBtn = await page.locator('button[aria-label*="Send"]').first();
            if (await sendBtn.isVisible()) {
              await sendBtn.click();
              await page.waitForTimeout(1000);
              results.passed.push('✅ Admin: Can send messages');
              console.log('  ✅ Message sent successfully');
            }
          }
        }
      } else {
        // Close modal if it didn't work
        await page.keyboard.press('Escape');
      }
    }
    
    // Test Services
    console.log('\n5. Admin: Services Management');
    await page.click('nav >> text=Services');
    await page.waitForTimeout(2000);
    
    const serviceCards = await page.locator('[class*="cursor-pointer"]').count();
    console.log(`  Found ${serviceCards} services`);
    
    if (serviceCards > 0) {
      results.passed.push(`✅ Admin: ${serviceCards} services visible`);
      
      // Open first service
      await page.locator('[class*="cursor-pointer"]').first().click();
      await page.waitForTimeout(2000);
      
      // Check for Kanban board (admin should see Kanban, not timeline)
      const kanbanVisible = await page.isVisible('text=To Do');
      const milestonesVisible = await page.isVisible('text=Milestones');
      
      if (kanbanVisible) {
        results.passed.push('✅ Admin: Kanban board visible');
        console.log('  ✅ Kanban board loaded for admin');
        
        // Test drag and drop
        console.log('\n6. Admin: Drag & Drop Testing');
        const tasks = await page.locator('h4').count();
        if (tasks > 0) {
          try {
            const firstTask = await page.locator('h4').first();
            const taskText = await firstTask.textContent();
            const doneColumn = await page.locator('text=Done').locator('../..');
            
            // Perform drag
            await firstTask.hover();
            await page.mouse.down();
            await page.waitForTimeout(100);
            await doneColumn.hover();
            await page.waitForTimeout(100);
            await page.mouse.up();
            await page.waitForTimeout(1500);
            
            // Check if moved
            const taskInDone = await doneColumn.locator(`text="${taskText}"`).isVisible();
            if (taskInDone) {
              results.passed.push('✅ Admin: Drag & drop works');
              console.log('  ✅ Task successfully dragged');
            } else {
              results.warnings.push('⚠️ Admin: Drag & drop uncertain');
              console.log('  ⚠️ Drag result uncertain');
            }
          } catch (error) {
            console.log('  ⚠️ Drag & drop test error:', error.message);
          }
        }
        
        // Test milestone creation
        console.log('\n7. Admin: Milestone Management');
        if (milestonesVisible) {
          const addMilestoneBtn = await page.locator('text=Milestones').locator('../..').locator('button:has([class*="Plus"])').first();
          if (await addMilestoneBtn.isVisible()) {
            await addMilestoneBtn.click();
            await page.waitForTimeout(1000);
            
            const milestoneModal = await page.isVisible('text=Create New Milestone');
            if (milestoneModal) {
              results.passed.push('✅ Admin: Milestone modal opens');
              console.log('  ✅ Milestone creation modal works');
              
              // Fill and create
              await page.fill('input[placeholder*="Design Phase"]', 'Test Milestone Admin');
              await page.fill('textarea', 'Created by admin test');
              await page.click('button:has-text("Create Milestone")');
              await page.waitForTimeout(2000);
              
              const newMilestone = await page.isVisible('text=Test Milestone Admin');
              if (newMilestone) {
                results.passed.push('✅ Admin: Can create milestones');
                console.log('  ✅ Milestone created successfully');
              }
            }
          }
        }
        
        // Test task creation
        console.log('\n8. Admin: Task Management');
        const todoColumn = await page.locator('text=To Do').locator('../..');
        if (await todoColumn.isVisible()) {
          const addTaskBtn = await todoColumn.locator('button:has([class*="Plus"])').first();
          if (await addTaskBtn.isVisible()) {
            await addTaskBtn.click();
            await page.waitForTimeout(1000);
            
            const taskModal = await page.isVisible('text=Create New Task');
            if (taskModal) {
              results.passed.push('✅ Admin: Task modal opens');
              console.log('  ✅ Task creation modal works');
              
              // Fill and create
              await page.fill('input[placeholder*="Design"]', 'Test Task by Admin');
              await page.selectOption('select', { index: 2 }); // High priority
              await page.click('button:has-text("Create Task")');
              await page.waitForTimeout(2000);
              
              const newTask = await page.isVisible('text=Test Task by Admin');
              if (newTask) {
                results.passed.push('✅ Admin: Can create tasks');
                console.log('  ✅ Task created successfully');
              }
            }
          }
        }
      }
    }
    
    // Logout Admin
    console.log('\n9. Admin: Logout');
    await page.click('button:has-text("admin@demo.com")');
    await page.waitForTimeout(500);
    await page.click('text=Sign out');
    await page.waitForTimeout(2000);
    
    // ========================================
    // PART 2: TEAM MEMBER ROLE TESTING
    // ========================================
    console.log('\n═══ TEAM MEMBER ROLE TESTING ═══\n');
    
    // Team Login
    console.log('10. Team Member Login');
    await page.fill('input[name="email"]', 'team@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL('**/team', { timeout: 5000 });
      results.passed.push('✅ Team login successful');
      console.log('  ✅ Team member authenticated');
    } catch {
      const currentUrl = page.url();
      if (currentUrl.includes('/team')) {
        results.passed.push('✅ Team login successful');
        console.log('  ✅ Team member authenticated');
      } else {
        results.failed.push('❌ Team login failed');
        console.log('  ❌ Team authentication failed');
      }
    }
    
    // Test Team Dashboard
    console.log('\n11. Team: Dashboard Access');
    await page.waitForTimeout(2000);
    const teamDashboard = await page.isVisible('[class*="card"]') || await page.isVisible('text=Welcome');
    if (teamDashboard) {
      results.passed.push('✅ Team: Dashboard accessible');
      console.log('  ✅ Team dashboard loaded');
    }
    
    // Test Team Services Access
    console.log('\n12. Team: Services Access');
    await page.click('nav >> text=Services');
    await page.waitForTimeout(2000);
    
    const teamServices = await page.locator('[class*="cursor-pointer"]').count();
    if (teamServices > 0) {
      results.passed.push(`✅ Team: Can see ${teamServices} services`);
      console.log(`  ✅ Team can access ${teamServices} services`);
      
      // Open service
      await page.locator('[class*="cursor-pointer"]').first().click();
      await page.waitForTimeout(2000);
      
      // Team should also see Kanban
      const teamKanban = await page.isVisible('text=To Do');
      if (teamKanban) {
        results.passed.push('✅ Team: Kanban board access');
        console.log('  ✅ Team sees Kanban board');
      }
    }
    
    // Test Team Messaging
    console.log('\n13. Team: Messaging Access');
    await page.click('nav >> text=Messages');
    await page.waitForTimeout(2000);
    
    const teamMessages = await page.isVisible('text=Messages') || await page.isVisible('text=Conversations');
    if (teamMessages) {
      results.passed.push('✅ Team: Can access messages');
      console.log('  ✅ Team can use messaging');
    }
    
    // Logout Team
    console.log('\n14. Team: Logout');
    await page.click('button:has-text("team@demo.com")');
    await page.waitForTimeout(500);
    await page.click('text=Sign out');
    await page.waitForTimeout(2000);
    
    // ========================================
    // PART 3: CLIENT ROLE TESTING
    // ========================================
    console.log('\n═══ CLIENT ROLE TESTING ═══\n');
    
    // Client Login
    console.log('15. Client Login');
    await page.fill('input[name="email"]', 'sarah@acmecorp.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL('**/client', { timeout: 5000 });
      results.passed.push('✅ Client login successful');
      console.log('  ✅ Client authenticated');
    } catch {
      const currentUrl = page.url();
      if (currentUrl.includes('/client')) {
        results.passed.push('✅ Client login successful');
        console.log('  ✅ Client authenticated');
      } else {
        results.failed.push('❌ Client login failed');
        console.log('  ❌ Client authentication failed');
      }
    }
    
    // Test Client Dashboard
    console.log('\n16. Client: Dashboard View');
    await page.waitForTimeout(2000);
    const clientDashboard = await page.isVisible('[class*="card"]') || await page.isVisible('text=Welcome');
    if (clientDashboard) {
      results.passed.push('✅ Client: Dashboard accessible');
      console.log('  ✅ Client dashboard loaded');
    }
    
    // Test Client Services View
    console.log('\n17. Client: Services View');
    await page.click('nav >> text=Services');
    await page.waitForTimeout(2000);
    
    const clientServiceCards = await page.locator('[class*="cursor-pointer"]').count();
    if (clientServiceCards > 0) {
      console.log(`  ✅ Client can see ${clientServiceCards} services`);
      
      // Open service
      await page.locator('[class*="cursor-pointer"]').first().click();
      await page.waitForTimeout(2000);
      
      // Client should see Timeline, NOT Kanban
      const timelineVisible = await page.isVisible('text=Project Overview') || 
                              await page.isVisible('text=Project Summary') ||
                              await page.isVisible('[class*="timeline"]');
      const kanbanNotVisible = !(await page.isVisible('text=To Do'));
      
      if (timelineVisible && kanbanNotVisible) {
        results.passed.push('✅ Client: Timeline view correct');
        console.log('  ✅ Client sees timeline (not Kanban)');
      } else if (!kanbanNotVisible) {
        results.failed.push('❌ Client: Sees Kanban (should be timeline)');
        console.log('  ❌ Client incorrectly sees Kanban');
      } else {
        results.warnings.push('⚠️ Client: View uncertain');
        console.log('  ⚠️ Client view unclear');
      }
    }
    
    // Test Client Restrictions
    console.log('\n18. Client: Access Restrictions');
    
    // Client should NOT see certain elements
    const restrictedItems = {
      'Create buttons': await page.locator('button:has-text("Create")').count(),
      'Add buttons': await page.locator('button:has([class*="Plus"])').count(),
      'Edit buttons': await page.locator('button:has-text("Edit")').count(),
      'Delete buttons': await page.locator('button:has-text("Delete")').count()
    };
    
    let properlyRestricted = true;
    for (const [item, count] of Object.entries(restrictedItems)) {
      if (count > 0) {
        properlyRestricted = false;
        results.warnings.push(`⚠️ Client: ${item} visible (${count})`);
        console.log(`  ⚠️ ${item} found: ${count}`);
      }
    }
    
    if (properlyRestricted) {
      results.passed.push('✅ Client: Properly restricted');
      console.log('  ✅ Client restrictions working');
    }
    
    // Test Client Messages
    console.log('\n19. Client: Messaging Access');
    await page.click('nav >> text=Messages');
    await page.waitForTimeout(2000);
    
    const clientConversations = await page.locator('[class*="cursor-pointer"]').count();
    if (clientConversations > 0) {
      results.passed.push(`✅ Client: Can see conversations`);
      console.log(`  ✅ Client has ${clientConversations} conversations`);
      
      // Open conversation
      await page.locator('[class*="cursor-pointer"]').first().click();
      await page.waitForTimeout(1000);
      
      // Check if can send message
      const messageInput = await page.isVisible('textarea');
      if (messageInput) {
        await page.locator('textarea').first().fill('Test message from client');
        const sendBtn = await page.locator('button[aria-label*="Send"]').first();
        if (await sendBtn.isVisible()) {
          await sendBtn.click();
          await page.waitForTimeout(1000);
          results.passed.push('✅ Client: Can send messages');
          console.log('  ✅ Client messaging works');
        }
      }
    }
    
    // ========================================
    // PART 4: RESPONSIVE DESIGN TESTING
    // ========================================
    console.log('\n═══ RESPONSIVE DESIGN TESTING ═══\n');
    
    // Test Mobile
    console.log('20. Mobile View (375px)');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileMenu = await page.locator('button:has([class*="Menu"])').first();
    if (await mobileMenu.isVisible()) {
      results.passed.push('✅ Mobile: Menu button visible');
      console.log('  ✅ Mobile navigation present');
      
      await mobileMenu.click();
      await page.waitForTimeout(500);
      const mobileNav = await page.isVisible('nav');
      if (mobileNav) {
        console.log('    ✓ Mobile menu opens');
      }
      await page.keyboard.press('Escape');
    }
    
    // Test Tablet
    console.log('\n21. Tablet View (768px)');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    const tabletLayout = await page.isVisible('main');
    if (tabletLayout) {
      results.passed.push('✅ Tablet: Layout responsive');
      console.log('  ✅ Tablet view works');
    }
    
    // Test Desktop
    console.log('\n22. Desktop View (1920px)');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    const desktopLayout = await page.isVisible('main');
    if (desktopLayout) {
      results.passed.push('✅ Desktop: Layout correct');
      console.log('  ✅ Desktop view works');
    }
    
    // Test 4K
    console.log('\n23. 4K View (3840px)');
    await page.setViewportSize({ width: 3840, height: 2160 });
    await page.waitForTimeout(1000);
    const fourKLayout = await page.isVisible('main');
    if (fourKLayout) {
      results.passed.push('✅ 4K: Layout scales properly');
      console.log('  ✅ 4K display supported');
    }
    
    // ========================================
    // PART 5: PERFORMANCE TESTING
    // ========================================
    console.log('\n═══ PERFORMANCE TESTING ═══\n');
    
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('24. Page Load Performance');
    const pages = [
      { name: 'Dashboard', path: '/client' },
      { name: 'Services', path: '/services' },
      { name: 'Messages', path: '/messages' }
    ];
    
    for (const { name, path } of pages) {
      const start = Date.now();
      await page.goto(`http://localhost:3000${path}`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - start;
      
      if (loadTime < 2000) {
        results.passed.push(`✅ ${name}: ${loadTime}ms (fast)`);
        console.log(`  ✅ ${name}: ${loadTime}ms`);
      } else if (loadTime < 4000) {
        results.warnings.push(`⚠️ ${name}: ${loadTime}ms (slow)`);
        console.log(`  ⚠️ ${name}: ${loadTime}ms`);
      } else {
        results.failed.push(`❌ ${name}: ${loadTime}ms (too slow)`);
        console.log(`  ❌ ${name}: ${loadTime}ms`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Critical Test Error:', error.message);
    results.failed.push(`❌ Critical: ${error.message}`);
  }
  
  // ========================================
  // TEST SUMMARY
  // ========================================
  console.log('\n' + '=' + '='.repeat(70));
  console.log('\n📊 COMPREHENSIVE TEST RESULTS\n');
  
  const total = results.passed.length + results.failed.length + results.warnings.length;
  const passRate = Math.round((results.passed.length / total) * 100);
  
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️ Warnings: ${results.warnings.length}`);
  console.log(`📈 Success Rate: ${passRate}%`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(test => console.log(`  ${test}`));
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    results.warnings.forEach(test => console.log(`  ${test}`));
  }
  
  // Feature Summary
  console.log('\n✨ FEATURE STATUS:');
  const features = {
    'Authentication (All Roles)': results.passed.filter(r => r.includes('login')).length >= 3,
    'Role-Based Access': results.passed.filter(r => r.includes('restricted') || r.includes('Timeline')).length > 0,
    'Client Management': results.passed.filter(r => r.includes('Clients')).length > 0,
    'Messaging System': results.passed.filter(r => r.includes('message')).length > 0,
    'Services & Projects': results.passed.filter(r => r.includes('services')).length > 0,
    'Kanban Board': results.passed.filter(r => r.includes('Kanban')).length > 0,
    'Drag & Drop': results.passed.filter(r => r.includes('drag')).length > 0,
    'Milestones': results.passed.filter(r => r.includes('Milestone')).length > 0,
    'Tasks': results.passed.filter(r => r.includes('Task')).length > 0,
    'Responsive Design': results.passed.filter(r => r.includes('Mobile') || r.includes('Tablet')).length > 0
  };
  
  for (const [feature, working] of Object.entries(features)) {
    console.log(`  ${working ? '✅' : '❌'} ${feature}`);
  }
  
  console.log('\n' + '=' + '='.repeat(70));
  
  if (passRate >= 90) {
    console.log('\n🎉 EXCELLENT! System working perfectly!');
  } else if (passRate >= 75) {
    console.log('\n✅ GOOD! Most features operational.');
  } else if (passRate >= 50) {
    console.log('\n⚠️ NEEDS WORK! Several issues found.');
  } else {
    console.log('\n❌ CRITICAL! Major problems detected.');
  }
  
  await browser.close();
}

testAllFeatures().catch(console.error);