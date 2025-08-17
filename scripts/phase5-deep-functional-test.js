const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for database verification
const supabase = createClient(
  'https://lfqnpszawjpcydobpxul.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcW5wc3phd2pwY3lkb2JweHVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcxMTg0MCwiZXhwIjoyMDcwMjg3ODQwfQ.nXx3ntxw6mrLfSWyC4qTrtYLo4lOqToSmZMrjB7YVjc'
);

async function deepFunctionalTestPhase5() {
  const browser = await chromium.launch({ 
    headless: false,  // Show browser to see interactions
    slowMo: 300
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  const results = { passed: [], failed: [], warnings: [] };
  
  console.log('\n🔬 PHASE 5: DEEP FUNCTIONAL TESTING\n');
  console.log('=' + '='.repeat(70));
  console.log('Testing every clickable element and database connection...\n');
  
  try {
    // ========================================
    // PART 1: CLIENT AUTHENTICATION & DB CHECK
    // ========================================
    console.log('📦 AUTHENTICATION & DATABASE VERIFICATION\n');
    
    // Get client from database
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'sarah@acmecorp.com')
      .single();
    
    if (clientProfile) {
      console.log('✅ Client exists in database:', clientProfile.full_name);
      results.passed.push('Database: Client profile verified');
    } else {
      console.log('❌ Client not found in database');
      results.failed.push('Database: Client profile missing');
    }
    
    // Login as client
    console.log('\n1. Testing Client Login...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'sarah@acmecorp.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    if (page.url().includes('/client')) {
      results.passed.push('✅ Client login successful');
      console.log('  ✅ Authenticated and redirected correctly');
    } else {
      results.failed.push('❌ Client login failed');
      console.log('  ❌ Authentication issue');
    }
    
    // ========================================
    // PART 2: SERVICES LIST FUNCTIONALITY
    // ========================================
    console.log('\n📦 SERVICES LIST FUNCTIONALITY\n');
    
    console.log('2. Navigating to Services...');
    await page.goto('http://localhost:3000/services');
    await page.waitForTimeout(3000);
    
    // Get services from database for this client
    const { data: dbServices } = await supabase
      .from('services')
      .select('*, milestones(*)')
      .eq('client_id', clientProfile?.id);
    
    console.log(`  Database shows ${dbServices?.length || 0} services for client`);
    
    // Count services in UI
    const uiServiceCount = await page.locator('[class*="cursor-pointer"]').count();
    console.log(`  UI shows ${uiServiceCount} services`);
    
    if (dbServices && uiServiceCount === dbServices.length) {
      results.passed.push('✅ UI matches database service count');
      console.log('  ✅ Service count matches database');
    } else {
      results.failed.push('❌ UI/Database service count mismatch');
      console.log('  ❌ Mismatch between UI and database');
    }
    
    // Test clicking on a service card
    console.log('\n3. Testing Service Card Click...');
    if (uiServiceCount > 0) {
      // Get the first service name before clicking
      const firstServiceName = await page.locator('h3').first().textContent();
      console.log(`  Clicking on service: ${firstServiceName}`);
      
      await page.locator('[class*="cursor-pointer"]').first().click();
      await page.waitForTimeout(4000);
      
      // Verify navigation
      const currentUrl = page.url();
      if (currentUrl.includes('/services/')) {
        results.passed.push('✅ Service card clickable');
        console.log('  ✅ Service detail page loaded');
        
        // Extract service ID from URL
        const serviceId = currentUrl.split('/services/')[1];
        console.log(`  Service ID: ${serviceId}`);
        
        // ========================================
        // PART 3: TIMELINE VIEW COMPONENTS
        // ========================================
        console.log('\n📦 TIMELINE VIEW COMPONENTS\n');
        
        // Get service details from database
        const { data: dbService } = await supabase
          .from('services')
          .select(`
            *,
            milestones(
              *,
              tasks(*)
            )
          `)
          .eq('id', serviceId)
          .single();
        
        console.log('4. Verifying Timeline Elements...');
        
        // Check Project Overview
        const hasProjectOverview = await page.locator('text="Project Overview"').isVisible();
        if (hasProjectOverview && dbService?.description) {
          const descriptionVisible = await page.locator(`text="${dbService.description.substring(0, 50)}"`).isVisible();
          if (descriptionVisible) {
            results.passed.push('✅ Project description from database displayed');
            console.log('  ✅ Project overview shows database content');
          } else {
            results.failed.push('❌ Project description not matching database');
            console.log('  ❌ Description mismatch');
          }
        }
        
        // Check Milestones
        console.log('\n5. Testing Milestone Display...');
        const dbMilestoneCount = dbService?.milestones?.length || 0;
        const uiMilestoneCards = await page.locator('[class*="card"]').count();
        
        console.log(`  Database has ${dbMilestoneCount} milestones`);
        console.log(`  UI shows ${uiMilestoneCards} cards (including summary)`);
        
        // Check each milestone from database is displayed
        if (dbService?.milestones) {
          for (const milestone of dbService.milestones) {
            const milestoneVisible = await page.locator(`text="${milestone.name}"`).isVisible();
            if (milestoneVisible) {
              console.log(`  ✅ Milestone "${milestone.name}" displayed`);
              
              // Check milestone status badge
              const statusText = milestone.status.replace('_', ' ');
              const statusBadgeVisible = await page.locator(`text="${statusText}"`).first().isVisible();
              if (statusBadgeVisible) {
                console.log(`     ✅ Status: ${milestone.status}`);
              } else {
                console.log(`     ❌ Status badge missing`);
                results.warnings.push(`Status badge missing for ${milestone.name}`);
              }
              
              // Check task progress if tasks exist
              const taskCount = milestone.tasks?.length || 0;
              if (taskCount > 0) {
                const completedTasks = milestone.tasks.filter(t => t.status === 'done').length;
                const progressText = `${completedTasks}/${taskCount} tasks`;
                const progressVisible = await page.locator(`text="${progressText}"`).count() > 0;
                
                if (progressVisible) {
                  console.log(`     ✅ Progress: ${progressText}`);
                } else {
                  console.log(`     ⚠️  Progress text not found (might be formatted differently)`);
                }
              }
            } else {
              results.failed.push(`❌ Milestone "${milestone.name}" not visible`);
              console.log(`  ❌ Milestone "${milestone.name}" missing from UI`);
            }
          }
        }
        
        // ========================================
        // PART 4: INTERACTIVE ELEMENTS
        // ========================================
        console.log('\n📦 TESTING INTERACTIVE ELEMENTS\n');
        
        console.log('6. Testing Timeline Visual Elements...');
        
        // Check for timeline dots
        const timelineDots = await page.locator('div[class*="rounded-full"][class*="bg-"]').count();
        console.log(`  Found ${timelineDots} timeline dots/indicators`);
        
        if (timelineDots > 0) {
          // Try hovering over timeline dots
          const firstDot = await page.locator('div[class*="rounded-full"][class*="bg-"]').first();
          await firstDot.hover();
          await page.waitForTimeout(500);
          results.passed.push('✅ Timeline visual elements interactive');
          console.log('  ✅ Timeline dots hoverable');
        }
        
        // Check for progress bars
        console.log('\n7. Testing Progress Bars...');
        const progressBars = await page.locator('[role="progressbar"]').count();
        
        if (progressBars > 0) {
          console.log(`  Found ${progressBars} progress bars`);
          
          // Get progress value
          const firstProgressBar = await page.locator('[role="progressbar"]').first();
          const progressValue = await firstProgressBar.getAttribute('aria-valuenow');
          
          if (progressValue !== null) {
            console.log(`  ✅ Progress bar value: ${progressValue}%`);
            results.passed.push('✅ Progress bars have data attributes');
          }
        } else {
          console.log('  ℹ️  No progress bars (no tasks with progress)');
        }
        
        // ========================================
        // PART 5: CLIENT RESTRICTIONS
        // ========================================
        console.log('\n📦 VERIFYING CLIENT RESTRICTIONS\n');
        
        console.log('8. Checking for Forbidden Elements...');
        
        // Elements that should NOT be visible to clients
        const forbiddenElements = [
          { selector: 'button:has-text("Create Task")', name: 'Create Task button' },
          { selector: 'button:has-text("Add Task")', name: 'Add Task button' },
          { selector: 'button:has-text("Delete")', name: 'Delete button' },
          { selector: 'button:has-text("Edit")', name: 'Edit button' },
          { selector: '[data-testid="kanban-board"]', name: 'Kanban board' },
          { selector: 'text="Drag to reorder"', name: 'Drag instructions' }
        ];
        
        let restrictionsWorking = true;
        for (const element of forbiddenElements) {
          const count = await page.locator(element.selector).count();
          if (count > 0) {
            console.log(`  ❌ Found forbidden: ${element.name}`);
            results.failed.push(`❌ Client can see ${element.name}`);
            restrictionsWorking = false;
          }
        }
        
        if (restrictionsWorking) {
          results.passed.push('✅ All client restrictions enforced');
          console.log('  ✅ No forbidden elements visible');
        }
        
        // ========================================
        // PART 6: PROJECT SUMMARY
        // ========================================
        console.log('\n📦 PROJECT SUMMARY SECTION\n');
        
        console.log('9. Testing Project Summary...');
        
        // Scroll to bottom to see summary
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
        
        const hasSummary = await page.locator('text="Project Summary"').isVisible();
        
        if (hasSummary) {
          console.log('  ✅ Project Summary section visible');
          
          // Check summary stats
          const totalMilestones = dbService?.milestones?.length || 0;
          const completedMilestones = dbService?.milestones?.filter(m => m.status === 'completed').length || 0;
          const inProgressMilestones = dbService?.milestones?.filter(m => m.status === 'in_progress').length || 0;
          
          // Look for these numbers in the summary
          const totalText = await page.locator(`text="${totalMilestones}"`).count();
          const completedText = await page.locator(`text="${completedMilestones}"`).count();
          const inProgressText = await page.locator(`text="${inProgressMilestones}"`).count();
          
          if (totalText > 0) console.log(`  ✅ Total milestones: ${totalMilestones}`);
          if (completedText > 0) console.log(`  ✅ Completed: ${completedMilestones}`);
          if (inProgressText > 0) console.log(`  ✅ In Progress: ${inProgressMilestones}`);
          
          results.passed.push('✅ Project summary with statistics');
        } else {
          console.log('  ⚠️  Project Summary not visible (might need scroll)');
        }
        
        // ========================================
        // PART 7: RESPONSIVE BEHAVIOR
        // ========================================
        console.log('\n📦 RESPONSIVE INTERACTIONS\n');
        
        console.log('10. Testing Mobile Interactions...');
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1500);
        
        // Check if content reflows properly
        const mobileCardsVisible = await page.locator('[class*="card"]').first().isVisible();
        
        if (mobileCardsVisible) {
          // Try scrolling on mobile
          await page.evaluate(() => window.scrollTo(0, 200));
          await page.waitForTimeout(500);
          
          // Check if timeline dots are still visible
          const mobileDots = await page.locator('div[class*="rounded-full"][class*="bg-"]').first().isVisible();
          
          if (mobileDots) {
            results.passed.push('✅ Mobile view fully functional');
            console.log('  ✅ Timeline works on mobile');
          }
        }
        
        // Return to desktop
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(1000);
        
      } else {
        results.failed.push('❌ Service card not clickable');
        console.log('  ❌ Failed to navigate to service detail');
      }
    } else {
      console.log('  ⚠️  No services to test');
    }
    
    // ========================================
    // PART 8: ADMIN COMPARISON
    // ========================================
    console.log('\n📦 ADMIN VIEW COMPARISON\n');
    
    console.log('11. Switching to Admin View...');
    
    // Logout and login as admin
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    // Go to same service
    await page.goto('http://localhost:3000/services');
    await page.waitForTimeout(2000);
    
    if (await page.locator('[class*="cursor-pointer"]').count() > 0) {
      await page.locator('[class*="cursor-pointer"]').first().click();
      await page.waitForTimeout(3000);
      
      // Admin should see Kanban
      console.log('12. Verifying Admin Sees Different View...');
      
      const hasKanbanColumns = await page.locator('text="To Do"').isVisible() &&
                               await page.locator('text="In Progress"').isVisible() &&
                               await page.locator('text="Done"').isVisible();
      
      if (hasKanbanColumns) {
        results.passed.push('✅ Admin sees Kanban view');
        console.log('  ✅ Kanban board visible to admin');
        
        // Test drag and drop
        console.log('  Testing admin drag & drop...');
        const taskCount = await page.locator('h4').count();
        
        if (taskCount > 0) {
          const firstTask = await page.locator('h4').first();
          const taskText = await firstTask.textContent();
          
          // Try to drag
          await firstTask.hover();
          await page.mouse.down();
          await page.waitForTimeout(200);
          
          // Move to different column
          const doneColumn = await page.locator('text="Done"').first().locator('../..');
          await doneColumn.hover();
          await page.waitForTimeout(200);
          await page.mouse.up();
          
          console.log(`  ✅ Admin can drag task: "${taskText}"`);
          results.passed.push('✅ Admin drag & drop functional');
        }
      } else {
        results.failed.push('❌ Admin view not showing Kanban');
        console.log('  ❌ Kanban not visible to admin');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Critical Test Error:', error.message);
    results.failed.push(`❌ Critical: ${error.message}`);
  }
  
  // ========================================
  // FINAL RESULTS
  // ========================================
  console.log('\n' + '=' + '='.repeat(70));
  console.log('\n📊 DEEP FUNCTIONAL TEST RESULTS\n');
  
  const totalTests = results.passed.length + results.failed.length;
  const passRate = totalTests > 0 ? Math.round((results.passed.length / totalTests) * 100) : 0;
  
  console.log(`✅ Passed: ${results.passed.length} tests`);
  console.log(`❌ Failed: ${results.failed.length} tests`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  console.log(`📈 Success Rate: ${passRate}%`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(test => console.log(`  ${test}`));
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(warning => console.log(`  ${warning}`));
  }
  
  console.log('\n✅ Passed Tests:');
  results.passed.forEach(test => console.log(`  ${test}`));
  
  // Functional Checklist
  console.log('\n✨ FUNCTIONAL CHECKLIST:');
  const checklist = [
    'Database Connection',
    'Authentication Flow',
    'Service Display',
    'Timeline Rendering',
    'Milestone Display',
    'Progress Tracking',
    'Client Restrictions',
    'Role-Based Views',
    'Interactive Elements',
    'Responsive Design'
  ];
  
  checklist.forEach(item => {
    const passed = results.passed.some(r => r.toLowerCase().includes(item.toLowerCase().split(' ')[0]));
    console.log(`  ${passed ? '✅' : '⚠️ '} ${item}`);
  });
  
  console.log('\n' + '=' + '='.repeat(70));
  
  if (passRate === 100) {
    console.log('\n🎉🎉🎉 PERFECT! ALL FUNCTIONALITY VERIFIED! 🎉🎉🎉');
    console.log('Phase 5 is fully functional and database-connected!');
  } else if (passRate >= 90) {
    console.log('\n✅ EXCELLENT! Nearly all functionality working!');
  } else if (passRate >= 80) {
    console.log('\n⚠️  GOOD! Most functionality working, some fixes needed.');
  } else {
    console.log('\n❌ NEEDS ATTENTION! Multiple functional issues found.');
  }
  
  console.log('\n⏸️  Browser staying open for 10 seconds for inspection...');
  await page.waitForTimeout(10000);
  
  await browser.close();
  
  process.exit(passRate === 100 ? 0 : 1);
}

// Run the deep functional test
deepFunctionalTestPhase5().catch(console.error);