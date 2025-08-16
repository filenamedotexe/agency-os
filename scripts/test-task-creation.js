const { chromium } = require('playwright');

async function testTaskCreation() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 200
  });
  
  const page = await browser.newContext().then(c => c.newPage());
  
  console.log('🧪 Testing Task Creation Server Action\n');
  
  try {
    // Login as admin
    console.log('1. Logging in as admin...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    // Navigate to a service
    console.log('2. Navigating to service...');
    await page.goto('http://localhost:3000/services');
    await page.waitForTimeout(2000);
    await page.locator('[class*="cursor-pointer"]').first().click();
    await page.waitForTimeout(3000);
    
    // Try to create a task
    console.log('3. Attempting to create a task...');
    const todoColumn = await page.locator('text="To Do"').first().locator('../..');
    const addTaskBtn = await todoColumn.locator('button:has(svg)').first();
    
    if (await addTaskBtn.isVisible()) {
      console.log('   ✅ Found "Add Task" button');
      await addTaskBtn.click();
      await page.waitForTimeout(1000);
      
      const modalVisible = await page.locator('text="Create New Task"').isVisible();
      if (modalVisible) {
        console.log('   ✅ Task creation modal opened');
        
        // Fill out the form
        await page.fill('input[placeholder*="Task title"]', 'Test Task Creation');
        await page.fill('textarea[placeholder*="description"]', 'This is a test task');
        
        // Listen for server errors
        page.on('response', response => {
          if (response.status() >= 400) {
            console.log(`   ❌ HTTP Error: ${response.status()} ${response.statusText()}`);
          }
        });
        
        page.on('pageerror', error => {
          console.log(`   ❌ Page Error: ${error.message}`);
        });
        
        // Submit the form
        console.log('   📤 Submitting task...');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // Check if task was created or if there's an error
        const errorVisible = await page.locator('text="Server action"').isVisible() ||
                             await page.locator('[role="alert"]').isVisible();
        
        if (errorVisible) {
          console.log('   ❌ Server action error detected!');
          const errorText = await page.locator('[role="alert"]').textContent() || 'Unknown error';
          console.log(`   Error details: ${errorText}`);
        } else {
          console.log('   ✅ No visible errors');
          
          // Check if modal closed (success)
          const modalStillOpen = await page.locator('text="Create New Task"').isVisible();
          if (!modalStillOpen) {
            console.log('   ✅ Task creation appears successful');
          } else {
            console.log('   ⚠️  Modal still open - possible validation error');
          }
        }
        
      } else {
        console.log('   ❌ Task creation modal did not open');
      }
    } else {
      console.log('   ❌ Add Task button not visible');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
  
  console.log('\n🔍 Test completed. Check server logs for additional details.');
  await browser.close();
}

testTaskCreation().catch(console.error);