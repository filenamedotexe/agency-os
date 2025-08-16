const { chromium } = require('playwright');

async function debugServerActionError() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture all console logs and errors
  page.on('console', msg => {
    console.log(`🖥️  BROWSER: ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`🔥 PAGE ERROR: ${error.message}`);
  });
  
  page.on('response', response => {
    if (response.url().includes('_next/static')) return; // Skip static files
    const status = response.status();
    const url = response.url();
    if (status >= 400) {
      console.log(`🚨 HTTP ERROR: ${status} ${response.statusText()} - ${url}`);
    } else if (url.includes('api') || status === 200) {
      console.log(`📡 REQUEST: ${status} - ${url}`);
    }
  });
  
  page.on('requestfailed', request => {
    console.log(`❌ FAILED REQUEST: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  console.log('🚀 COMPREHENSIVE SERVER ACTION DEBUG TEST\n');
  console.log('=' + '='.repeat(60));
  
  try {
    // 1. Login as admin
    console.log('\n1. 🔐 ADMIN LOGIN');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    console.log('   Filling login form...');
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(6000);
    
    const adminUrl = page.url();
    if (adminUrl.includes('/admin')) {
      console.log('   ✅ Admin login successful');
    } else {
      console.log('   ❌ Admin login failed - URL:', adminUrl);
      throw new Error('Admin login failed');
    }
    
    // 2. Navigate to services
    console.log('\n2. 📋 NAVIGATE TO SERVICES');
    await page.goto('http://localhost:3000/services');
    await page.waitForTimeout(3000);
    
    const serviceCards = await page.locator('[class*="cursor-pointer"]').count();
    console.log(`   Found ${serviceCards} service cards`);
    
    if (serviceCards === 0) {
      console.log('   ❌ No services found');
      throw new Error('No services available');
    }
    
    // 3. Open first service
    console.log('\n3. 🔧 OPEN SERVICE DETAIL');
    await page.locator('[class*="cursor-pointer"]').first().click();
    await page.waitForTimeout(4000);
    
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    if (!currentUrl.includes('/services/')) {
      console.log('   ❌ Service detail page not loaded');
      throw new Error('Failed to open service detail');
    }
    
    // 4. Check Kanban columns
    console.log('\n4. 📊 VERIFY KANBAN BOARD');
    const columns = ['To Do', 'In Progress', 'Review', 'Done', 'Blocked'];
    for (const column of columns) {
      const visible = await page.locator(`text="${column}"`).first().isVisible();
      console.log(`   ${column}: ${visible ? '✅' : '❌'}`);
    }
    
    // 5. Check for tasks
    console.log('\n5. 📝 CHECK EXISTING TASKS');
    const taskCount = await page.locator('h4').count();
    console.log(`   Found ${taskCount} task elements`);
    
    // 6. Attempt task creation
    console.log('\n6. ➕ ATTEMPT TASK CREATION');
    
    // Find the To Do column add button
    const todoColumn = await page.locator('text="To Do"').first().locator('../..');
    const addTaskBtn = await todoColumn.locator('button:has(svg)').first();
    
    const btnVisible = await addTaskBtn.isVisible();
    console.log(`   Add Task button visible: ${btnVisible ? '✅' : '❌'}`);
    
    if (!btnVisible) {
      console.log('   ❌ Cannot find Add Task button');
      throw new Error('Add Task button not found');
    }
    
    // Click the add task button
    console.log('   Clicking Add Task button...');
    await addTaskBtn.click();
    await page.waitForTimeout(2000);
    
    // Check if modal opened
    const modalOpen = await page.locator('text="Create New Task"').isVisible();
    console.log(`   Modal opened: ${modalOpen ? '✅' : '❌'}`);
    
    if (!modalOpen) {
      console.log('   ❌ Task creation modal did not open');
      throw new Error('Modal failed to open');
    }
    
    // 7. Fill out task form
    console.log('\n7. 📋 FILL TASK FORM');
    
    const titleInput = page.locator('input[id="title"]');
    const descInput = page.locator('textarea[id="description"]');
    
    console.log('   Filling title...');
    await titleInput.fill('DEBUG TEST TASK');
    
    console.log('   Filling description...');
    await descInput.fill('This is a test task to debug server action errors');
    
    // 8. Submit and monitor for errors
    console.log('\n8. 🚀 SUBMIT TASK CREATION');
    console.log('   Submitting form...');
    
    // Set up error monitoring
    let serverActionError = null;
    let toastError = null;
    
    page.on('response', async (response) => {
      if (response.url().includes('createTask') || response.status() >= 400) {
        try {
          const text = await response.text();
          console.log(`   📡 Server Response: ${response.status()} - ${text.substring(0, 200)}`);
          if (response.status() >= 400) {
            serverActionError = text;
          }
        } catch (e) {
          console.log(`   📡 Server Response: ${response.status()} - Could not read response body`);
        }
      }
    });
    
    // Submit the form
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    
    // Wait and check for results
    await page.waitForTimeout(5000);
    
    // Check for toast notifications
    const toastVisible = await page.locator('[role="alert"]').isVisible();
    if (toastVisible) {
      const toastText = await page.locator('[role="alert"]').textContent();
      console.log(`   🔔 Toast notification: ${toastText}`);
      if (toastText?.includes('Error') || toastText?.includes('Failed')) {
        toastError = toastText;
      }
    }
    
    // Check if modal closed (success indicator)
    const modalStillOpen = await page.locator('text="Create New Task"').isVisible();
    console.log(`   Modal still open: ${modalStillOpen ? '❌' : '✅'}`);
    
    // Check for new tasks
    const newTaskCount = await page.locator('h4').count();
    console.log(`   Task count after creation: ${newTaskCount} (was ${taskCount})`);
    
    // 9. Final analysis
    console.log('\n9. 🔍 ERROR ANALYSIS');
    console.log('=' + '='.repeat(40));
    
    if (serverActionError) {
      console.log(`❌ SERVER ACTION ERROR: ${serverActionError}`);
    }
    
    if (toastError) {
      console.log(`❌ TOAST ERROR: ${toastError}`);
    }
    
    if (!serverActionError && !toastError && newTaskCount > taskCount) {
      console.log('✅ TASK CREATION SUCCESSFUL - NO ERRORS DETECTED');
    } else if (modalStillOpen) {
      console.log('⚠️  TASK CREATION APPEARS TO HAVE FAILED - MODAL STILL OPEN');
    }
    
    // 10. Check server logs in console
    console.log('\n10. 📊 FINAL STATUS');
    console.log(`   Server action error: ${serverActionError ? 'YES' : 'NO'}`);
    console.log(`   Toast error: ${toastError ? 'YES' : 'NO'}`);
    console.log(`   Modal closed: ${!modalStillOpen ? 'YES' : 'NO'}`);
    console.log(`   Task created: ${newTaskCount > taskCount ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('\n💥 TEST EXECUTION ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
  
  console.log('\n' + '=' + '='.repeat(60));
  console.log('🏁 DEBUG TEST COMPLETED - Check server terminal for additional logs');
  
  // Keep browser open for manual inspection
  console.log('\n⏸️  Browser will stay open for manual inspection...');
  await page.waitForTimeout(10000);
  
  await browser.close();
}

debugServerActionError().catch(console.error);