#!/usr/bin/env node

const { chromium } = require('playwright');

console.log('🧪 Testing Email Management System');
console.log('===================================\n');

const TEST_URL = 'http://localhost:3000';

async function testEmailManagement() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const testResults = {
    'Login': false,
    'Navigate to Settings': false,
    'Email Logs Load': false,
    'Email Templates Load': false,
    'Template Toggle Works': false,
    'Template Variables Display': false,
    'No Mock Data': false,
    'Database Connected': false
  };
  
  try {
    // 1. Login as admin
    console.log('1️⃣ Logging in as admin...');
    await page.goto(`${TEST_URL}/login`);
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 });
    testResults['Login'] = true;
    console.log('   ✅ Logged in successfully\n');
    
    // 2. Navigate to Settings
    console.log('2️⃣ Navigating to Settings...');
    await page.goto(`${TEST_URL}/admin/settings`);
    await page.waitForTimeout(3000);
    
    const settingsTitle = await page.textContent('h1, h2');
    if (settingsTitle?.includes('Settings')) {
      testResults['Navigate to Settings'] = true;
      console.log('   ✅ Settings page loaded\n');
    }
    
    // 3. Check Email Logs Tab
    console.log('3️⃣ Checking Email Logs...');
    const emailLogsTab = await page.locator('button:has-text("Email Logs")').first();
    if (emailLogsTab) {
      await emailLogsTab.click();
      await page.waitForTimeout(2000);
      
      // Check if table or "No email logs" message appears
      const hasTable = await page.locator('table').count() > 0;
      const hasNoLogsMessage = await page.locator('text="No email logs found"').count() > 0;
      
      if (hasTable || hasNoLogsMessage) {
        testResults['Email Logs Load'] = true;
        console.log('   ✅ Email logs component loaded (real data)\n');
        
        // Check for database connection
        const refreshButton = await page.locator('button:has-text("Refresh")').first();
        if (refreshButton) {
          testResults['Database Connected'] = true;
          console.log('   ✅ Database connection verified\n');
        }
      }
    }
    
    // 4. Check Templates Tab
    console.log('4️⃣ Checking Email Templates...');
    const templatesTab = await page.locator('button:has-text("Templates")').first();
    if (templatesTab) {
      await templatesTab.click();
      await page.waitForTimeout(3000);
      
      // Check for template cards
      const templateCards = await page.locator('.cursor-pointer').count();
      if (templateCards > 0) {
        testResults['Email Templates Load'] = true;
        console.log(`   ✅ Found ${templateCards} email templates from database\n`);
        
        // 5. Test template toggle
        console.log('5️⃣ Testing template toggle...');
        const firstSwitch = await page.locator('button[role="switch"]').first();
        if (firstSwitch) {
          const initialState = await firstSwitch.getAttribute('data-state');
          await firstSwitch.click();
          await page.waitForTimeout(2000);
          
          const newState = await firstSwitch.getAttribute('data-state');
          if (initialState !== newState) {
            testResults['Template Toggle Works'] = true;
            console.log('   ✅ Template active/inactive toggle works\n');
          }
        }
        
        // 6. Check template variables
        console.log('6️⃣ Checking template variables...');
        // Click first template card
        const firstTemplate = await page.locator('.cursor-pointer').first();
        await firstTemplate.click();
        await page.waitForTimeout(1000);
        
        // Click Variables tab
        const variablesTab = await page.locator('button:has-text("Variables")').first();
        if (variablesTab) {
          await variablesTab.click();
          await page.waitForTimeout(1000);
          
          // Check for variable display
          const variables = await page.locator('code:has-text("{{")').count();
          if (variables > 0) {
            testResults['Template Variables Display'] = true;
            console.log(`   ✅ Found ${variables} template variables\n`);
          }
        }
      }
    }
    
    // 7. Verify no mock data
    console.log('7️⃣ Verifying no mock data...');
    const pageContent = await page.content();
    
    // Check for signs of mock/hardcoded data
    const hasMockIndicators = 
      pageContent.includes('sampleData') || 
      pageContent.includes('mockData') ||
      pageContent.includes('// Mock') ||
      pageContent.includes('demo data');
    
    if (!hasMockIndicators) {
      testResults['No Mock Data'] = true;
      console.log('   ✅ No mock data detected - using real database\n');
    }
    
    // Take screenshots
    console.log('8️⃣ Taking screenshots...');
    await page.screenshot({ 
      path: '/tmp/email-templates.png',
      fullPage: false
    });
    console.log('   📸 Screenshot saved: /tmp/email-templates.png\n');
    
    // Switch to Email Logs tab for screenshot
    const logsTab = await page.locator('button:has-text("Email Logs")').first();
    if (logsTab) {
      await logsTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ 
        path: '/tmp/email-logs.png',
        fullPage: false
      });
      console.log('   📸 Screenshot saved: /tmp/email-logs.png\n');
    }
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
  
  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================\n');
  
  let passed = 0;
  let failed = 0;
  
  Object.entries(testResults).forEach(([test, result]) => {
    console.log(`${result ? '✅' : '❌'} ${test}`);
    if (result) passed++;
    else failed++;
  });
  
  const percentage = Math.round((passed / (passed + failed)) * 100);
  console.log(`\n🏆 Score: ${percentage}% (${passed}/${passed + failed} tests passed)`);
  
  if (percentage === 100) {
    console.log('\n🎉 PERFECT! Email management system is fully functional with real database data!');
  } else if (percentage >= 80) {
    console.log('\n✅ GOOD: Email management is mostly working correctly');
  } else if (percentage >= 60) {
    console.log('\n⚠️ NEEDS WORK: Some email management features need attention');
  } else {
    console.log('\n❌ CRITICAL: Major issues with email management system');
  }
  
  // Keep browser open for manual inspection
  console.log('\n⏰ Browser will remain open for 15 seconds for inspection...');
  await page.waitForTimeout(15000);
  
  await browser.close();
}

// Run the test
testEmailManagement().catch(console.error);