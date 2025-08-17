const { chromium } = require('playwright');

async function testAllRoles() {
  const browser = await chromium.launch({ 
    headless: true,  // Headless for speed
    slowMo: 100
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  console.log('\n🔄 TESTING ALL USER ROLES\n');
  console.log('=' + '='.repeat(60));
  
  const roles = [
    { 
      email: 'sarah@acmecorp.com', 
      password: 'password123', 
      role: 'CLIENT',
      expectedView: 'timeline',
      shouldSee: ['Project Overview', 'Project Summary'],
      shouldNotSee: ['To Do', 'Review', 'Blocked']
    },
    { 
      email: 'admin@demo.com', 
      password: 'password123', 
      role: 'ADMIN',
      expectedView: 'kanban',
      shouldSee: ['To Do', 'In Progress', 'Review', 'Done', 'Blocked', 'Milestones'],
      shouldNotSee: ['Project Overview']
    },
    { 
      email: 'team@demo.com', 
      password: 'password123', 
      role: 'TEAM MEMBER',
      expectedView: 'kanban',
      shouldSee: ['To Do', 'In Progress', 'Review', 'Done', 'Blocked'],
      shouldNotSee: ['Project Overview']
    }
  ];
  
  let allPassed = true;
  
  for (const user of roles) {
    console.log(`\n📦 TESTING ${user.role}`);
    console.log('-'.repeat(40));
    
    try {
      // Login
      console.log(`Logging in as ${user.email}...`);
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', user.password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
      
      // Go to services
      console.log('Opening service detail page...');
      await page.goto('http://localhost:3000/services');
      await page.waitForTimeout(2000);
      
      const serviceCount = await page.locator('[class*="cursor-pointer"]').count();
      console.log(`Found ${serviceCount} services`);
      
      if (serviceCount > 0) {
        await page.locator('[class*="cursor-pointer"]').first().click();
        await page.waitForTimeout(3000);
        
        // Check what they should see
        console.log('\n✅ Should see:');
        for (const element of user.shouldSee) {
          const visible = await page.locator(`text="${element}"`).first().isVisible().catch(() => false);
          if (visible) {
            console.log(`   ✅ "${element}" - VISIBLE`);
          } else {
            console.log(`   ❌ "${element}" - NOT FOUND`);
            allPassed = false;
          }
        }
        
        // Check what they should NOT see
        console.log('\n❌ Should NOT see:');
        for (const element of user.shouldNotSee) {
          const count = await page.locator(`text="${element}"`).count();
          if (count === 0) {
            console.log(`   ✅ "${element}" - HIDDEN (correct)`);
          } else {
            console.log(`   ❌ "${element}" - VISIBLE (should be hidden)`);
            allPassed = false;
          }
        }
        
        // Summary for this role
        console.log(`\n${user.role} VIEW: ${user.expectedView.toUpperCase()}`);
        
      } else {
        console.log('❌ No services available to test');
        allPassed = false;
      }
      
    } catch (error) {
      console.log(`❌ Error testing ${user.role}: ${error.message}`);
      allPassed = false;
    }
  }
  
  // ========================================
  // FINAL SUMMARY
  // ========================================
  console.log('\n' + '=' + '='.repeat(60));
  console.log('\n📊 ROLE-BASED VIEW SUMMARY\n');
  
  if (allPassed) {
    console.log('✅ ALL ROLES WORKING CORRECTLY!');
    console.log('');
    console.log('   CLIENT → Timeline View ✅');
    console.log('   ADMIN → Kanban View ✅');
    console.log('   TEAM → Kanban View ✅');
    console.log('');
    console.log('🎉 PHASE 5 ROLE-BASED VIEWS FULLY FUNCTIONAL!');
  } else {
    console.log('❌ SOME ROLE VIEWS HAVE ISSUES');
    console.log('Please check the output above for details.');
  }
  
  await browser.close();
  
  process.exit(allPassed ? 0 : 1);
}

testAllRoles().catch(console.error);