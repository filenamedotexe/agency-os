const { chromium } = require('playwright');

async function testPhase7Integration() {
  console.log('\n🔧 PHASE 7: INTEGRATION & POLISH TESTING\n');
  console.log('=' + '='.repeat(70));
  
  const results = { passed: [], failed: [], warnings: [] };
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // ========================================
    // 1. LOGIN AS ADMIN
    // ========================================
    console.log('\n1️⃣  Admin Login Test');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    if (page.url().includes('/admin')) {
      results.passed.push('✅ Admin login successful');
      console.log('   ✅ Logged in as admin');
    } else {
      results.failed.push('❌ Admin login failed');
      console.log('   ❌ Login failed');
    }
    
    // ========================================
    // 2. CHECK NAVIGATION
    // ========================================
    console.log('\n2️⃣  Navigation Check');
    
    // Check for Services link in navigation
    const servicesLink = await page.locator('a[href="/services"]').isVisible();
    if (servicesLink) {
      results.passed.push('✅ Services in navigation');
      console.log('   ✅ Services link present in navigation');
    } else {
      results.failed.push('❌ Services not in navigation');
      console.log('   ❌ Services link missing');
    }
    
    // Check other navigation items
    const navItems = ['Dashboard', 'Clients', 'Messages', 'Knowledge Hub', 'Settings'];
    for (const item of navItems) {
      const visible = await page.locator(`text="${item}"`).first().isVisible();
      if (visible) {
        console.log(`   ✅ ${item} visible`);
      } else {
        console.log(`   ⚠️  ${item} not visible`);
      }
    }
    
    // ========================================
    // 3. CHECK DASHBOARD WIDGETS
    // ========================================
    console.log('\n3️⃣  Dashboard Widgets');
    
    // Navigate to admin dashboard
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);
    
    // Check for stat cards
    const statCards = await page.locator('[class*="stat-card"], [class*="card"]').count();
    console.log(`   Found ${statCards} stat cards`);
    if (statCards >= 4) {
      results.passed.push('✅ Dashboard stat cards present');
    }
    
    // Check for Services Widget - look for upcoming milestones
    const upcomingMilestones = await page.locator('text="Upcoming Milestones"').isVisible();
    const overdueTasks = await page.locator('text="Overdue Tasks"').isVisible();
    
    if (upcomingMilestones) {
      results.passed.push('✅ Upcoming Milestones widget present');
      console.log('   ✅ Upcoming Milestones widget found');
    } else {
      results.failed.push('❌ Upcoming Milestones widget missing');
      console.log('   ❌ Upcoming Milestones widget not found');
    }
    
    if (overdueTasks) {
      results.passed.push('✅ Overdue Tasks widget present');
      console.log('   ✅ Overdue Tasks widget found');
    } else {
      results.failed.push('❌ Overdue Tasks widget missing');
      console.log('   ❌ Overdue Tasks widget not found');
    }
    
    // Check for recent activity
    const recentActivity = await page.locator('text="Recent Activity"').isVisible();
    if (recentActivity) {
      results.passed.push('✅ Recent Activity widget present');
      console.log('   ✅ Recent Activity widget found');
    }
    
    // ========================================
    // 4. TEST SERVICES PAGE
    // ========================================
    console.log('\n4️⃣  Services Page');
    
    await page.click('a[href="/services"]');
    await page.waitForTimeout(2000);
    
    // Check if we're on services page
    if (page.url().includes('/services')) {
      results.passed.push('✅ Navigation to Services works');
      console.log('   ✅ Successfully navigated to Services');
    }
    
    // Check for loading skeletons (briefly visible)
    // or check for service cards
    const serviceCards = await page.locator('[class*="cursor-pointer"]').count();
    console.log(`   Found ${serviceCards} service cards`);
    
    if (serviceCards > 0) {
      results.passed.push('✅ Services displayed');
      
      // Click on a service to test detail view
      await page.locator('[class*="cursor-pointer"]').first().click();
      await page.waitForTimeout(3000);
      
      if (page.url().includes('/services/')) {
        results.passed.push('✅ Service detail page works');
        console.log('   ✅ Service detail page loaded');
        
        // Check for Kanban board or mobile view
        const kanbanColumns = await page.locator('[class*="kanban"], text="To Do"').count();
        const mobileView = await page.locator('button:has-text("All Tasks")').count();
        
        if (kanbanColumns > 0 || mobileView > 0) {
          results.passed.push('✅ Task management view present');
          console.log('   ✅ Task management interface loaded');
        }
      }
    }
    
    // ========================================
    // 5. PERFORMANCE CHECKS
    // ========================================
    console.log('\n5️⃣  Performance Optimization');
    
    // Check page load time
    const startTime = Date.now();
    await page.goto('http://localhost:3000/services');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`   Page load time: ${loadTime}ms`);
    if (loadTime < 3000) {
      results.passed.push(`✅ Fast page load (${loadTime}ms)`);
    } else {
      results.warnings.push(`⚠️ Slow page load (${loadTime}ms)`);
    }
    
    // Check if virtual scrolling would be needed
    const taskCount = await page.locator('[class*="task"]').count();
    console.log(`   Total tasks visible: ${taskCount}`);
    
    if (taskCount > 20) {
      console.log('   📊 Virtual scrolling would optimize this view');
    }
    
    // ========================================
    // 6. ROLE-BASED ACCESS
    // ========================================
    console.log('\n6️⃣  Role-Based Access');
    
    // Logout and login as team member
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);
    
    // Sign out
    const signOutButton = await page.locator('text="Sign out"').first();
    if (await signOutButton.isVisible()) {
      await signOutButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Login as team member
    await page.fill('input[name="email"]', 'team@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Check navigation items for team member
    const teamServicesVisible = await page.locator('a[href="/services"]').isVisible();
    const settingsVisible = await page.locator('a[href="/admin/settings"]').isVisible();
    
    if (teamServicesVisible) {
      results.passed.push('✅ Team can see Services');
      console.log('   ✅ Team member can access Services');
    }
    
    if (!settingsVisible) {
      results.passed.push('✅ Team cannot see Settings (admin only)');
      console.log('   ✅ Settings hidden from team member');
    } else {
      results.failed.push('❌ Team can see Settings (should be hidden)');
      console.log('   ❌ Settings visible to team member');
    }
    
    // ========================================
    // 7. CLIENT ACCESS TEST
    // ========================================
    console.log('\n7️⃣  Client Access');
    
    // Sign out and login as client
    await page.locator('text="Sign out"').first().click();
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="email"]', 'sarah@acmecorp.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Check what client can see
    const clientServicesVisible = await page.locator('a[href="/services"]').isVisible();
    const clientsLinkVisible = await page.locator('a[href="/clients"]').isVisible();
    
    if (clientServicesVisible) {
      results.passed.push('✅ Client can see Services');
      console.log('   ✅ Client can access Services');
    }
    
    if (!clientsLinkVisible) {
      results.passed.push('✅ Client cannot see Clients list');
      console.log('   ✅ Clients list hidden from client');
    }
    
    // Navigate to services as client
    if (clientServicesVisible) {
      await page.click('a[href="/services"]');
      await page.waitForTimeout(2000);
      
      // Client should only see their services
      const clientServiceCount = await page.locator('[class*="cursor-pointer"]').count();
      console.log(`   Client sees ${clientServiceCount} services (should be their own only)`);
      
      if (clientServiceCount > 0) {
        results.passed.push('✅ Client can view their services');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    results.failed.push(`❌ Test error: ${error.message}`);
  }
  
  // Take final screenshot
  await page.screenshot({ 
    path: '/Users/zachwieder/Documents/CODING MAIN/final-agency/phase7-integration.png',
    fullPage: true 
  });
  console.log('\n📸 Screenshot saved: phase7-integration.png');
  
  await browser.close();
  
  // ========================================
  // FINAL RESULTS
  // ========================================
  console.log('\n' + '=' + '='.repeat(70));
  console.log('\n📊 PHASE 7 INTEGRATION TEST RESULTS\n');
  
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
  
  // Integration Checklist
  console.log('\n✨ INTEGRATION CHECKLIST:');
  const features = [
    'Navigation Integration',
    'Dashboard Widgets', 
    'Services Widget',
    'Loading Skeletons',
    'Performance Optimization',
    'Role-Based Access',
    'Database Indexes'
  ];
  
  features.forEach(feature => {
    const hasPassed = results.passed.some(r => 
      r.toLowerCase().includes(feature.toLowerCase().split(' ')[0])
    );
    console.log(`   ${hasPassed ? '✅' : '⚠️ '} ${feature}`);
  });
  
  console.log('\n' + '=' + '='.repeat(70));
  
  if (passRate === 100) {
    console.log('\n🎉🎉🎉 PERFECT! PHASE 7 COMPLETE! 🎉🎉🎉');
    console.log('Integration and polish implementation successful!');
  } else if (passRate >= 90) {
    console.log('\n✅ EXCELLENT! Phase 7 nearly complete!');
  } else if (passRate >= 80) {
    console.log('\n⚠️  GOOD! Most integration features working.');
  } else {
    console.log('\n❌ NEEDS WORK! Integration needs improvement.');
  }
  
  process.exit(passRate >= 90 ? 0 : 1);
}

// Run the test
testPhase7Integration().catch(console.error);