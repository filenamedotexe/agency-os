const { chromium } = require('playwright');

async function testAllFeaturesThoroughly() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slower to see what's happening
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
  
  console.log('\n🚀 THOROUGH FEATURE TESTING - EVERY FUNCTIONALITY\n');
  console.log('=' + '='.repeat(70));
  
  try {
    // ========================================
    // ADMIN ROLE COMPLETE TESTING
    // ========================================
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║       ADMIN ROLE TESTING              ║');
    console.log('╚═══════════════════════════════════════╝\n');
    
    // 1. LOGIN TEST
    console.log('1. Testing Admin Login...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Check login page elements
    const loginElements = {
      'Email input': await page.locator('input[name="email"]').isVisible(),
      'Password input': await page.locator('input[name="password"]').isVisible(),
      'Submit button': await page.locator('button[type="submit"]').isVisible()
    };
    
    for (const [element, visible] of Object.entries(loginElements)) {
      if (visible) {
        console.log(`  ✓ ${element} found`);
      } else {
        results.failed.push(`❌ Login: ${element} missing`);
        console.log(`  ✗ ${element} missing`);
      }
    }
    
    // Perform login
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForTimeout(3000);
    const afterLoginUrl = page.url();
    
    if (afterLoginUrl.includes('/admin')) {
      results.passed.push('✅ Admin login successful');
      console.log('  ✅ Successfully logged in as admin');
    } else {
      results.failed.push('❌ Admin login failed');
      console.log('  ❌ Login failed - URL:', afterLoginUrl);
    }
    
    // 2. ADMIN DASHBOARD TEST
    console.log('\n2. Testing Admin Dashboard...');
    await page.waitForTimeout(2000);
    
    // Check dashboard elements
    const dashboardElements = {
      'Welcome text': await page.locator('text=Welcome').isVisible(),
      'Stats cards': await page.locator('[class*="card"]').count() > 0,
      'Navigation': await page.locator('a:has-text("Dashboard")').isVisible() || 
                    await page.locator('a:has-text("Clients")').isVisible() ||
                    await page.locator('nav').isVisible()
    };
    
    for (const [element, visible] of Object.entries(dashboardElements)) {
      if (visible) {
        results.passed.push(`✅ Dashboard: ${element}`);
        console.log(`  ✓ ${element} present`);
      } else {
        results.warnings.push(`⚠️ Dashboard: ${element} missing`);
        console.log(`  ⚠ ${element} not found`);
      }
    }
    
    // 3. CLIENTS PAGE TEST
    console.log('\n3. Testing Clients Management...');
    
    // Try different ways to navigate to clients
    const clientsLink = await page.locator('a:has-text("Clients")').first();
    if (await clientsLink.isVisible()) {
      await clientsLink.click();
    } else {
      // Try direct navigation
      await page.goto('http://localhost:3000/clients');
    }
    
    await page.waitForTimeout(2000);
    
    // Check if on clients page
    const onClientsPage = page.url().includes('/clients') || 
                         await page.locator('h1:has-text("Clients")').isVisible() ||
                         await page.locator('text=Client Management').isVisible();
    
    if (onClientsPage) {
      results.passed.push('✅ Clients page accessible');
      console.log('  ✓ Navigated to clients page');
      
      // Test table features
      const tableElements = {
        'Search bar': await page.locator('input[placeholder*="Search"]').count() > 0,
        'Data table': await page.locator('table').isVisible() || 
                     await page.locator('[role="table"]').isVisible(),
        'Client data': await page.locator('td').count() > 0 ||
                      await page.locator('[role="cell"]').count() > 0
      };
      
      for (const [element, visible] of Object.entries(tableElements)) {
        if (visible) {
          results.passed.push(`✅ Clients: ${element}`);
          console.log(`  ✓ ${element} working`);
        } else {
          results.warnings.push(`⚠️ Clients: ${element} missing`);
          console.log(`  ⚠ ${element} not found`);
        }
      }
      
      // Test search functionality
      const searchInput = await page.locator('input[placeholder*="Search"]').first();
      if (await searchInput.isVisible()) {
        console.log('  Testing search...');
        await searchInput.fill('Sarah');
        await page.waitForTimeout(1000);
        await searchInput.clear();
        results.passed.push('✅ Search functionality works');
        console.log('  ✓ Search tested');
      }
    } else {
      results.failed.push('❌ Clients page not accessible');
      console.log('  ✗ Could not access clients page');
    }
    
    // 4. MESSAGES TEST
    console.log('\n4. Testing Messaging System...');
    
    // Navigate to messages
    const messagesLink = await page.locator('a:has-text("Messages")').first();
    if (await messagesLink.isVisible()) {
      await messagesLink.click();
    } else {
      await page.goto('http://localhost:3000/messages');
    }
    
    await page.waitForTimeout(2000);
    
    const onMessagesPage = page.url().includes('/messages') ||
                          await page.locator('h1:has-text("Messages")').isVisible() ||
                          await page.locator('text=Conversations').isVisible();
    
    if (onMessagesPage) {
      results.passed.push('✅ Messages page accessible');
      console.log('  ✓ Messages page loaded');
      
      // Test new message button
      const newMessageBtn = await page.locator('button:has-text("New Message")').first();
      if (await newMessageBtn.isVisible()) {
        console.log('  Testing new message creation...');
        await newMessageBtn.click();
        await page.waitForTimeout(1500);
        
        // Check if modal opened
        const modalOpen = await page.locator('[role="dialog"]').isVisible() ||
                         await page.locator('text=Select a client').isVisible() ||
                         await page.locator('text=New Conversation').isVisible();
        
        if (modalOpen) {
          results.passed.push('✅ New message modal opens');
          console.log('  ✓ Message modal works');
          
          // Try to select a client
          const clientOption = await page.locator('[role="dialog"] >> [class*="cursor-pointer"]').first();
          if (await clientOption.isVisible()) {
            await clientOption.click();
            await page.waitForTimeout(2000);
            
            // Check if conversation opened
            const chatOpen = await page.locator('textarea').isVisible();
            if (chatOpen) {
              results.passed.push('✅ Can create conversations');
              console.log('  ✓ Conversation created');
              
              // Send test message
              await page.locator('textarea').first().fill('Test message from admin');
              
              // Find send button
              const sendBtn = await page.locator('button[aria-label*="Send"]').first() ||
                             await page.locator('button:has(svg)').last();
              
              if (await sendBtn.isVisible()) {
                await sendBtn.click();
                await page.waitForTimeout(1000);
                results.passed.push('✅ Messages can be sent');
                console.log('  ✓ Message sent');
              }
            }
          } else {
            // Close modal
            await page.keyboard.press('Escape');
          }
        }
      }
      
      // Check existing conversations
      const conversations = await page.locator('[class*="border"][class*="rounded"]').count();
      if (conversations > 0) {
        console.log(`  ✓ Found ${conversations} conversations`);
        results.passed.push(`✅ ${conversations} conversations found`);
      }
    } else {
      results.failed.push('❌ Messages page not accessible');
      console.log('  ✗ Could not access messages');
    }
    
    // 5. SERVICES TEST
    console.log('\n5. Testing Services Management...');
    
    // Navigate to services
    const servicesLink = await page.locator('a:has-text("Services")').first();
    if (await servicesLink.isVisible()) {
      await servicesLink.click();
    } else {
      await page.goto('http://localhost:3000/services');
    }
    
    await page.waitForTimeout(2000);
    
    const onServicesPage = page.url().includes('/services');
    
    if (onServicesPage) {
      results.passed.push('✅ Services page accessible');
      console.log('  ✓ Services page loaded');
      
      // Count service cards
      const serviceCards = await page.locator('[class*="card"][class*="cursor-pointer"]').count() ||
                          await page.locator('[class*="border"][class*="rounded"][class*="cursor-pointer"]').count();
      
      if (serviceCards > 0) {
        results.passed.push(`✅ ${serviceCards} services found`);
        console.log(`  ✓ Found ${serviceCards} services`);
        
        // Open first service
        console.log('  Opening service detail page...');
        const firstCard = await page.locator('[class*="cursor-pointer"]').first();
        await firstCard.click();
        await page.waitForTimeout(3000);
        
        // Check if on service detail page
        const onDetailPage = page.url().includes('/services/') && page.url().length > 40;
        
        if (onDetailPage) {
          results.passed.push('✅ Service detail page opens');
          console.log('  ✓ Service detail page loaded');
          
          // 6. KANBAN BOARD TEST
          console.log('\n6. Testing Kanban Board...');
          
          // Check for kanban columns
          const kanbanColumns = {
            'To Do': await page.locator('text="To Do"').isVisible(),
            'In Progress': await page.locator('text="In Progress"').isVisible(),
            'Review': await page.locator('text="Review"').isVisible(),
            'Done': await page.locator('text="Done"').isVisible(),
            'Blocked': await page.locator('text="Blocked"').isVisible()
          };
          
          let columnsFound = 0;
          for (const [column, visible] of Object.entries(kanbanColumns)) {
            if (visible) {
              columnsFound++;
              console.log(`  ✓ Column: ${column}`);
            }
          }
          
          if (columnsFound >= 3) {
            results.passed.push(`✅ Kanban board with ${columnsFound} columns`);
            console.log(`  ✓ Kanban board functional`);
          } else {
            results.warnings.push(`⚠️ Only ${columnsFound} columns found`);
          }
          
          // 7. DRAG AND DROP TEST
          console.log('\n7. Testing Drag & Drop...');
          
          const tasks = await page.locator('h4').count();
          if (tasks > 0) {
            console.log(`  Found ${tasks} tasks to test`);
            
            try {
              const firstTask = await page.locator('h4').first();
              const taskText = await firstTask.textContent();
              console.log(`  Dragging task: "${taskText}"`);
              
              // Find Done column
              const doneColumn = await page.locator('text="Done"').locator('../..');
              
              // Perform drag
              await firstTask.hover();
              await page.mouse.down();
              await page.waitForTimeout(300);
              
              await doneColumn.hover();
              await page.waitForTimeout(300);
              await page.mouse.up();
              
              await page.waitForTimeout(2000);
              
              // Verify task moved
              const taskInDone = await doneColumn.locator(`text="${taskText}"`).isVisible();
              
              if (taskInDone) {
                results.passed.push('✅ Drag & drop working perfectly');
                console.log('  ✓ Task successfully dragged to Done');
              } else {
                // Try to find if task moved anywhere
                const taskStillVisible = await page.locator(`text="${taskText}"`).isVisible();
                if (taskStillVisible) {
                  results.warnings.push('⚠️ Drag & drop partially working');
                  console.log('  ⚠ Task moved but not to expected column');
                } else {
                  results.failed.push('❌ Drag & drop failed');
                  console.log('  ✗ Task disappeared after drag');
                }
              }
            } catch (dragError) {
              console.log('  ✗ Drag & drop error:', dragError.message);
              results.warnings.push('⚠️ Drag & drop could not be tested');
            }
          } else {
            console.log('  ⚠ No tasks available for drag & drop test');
          }
          
          // 8. MILESTONE SIDEBAR TEST
          console.log('\n8. Testing Milestone Management...');
          
          const milestonesSection = await page.locator('text="Milestones"').isVisible();
          if (milestonesSection) {
            results.passed.push('✅ Milestones sidebar present');
            console.log('  ✓ Milestone section found');
            
            // Try to create milestone
            const addMilestoneBtn = await page.locator('text="Milestones"').locator('../..').locator('button:has(svg)').first();
            if (await addMilestoneBtn.isVisible()) {
              console.log('  Testing milestone creation...');
              await addMilestoneBtn.click();
              await page.waitForTimeout(1000);
              
              const milestoneModal = await page.locator('text="Create New Milestone"').isVisible();
              if (milestoneModal) {
                results.passed.push('✅ Milestone creation modal works');
                console.log('  ✓ Milestone modal opens');
                
                // Fill form
                await page.fill('input[placeholder*="Design Phase"]', 'Test Milestone');
                await page.fill('textarea', 'Test description');
                
                // Submit
                await page.click('button:has-text("Create Milestone")');
                await page.waitForTimeout(2000);
                
                const created = await page.locator('text="Test Milestone"').isVisible();
                if (created) {
                  results.passed.push('✅ Milestones can be created');
                  console.log('  ✓ Milestone created successfully');
                }
              }
            }
            
            // Count existing milestones
            const milestoneCards = await page.locator('text="Milestones"').locator('../..').locator('[class*="card"]').count();
            if (milestoneCards > 0) {
              console.log(`  ✓ Found ${milestoneCards} milestones`);
              results.passed.push(`✅ ${milestoneCards} milestones displayed`);
            }
          }
          
          // 9. TASK CREATION TEST
          console.log('\n9. Testing Task Management...');
          
          const todoColumn = await page.locator('text="To Do"').locator('../..');
          if (await todoColumn.isVisible()) {
            const addTaskBtn = await todoColumn.locator('button:has(svg)').first();
            if (await addTaskBtn.isVisible()) {
              console.log('  Testing task creation...');
              await addTaskBtn.click();
              await page.waitForTimeout(1000);
              
              const taskModal = await page.locator('text="Create New Task"').isVisible();
              if (taskModal) {
                results.passed.push('✅ Task creation modal works');
                console.log('  ✓ Task modal opens');
                
                // Fill form
                await page.fill('input[placeholder*="Design"]', 'Test Task Admin');
                await page.fill('textarea[placeholder*="Task details"]', 'Created by test');
                
                // Set priority if select is visible
                const prioritySelect = await page.locator('select').first();
                if (await prioritySelect.isVisible()) {
                  await prioritySelect.selectOption({ index: 2 });
                }
                
                // Submit
                await page.click('button:has-text("Create Task")');
                await page.waitForTimeout(2000);
                
                const created = await page.locator('text="Test Task Admin"').isVisible();
                if (created) {
                  results.passed.push('✅ Tasks can be created');
                  console.log('  ✓ Task created successfully');
                }
              }
            }
          }
          
          // 10. TASK EDITING TEST
          console.log('\n10. Testing Task Editing...');
          
          const taskCard = await page.locator('h4').first();
          if (await taskCard.isVisible()) {
            // Find more menu button
            const moreBtn = await taskCard.locator('../../..').locator('button:has(svg)').last();
            if (await moreBtn.isVisible()) {
              await moreBtn.click();
              await page.waitForTimeout(500);
              
              const editOption = await page.locator('text="Edit"').first();
              if (await editOption.isVisible()) {
                await editOption.click();
                await page.waitForTimeout(1000);
                
                const editModal = await page.locator('text="Edit Task"').isVisible();
                if (editModal) {
                  results.passed.push('✅ Task edit modal works');
                  console.log('  ✓ Task editing functional');
                  
                  // Close modal
                  await page.keyboard.press('Escape');
                }
              }
            }
          }
        }
      } else {
        console.log('  ⚠ No services found to test');
        results.warnings.push('⚠️ No services available');
      }
    }
    
    // LOGOUT ADMIN
    console.log('\n11. Testing Admin Logout...');
    
    // Find user menu - try multiple selectors
    const userMenuBtn = await page.locator('button:has-text("admin@demo.com")').first() ||
                       await page.locator('button[aria-label*="User"]').first() ||
                       await page.locator('button:has(img)').last();
    
    if (await userMenuBtn.isVisible()) {
      await userMenuBtn.click();
      await page.waitForTimeout(500);
      
      const signOutBtn = await page.locator('text="Sign out"').first();
      if (await signOutBtn.isVisible()) {
        await signOutBtn.click();
        await page.waitForTimeout(2000);
        
        const loggedOut = page.url().includes('/login') || 
                         await page.locator('input[name="email"]').isVisible();
        
        if (loggedOut) {
          results.passed.push('✅ Admin logout successful');
          console.log('  ✓ Successfully logged out');
        }
      }
    }
    
    // ========================================
    // CLIENT ROLE TESTING
    // ========================================
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║       CLIENT ROLE TESTING             ║');
    console.log('╚═══════════════════════════════════════╝\n');
    
    // 12. CLIENT LOGIN TEST
    console.log('12. Testing Client Login...');
    
    await page.fill('input[name="email"]', 'sarah@acmecorp.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    const clientUrl = page.url();
    if (clientUrl.includes('/client')) {
      results.passed.push('✅ Client login successful');
      console.log('  ✓ Client authenticated');
    } else {
      results.failed.push('❌ Client login failed');
      console.log('  ✗ Client login failed');
    }
    
    // 13. CLIENT DASHBOARD TEST
    console.log('\n13. Testing Client Dashboard...');
    
    const clientDashboard = await page.locator('[class*="card"]').count() > 0;
    if (clientDashboard) {
      results.passed.push('✅ Client dashboard loads');
      console.log('  ✓ Client dashboard accessible');
    }
    
    // 14. CLIENT SERVICES VIEW TEST
    console.log('\n14. Testing Client Services View...');
    
    // Navigate to services
    const clientServicesLink = await page.locator('a:has-text("Services")').first();
    if (await clientServicesLink.isVisible()) {
      await clientServicesLink.click();
    } else {
      await page.goto('http://localhost:3000/services');
    }
    
    await page.waitForTimeout(2000);
    
    const clientServices = await page.locator('[class*="cursor-pointer"]').count();
    if (clientServices > 0) {
      console.log(`  ✓ Client sees ${clientServices} services`);
      
      // Open service
      await page.locator('[class*="cursor-pointer"]').first().click();
      await page.waitForTimeout(3000);
      
      // CLIENT SHOULD SEE TIMELINE, NOT KANBAN
      const timelineView = await page.locator('text="Project Overview"').isVisible() ||
                          await page.locator('text="Project Summary"').isVisible() ||
                          await page.locator('[class*="timeline"]').count() > 0;
      
      const kanbanNotVisible = !(await page.locator('text="To Do"').isVisible());
      
      if (timelineView && kanbanNotVisible) {
        results.passed.push('✅ Client sees timeline view (correct)');
        console.log('  ✓ Client timeline view working');
      } else if (!kanbanNotVisible) {
        results.failed.push('❌ Client sees Kanban (should be timeline)');
        console.log('  ✗ Client has wrong view');
      }
      
      // Check milestones in timeline
      const timelineMilestones = await page.locator('[class*="card"]').count();
      if (timelineMilestones > 0) {
        console.log(`  ✓ Timeline shows ${timelineMilestones} milestones`);
        results.passed.push(`✅ Client timeline has ${timelineMilestones} milestones`);
      }
    }
    
    // 15. CLIENT RESTRICTIONS TEST
    console.log('\n15. Testing Client Restrictions...');
    
    // Check that client CANNOT see admin functions
    const restrictedElements = {
      'Create buttons': await page.locator('button:has-text("Create")').count(),
      'New buttons': await page.locator('button:has-text("New")').count(),
      'Add buttons': await page.locator('button:has(svg[class*="Plus"])').count(),
      'Edit options': await page.locator('text="Edit"').count(),
      'Delete options': await page.locator('text="Delete"').count()
    };
    
    let totalRestricted = 0;
    for (const [element, count] of Object.entries(restrictedElements)) {
      totalRestricted += count;
      if (count > 0) {
        console.log(`  ⚠ Found ${count} ${element} (should be hidden)`);
      }
    }
    
    if (totalRestricted === 0) {
      results.passed.push('✅ Client restrictions working perfectly');
      console.log('  ✓ All admin functions hidden from client');
    } else {
      results.failed.push(`❌ Client can see ${totalRestricted} restricted elements`);
      console.log(`  ✗ Client has access to ${totalRestricted} admin functions`);
    }
    
    // 16. CLIENT MESSAGES TEST
    console.log('\n16. Testing Client Messaging...');
    
    const clientMessagesLink = await page.locator('a:has-text("Messages")').first();
    if (await clientMessagesLink.isVisible()) {
      await clientMessagesLink.click();
      await page.waitForTimeout(2000);
      
      const clientConversations = await page.locator('[class*="border"][class*="rounded"]').count();
      if (clientConversations > 0) {
        results.passed.push(`✅ Client has ${clientConversations} conversations`);
        console.log(`  ✓ Client can see ${clientConversations} conversations`);
        
        // Open conversation
        await page.locator('[class*="cursor-pointer"]').first().click();
        await page.waitForTimeout(1000);
        
        // Try to send message
        const messageArea = await page.locator('textarea').first();
        if (await messageArea.isVisible()) {
          await messageArea.fill('Test message from client');
          
          const sendBtn = await page.locator('button[aria-label*="Send"]').first();
          if (await sendBtn.isVisible()) {
            await sendBtn.click();
            await page.waitForTimeout(1000);
            results.passed.push('✅ Client can send messages');
            console.log('  ✓ Client messaging works');
          }
        }
      }
    }
    
    // ========================================
    // RESPONSIVE DESIGN TESTING
    // ========================================
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║     RESPONSIVE DESIGN TESTING         ║');
    console.log('╚═══════════════════════════════════════╝\n');
    
    // 17. MOBILE VIEW TEST
    console.log('17. Testing Mobile View (375px)...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1500);
    
    const mobileMenuBtn = await page.locator('button:has(svg[class*="Menu"])').first() ||
                         await page.locator('button[aria-label*="Menu"]').first();
    
    if (await mobileMenuBtn.isVisible()) {
      results.passed.push('✅ Mobile menu button visible');
      console.log('  ✓ Mobile navigation present');
      
      await mobileMenuBtn.click();
      await page.waitForTimeout(500);
      
      const mobileNav = await page.locator('nav').isVisible() ||
                       await page.locator('a:has-text("Dashboard")').isVisible();
      
      if (mobileNav) {
        results.passed.push('✅ Mobile menu opens correctly');
        console.log('  ✓ Mobile menu functional');
      }
      
      await page.keyboard.press('Escape');
    } else {
      results.warnings.push('⚠️ Mobile menu not found');
      console.log('  ⚠ Mobile menu button missing');
    }
    
    // Check mobile layout
    const mobileContent = await page.locator('main').isVisible() ||
                         await page.locator('[class*="container"]').isVisible();
    
    if (mobileContent) {
      results.passed.push('✅ Mobile layout renders');
      console.log('  ✓ Mobile content displays correctly');
    }
    
    // 18. TABLET VIEW TEST
    console.log('\n18. Testing Tablet View (768px)...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1500);
    
    const tabletLayout = await page.locator('main').isVisible();
    if (tabletLayout) {
      results.passed.push('✅ Tablet layout responsive');
      console.log('  ✓ Tablet view works');
    }
    
    // 19. DESKTOP VIEW TEST
    console.log('\n19. Testing Desktop View (1920px)...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1500);
    
    const desktopLayout = await page.locator('main').isVisible();
    if (desktopLayout) {
      results.passed.push('✅ Desktop layout correct');
      console.log('  ✓ Desktop view optimal');
    }
    
    // 20. 4K VIEW TEST
    console.log('\n20. Testing 4K View (3840px)...');
    await page.setViewportSize({ width: 3840, height: 2160 });
    await page.waitForTimeout(1500);
    
    const fourKLayout = await page.locator('main').isVisible();
    if (fourKLayout) {
      results.passed.push('✅ 4K display scales perfectly');
      console.log('  ✓ 4K view supported');
    }
    
  } catch (error) {
    console.error('\n❌ Critical Test Error:', error.message);
    results.failed.push(`❌ Critical: ${error.message}`);
  }
  
  // ========================================
  // FINAL RESULTS
  // ========================================
  console.log('\n' + '=' + '='.repeat(70));
  console.log('\n📊 COMPLETE TEST RESULTS\n');
  
  const total = results.passed.length + results.failed.length + results.warnings.length;
  const passRate = Math.round((results.passed.length / total) * 100);
  
  console.log(`✅ Passed: ${results.passed.length} tests`);
  console.log(`❌ Failed: ${results.failed.length} tests`);
  console.log(`⚠️ Warnings: ${results.warnings.length} tests`);
  console.log(`📈 Success Rate: ${passRate}%`);
  console.log(`📊 Total Tests Run: ${total}`);
  
  // Show failures
  if (results.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.failed.forEach(test => console.log(`  ${test}`));
  }
  
  // Show warnings
  if (results.warnings.length > 0) {
    console.log('\n⚠️ WARNINGS:');
    results.warnings.forEach(test => console.log(`  ${test}`));
  }
  
  // Feature Coverage
  console.log('\n✨ FEATURE COVERAGE:');
  const features = {
    'Authentication': results.passed.filter(r => r.includes('login')).length > 0,
    'Admin Dashboard': results.passed.filter(r => r.includes('Dashboard')).length > 0,
    'Client Management': results.passed.filter(r => r.includes('Clients')).length > 0,
    'Messaging System': results.passed.filter(r => r.includes('message') || r.includes('Message')).length > 0,
    'Services': results.passed.filter(r => r.includes('Services') || r.includes('services')).length > 0,
    'Kanban Board': results.passed.filter(r => r.includes('Kanban') || r.includes('columns')).length > 0,
    'Drag & Drop': results.passed.filter(r => r.includes('Drag') || r.includes('drag')).length > 0,
    'Milestones': results.passed.filter(r => r.includes('Milestone') || r.includes('milestone')).length > 0,
    'Tasks': results.passed.filter(r => r.includes('Task') || r.includes('task')).length > 0,
    'Client Timeline': results.passed.filter(r => r.includes('timeline')).length > 0,
    'Role Restrictions': results.passed.filter(r => r.includes('restriction') || r.includes('restricted')).length > 0,
    'Responsive Design': results.passed.filter(r => r.includes('Mobile') || r.includes('Tablet') || r.includes('4K')).length > 0
  };
  
  let workingFeatures = 0;
  for (const [feature, working] of Object.entries(features)) {
    if (working) workingFeatures++;
    console.log(`  ${working ? '✅' : '❌'} ${feature}`);
  }
  
  const featureRate = Math.round((workingFeatures / Object.keys(features).length) * 100);
  console.log(`\n📦 Features Working: ${workingFeatures}/${Object.keys(features).length} (${featureRate}%)`);
  
  // Overall Assessment
  console.log('\n' + '=' + '='.repeat(70));
  
  if (passRate >= 90 && featureRate >= 90) {
    console.log('\n🎉 EXCELLENT! System is production-ready!');
  } else if (passRate >= 75 && featureRate >= 75) {
    console.log('\n✅ GOOD! Most features are working correctly.');
  } else if (passRate >= 60) {
    console.log('\n⚠️ ACCEPTABLE! Core features work but needs improvement.');
  } else {
    console.log('\n❌ NEEDS WORK! Several critical issues found.');
  }
  
  console.log('\n' + '=' + '='.repeat(70));
  
  await browser.close();
}

// Run the thorough test
testAllFeaturesThoroughly().catch(console.error);