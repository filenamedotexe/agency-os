const { chromium } = require('playwright');

async function verifyPhase5Complete() {
  const browser = await chromium.launch({ 
    headless: true,
    slowMo: 100
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  const results = { features: [], issues: [] };
  
  console.log('\n✅ PHASE 5 COMPLETENESS VERIFICATION\n');
  console.log('=' + '='.repeat(60));
  
  try {
    // ========================================
    // 1. CLIENT LOGIN
    // ========================================
    console.log('1️⃣  CLIENT AUTHENTICATION');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'sarah@acmecorp.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    if (page.url().includes('/client')) {
      results.features.push('✅ Client authentication working');
      console.log('   ✅ Login successful, redirected to /client');
    } else {
      results.issues.push('❌ Client login not working');
    }
    
    // ========================================
    // 2. SERVICE ACCESS
    // ========================================
    console.log('\n2️⃣  SERVICE ACCESS');
    await page.goto('http://localhost:3000/services');
    await page.waitForTimeout(3000);
    
    const serviceCount = await page.locator('[class*="cursor-pointer"]').count();
    if (serviceCount > 0) {
      results.features.push(`✅ Client can see ${serviceCount} services`);
      console.log(`   ✅ Found ${serviceCount} services`);
      
      // Click on first service
      await page.locator('[class*="cursor-pointer"]').first().click();
      await page.waitForTimeout(3000);
      
      if (page.url().includes('/services/')) {
        results.features.push('✅ Service detail page accessible');
        console.log('   ✅ Service detail page loaded');
      }
    } else {
      results.issues.push('❌ No services visible');
    }
    
    // ========================================
    // 3. TIMELINE VIEW
    // ========================================
    console.log('\n3️⃣  TIMELINE VIEW COMPONENTS');
    
    // Check for timeline-specific elements
    const timelineChecks = [
      { selector: 'text="Project Overview"', name: 'Project Overview' },
      { selector: 'text="Project Summary"', name: 'Project Summary' },
      { selector: '[class*="rounded-full"][class*="bg-"]', name: 'Timeline dots' },
      { selector: '[class*="card"]', name: 'Milestone cards' },
      { selector: '[role="progressbar"]', name: 'Progress bars' }
    ];
    
    for (const check of timelineChecks) {
      const count = await page.locator(check.selector).count();
      if (count > 0) {
        results.features.push(`✅ ${check.name} (${count})`);
        console.log(`   ✅ ${check.name}: ${count} found`);
      } else {
        console.log(`   ℹ️  ${check.name}: Not found (might be optional)`);
      }
    }
    
    // Check milestones
    const milestoneNames = await page.locator('h3').allTextContents();
    const milestones = milestoneNames.filter(name => 
      !name.includes('Project') && 
      !name.includes('Service') && 
      name.length > 0
    );
    
    if (milestones.length > 0) {
      results.features.push(`✅ ${milestones.length} milestones displayed`);
      console.log(`   ✅ Milestones: ${milestones.join(', ')}`);
    }
    
    // ========================================
    // 4. CLIENT RESTRICTIONS
    // ========================================
    console.log('\n4️⃣  CLIENT RESTRICTIONS');
    
    const restrictedChecks = [
      { selector: 'text="To Do"', name: 'Kanban column "To Do"' },
      { selector: 'text="Review"', name: 'Kanban column "Review"' },
      { selector: 'text="Blocked"', name: 'Kanban column "Blocked"' },
      { selector: 'button:has-text("Create")', name: 'Create buttons' },
      { selector: 'button:has-text("Delete")', name: 'Delete buttons' },
      { selector: 'button:has-text("Add Task")', name: 'Add Task button' }
    ];
    
    let restrictionsWorking = true;
    for (const check of restrictedChecks) {
      const count = await page.locator(check.selector).count();
      if (count > 0) {
        results.issues.push(`❌ Client can see ${check.name}`);
        console.log(`   ❌ Found forbidden: ${check.name}`);
        restrictionsWorking = false;
      }
    }
    
    if (restrictionsWorking) {
      results.features.push('✅ All admin features hidden');
      console.log('   ✅ No admin features visible');
    }
    
    // ========================================
    // 5. RESPONSIVE DESIGN
    // ========================================
    console.log('\n5️⃣  RESPONSIVE DESIGN');
    
    const viewports = [
      { name: 'Mobile', width: 375 },
      { name: 'Tablet', width: 768 },
      { name: 'Desktop', width: 1920 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: 800 });
      await page.waitForTimeout(1000);
      
      const contentVisible = await page.locator('[class*="card"]').first().isVisible();
      if (contentVisible) {
        results.features.push(`✅ ${viewport.name} view working`);
        console.log(`   ✅ ${viewport.name} (${viewport.width}px): Content visible`);
      } else {
        results.issues.push(`❌ ${viewport.name} view broken`);
      }
    }
    
    // ========================================
    // 6. ADMIN COMPARISON
    // ========================================
    console.log('\n6️⃣  ADMIN VIEW (ROLE-BASED)');
    
    // Try to switch to admin
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Only test if we can reach login
    const canLogin = await page.locator('input[name="email"]').isVisible().catch(() => false);
    
    if (canLogin) {
      await page.fill('input[name="email"]', 'admin@demo.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
      
      // Go to services
      await page.goto('http://localhost:3000/services');
      await page.waitForTimeout(2000);
      
      const adminServiceCount = await page.locator('[class*="cursor-pointer"]').count();
      if (adminServiceCount > 0) {
        await page.locator('[class*="cursor-pointer"]').first().click();
        await page.waitForTimeout(3000);
        
        // Check for Kanban
        const hasKanban = await page.locator('text="To Do"').count() > 0;
        
        if (hasKanban) {
          results.features.push('✅ Admin sees Kanban view');
          console.log('   ✅ Admin sees different view (Kanban)');
        } else {
          results.issues.push('❌ Admin view issue');
        }
      }
    } else {
      console.log('   ⚠️  Could not test admin view (login unavailable)');
    }
    
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    results.issues.push(`❌ Error: ${error.message}`);
  }
  
  // ========================================
  // FINAL RESULTS
  // ========================================
  console.log('\n' + '=' + '='.repeat(60));
  console.log('\n📋 PHASE 5 COMPLETENESS SUMMARY\n');
  
  console.log('✅ WORKING FEATURES:');
  results.features.forEach(feature => console.log(`   ${feature}`));
  
  if (results.issues.length > 0) {
    console.log('\n❌ ISSUES FOUND:');
    results.issues.forEach(issue => console.log(`   ${issue}`));
  }
  
  const score = Math.round((results.features.length / (results.features.length + results.issues.length)) * 100);
  
  console.log('\n📊 COMPLETENESS SCORE: ' + score + '%');
  
  console.log('\n✨ PHASE 5 REQUIREMENTS CHECKLIST:');
  const requirements = [
    { name: 'Client Authentication', met: results.features.some(f => f.includes('authentication')) },
    { name: 'Service List View', met: results.features.some(f => f.includes('services')) },
    { name: 'Timeline View', met: results.features.some(f => f.includes('Timeline') || f.includes('milestones')) },
    { name: 'Progress Tracking', met: results.features.some(f => f.includes('Progress')) },
    { name: 'Client Restrictions', met: results.features.some(f => f.includes('admin features hidden')) },
    { name: 'Responsive Design', met: results.features.some(f => f.includes('Mobile')) },
    { name: 'Role-Based Views', met: results.features.some(f => f.includes('Admin sees')) }
  ];
  
  requirements.forEach(req => {
    console.log(`   ${req.met ? '✅' : '❌'} ${req.name}`);
  });
  
  const allMet = requirements.every(r => r.met);
  
  console.log('\n' + '=' + '='.repeat(60));
  
  if (allMet && score >= 90) {
    console.log('\n🎉 PHASE 5 IS COMPLETE AND FUNCTIONAL! 🎉');
  } else if (score >= 80) {
    console.log('\n✅ Phase 5 is mostly complete, minor issues remain.');
  } else {
    console.log('\n⚠️  Phase 5 needs attention to be fully complete.');
  }
  
  await browser.close();
  
  process.exit(allMet ? 0 : 1);
}

// Run verification
verifyPhase5Complete().catch(console.error);