const { chromium } = require('playwright');

async function testRoleSwitching() {
  const browser = await chromium.launch({ 
    headless: false,  // Show browser to see the views
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  console.log('\n🔄 TESTING ROLE-BASED VIEW SWITCHING\n');
  console.log('=' + '='.repeat(60));
  
  try {
    // ========================================
    // TEST CLIENT VIEW
    // ========================================
    console.log('1️⃣  CLIENT VIEW TEST');
    console.log('   Logging in as Sarah (Client)...');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'sarah@acmecorp.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    console.log('   Navigating to services...');
    await page.goto('http://localhost:3000/services');
    await page.waitForTimeout(2000);
    
    console.log('   Opening first service...');
    await page.locator('[class*="cursor-pointer"]').first().click();
    await page.waitForTimeout(3000);
    
    // Check what client sees
    const clientSeesTimeline = await page.locator('text="Project Overview"').isVisible();
    const clientSeesKanban = await page.locator('text="To Do"').count() > 0;
    
    console.log(`   ✅ Client sees Timeline: ${clientSeesTimeline}`);
    console.log(`   ✅ Client sees Kanban: ${clientSeesKanban}`);
    
    if (clientSeesTimeline && !clientSeesKanban) {
      console.log('   ✅ CLIENT VIEW CORRECT - Timeline only\n');
    } else {
      console.log('   ❌ CLIENT VIEW ISSUE\n');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: '/Users/zachwieder/Documents/CODING MAIN/final-agency/client-view.png',
      fullPage: false 
    });
    
    // ========================================
    // TEST ADMIN VIEW
    // ========================================
    console.log('2️⃣  ADMIN VIEW TEST');
    console.log('   Logging out and switching to Admin...');
    
    // Force logout by going to login page
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    
    console.log('   Logging in as Admin...');
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    console.log('   Navigating to services...');
    await page.goto('http://localhost:3000/services');
    await page.waitForTimeout(2000);
    
    console.log('   Opening first service...');
    await page.locator('[class*="cursor-pointer"]').first().click();
    await page.waitForTimeout(3000);
    
    // Check what admin sees
    const adminSeesTimeline = await page.locator('text="Project Overview"').count() > 0;
    const adminSeesKanban = await page.locator('text="To Do"').isVisible();
    const adminSeesMilestones = await page.locator('text="Milestones"').isVisible();
    
    console.log(`   ✅ Admin sees Timeline: ${adminSeesTimeline}`);
    console.log(`   ✅ Admin sees Kanban: ${adminSeesKanban}`);
    console.log(`   ✅ Admin sees Milestone Sidebar: ${adminSeesMilestones}`);
    
    if (!adminSeesTimeline && adminSeesKanban) {
      console.log('   ✅ ADMIN VIEW CORRECT - Kanban board\n');
    } else {
      console.log('   ❌ ADMIN VIEW ISSUE\n');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: '/Users/zachwieder/Documents/CODING MAIN/final-agency/admin-view.png',
      fullPage: false 
    });
    
    // ========================================
    // TEST TEAM MEMBER VIEW
    // ========================================
    console.log('3️⃣  TEAM MEMBER VIEW TEST');
    console.log('   Logging out and switching to Team Member...');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    
    console.log('   Logging in as Team Member...');
    await page.fill('input[name="email"]', 'team@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    console.log('   Navigating to services...');
    await page.goto('http://localhost:3000/services');
    await page.waitForTimeout(2000);
    
    console.log('   Opening first service...');
    await page.locator('[class*="cursor-pointer"]').first().click();
    await page.waitForTimeout(3000);
    
    // Check what team member sees
    const teamSeesKanban = await page.locator('text="To Do"').isVisible();
    
    console.log(`   ✅ Team sees Kanban: ${teamSeesKanban}`);
    
    if (teamSeesKanban) {
      console.log('   ✅ TEAM VIEW CORRECT - Same as admin\n');
    } else {
      console.log('   ❌ TEAM VIEW ISSUE\n');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: '/Users/zachwieder/Documents/CODING MAIN/final-agency/team-view.png',
      fullPage: false 
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
  
  console.log('=' + '='.repeat(60));
  console.log('\n📸 Screenshots saved:');
  console.log('   - client-view.png');
  console.log('   - admin-view.png');
  console.log('   - team-view.png');
  
  console.log('\n⏸️  Browser will stay open for 10 seconds...');
  await page.waitForTimeout(10000);
  
  await browser.close();
}

testRoleSwitching().catch(console.error);