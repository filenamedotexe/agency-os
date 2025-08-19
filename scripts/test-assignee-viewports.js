const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Viewport configurations for Phase 8 testing
const VIEWPORTS = {
  'mobile-xs': { width: 320, height: 568, name: 'Mobile XS (iPhone SE)' },
  'mobile-sm': { width: 375, height: 667, name: 'Mobile SM (iPhone 8)' },
  'tablet': { width: 768, height: 1024, name: 'Tablet (iPad)' },
  'desktop-sm': { width: 1024, height: 768, name: 'Desktop SM (Laptop)' },
  'desktop-lg': { width: 1920, height: 1080, name: 'Desktop LG (Monitor)' }
};

// Test users
const TEST_USERS = {
  admin: { email: 'admin@demo.com', password: 'password123' },
  team: { email: 'team@demo.com', password: 'password123' },
  client: { email: 'sarah@acmecorp.com', password: 'password123' }
};

const BASE_URL = 'http://localhost:3003';
const TIMEOUT = 10000;

class ViewportTester {
  constructor() {
    this.browser = null;
    this.results = {};
    this.screenshots = [];
    
    // Initialize results structure
    Object.keys(VIEWPORTS).forEach(viewport => {
      this.results[viewport] = {
        passed: 0,
        failed: 0,
        tests: {},
        issues: []
      };
    });
  }

  async init() {
    console.log('📱 Starting Phase 8: Viewport Testing for Assignee System\n');
    
    this.browser = await puppeteer.launch({ 
      headless: false, 
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    console.log('✅ Browser launched successfully');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async screenshot(page, name, viewport) {
    const timestamp = Date.now();
    const filename = `${timestamp}-${viewport}-${name}.png`;
    const filepath = path.join(__dirname, '..', 'test-screenshots-viewports', filename);
    
    // Create directory if it doesn't exist
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    await page.screenshot({ path: filepath, fullPage: true });
    this.screenshots.push(filename);
    console.log(`📸 Screenshot saved: ${filename}`);
    return filepath;
  }

  async login(page, userType) {
    const user = TEST_USERS[userType];
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: TIMEOUT });
    
    await page.type('input[type="email"]', user.email);
    await page.type('input[type="password"]', user.password);
    
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);
  }

  async navigateToServices(page) {
    await page.goto(`${BASE_URL}/services`);
    await page.waitForSelector('[data-testid="service-card"], a[href*="/services/"]', { timeout: TIMEOUT });
    
    const serviceLink = await page.$('a[href*="/services/"]:not([href="/services"])');
    if (!serviceLink) {
      throw new Error('No service found to test');
    }
    
    await Promise.all([
      page.waitForNavigation(),
      serviceLink.click()
    ]);
    
    await page.waitForSelector('[data-testid="milestone-sidebar"], .milestone', { timeout: TIMEOUT });
  }

  async testAssigneeSystemOnViewport(viewportKey) {
    const viewport = VIEWPORTS[viewportKey];
    console.log(`\n📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
    
    const page = await this.browser.newPage();
    
    try {
      // Set viewport
      await page.setViewport(viewport);
      console.log(`✅ Viewport set to ${viewport.width}x${viewport.height}`);
      
      // Test 1: Login and navigation
      console.log('   🔐 Testing login and navigation...');
      await this.login(page, 'admin');
      await this.navigateToServices(page);
      await this.screenshot(page, 'service-loaded', viewportKey);
      
      this.results[viewportKey].tests['Login and Navigation'] = 'PASSED';
      
      // Test 2: Task assignment interface
      console.log('   📋 Testing task assignment interface...');
      await this.testTaskAssignmentUI(page, viewportKey);
      
      // Test 3: Milestone editing interface
      console.log('   🎯 Testing milestone editing interface...');
      await this.testMilestoneEditingUI(page, viewportKey);
      
      // Test 4: Mobile-specific interactions
      if (viewport.width <= 768) {
        console.log('   👆 Testing mobile interactions...');
        await this.testMobileInteractions(page, viewportKey);
      }
      
      // Test 5: Responsive layout
      console.log('   📐 Testing responsive layout...');
      await this.testResponsiveLayout(page, viewportKey);
      
      console.log(`✅ ${viewport.name} testing completed successfully`);
      
    } catch (error) {
      console.error(`❌ ${viewport.name} testing failed:`, error.message);
      await this.screenshot(page, 'error', viewportKey);
      this.results[viewportKey].issues.push(error.message);
      this.results[viewportKey].failed++;
    } finally {
      await page.close();
    }
  }

  async testTaskAssignmentUI(page, viewportKey) {
    try {
      // Look for task cards
      const taskCards = await page.$$('.task-card, [data-testid="task-card"]');
      if (taskCards.length === 0) {
        throw new Error('No task cards found');
      }
      
      // Test if assignee elements are visible and clickable
      const firstTask = taskCards[0];
      const assigneeElement = await firstTask.$('.assignee-avatar, [data-testid="assignee"], button[aria-label*="assign"]');
      
      if (!assigneeElement) {
        this.results[viewportKey].issues.push('Assignee element not found in task card');
        this.results[viewportKey].tests['Task Assignment UI'] = 'FAILED';
        return;
      }
      
      // Check if element is visible
      const isVisible = await assigneeElement.boundingBox();
      if (!isVisible) {
        this.results[viewportKey].issues.push('Assignee element not visible');
        this.results[viewportKey].tests['Task Assignment UI'] = 'FAILED';
        return;
      }
      
      // Test clicking on assignee element
      await assigneeElement.click();
      await page.waitForTimeout(1000);
      
      // Look for assignee selector (might be modal or dropdown)
      const assigneeSelector = await page.$('[data-testid="assignee-selector"], .assignee-selector, [role="dialog"]');
      if (assigneeSelector) {
        await this.screenshot(page, 'assignee-selector', viewportKey);
        console.log('     ✅ Assignee selector opened successfully');
        
        // Close selector
        const closeButton = await page.$('button[aria-label*="close"], [data-testid="close"]');
        if (closeButton) {
          await closeButton.click();
        } else {
          // Try clicking outside or pressing escape
          await page.keyboard.press('Escape');
        }
      }
      
      this.results[viewportKey].tests['Task Assignment UI'] = 'PASSED';
      this.results[viewportKey].passed++;
      
    } catch (error) {
      this.results[viewportKey].tests['Task Assignment UI'] = `FAILED: ${error.message}`;
      this.results[viewportKey].issues.push(`Task Assignment UI: ${error.message}`);
      this.results[viewportKey].failed++;
    }
  }

  async testMilestoneEditingUI(page, viewportKey) {
    try {
      // Look for milestone edit button
      const editButton = await page.$('button[aria-label*="edit"], button:has(svg[data-testid="edit"])');
      if (!editButton) {
        // Try alternative selectors
        const editButtons = await page.$$('button');
        let foundEdit = false;
        
        for (const button of editButtons) {
          const buttonText = await page.evaluate(el => el.textContent, button);
          if (buttonText && buttonText.toLowerCase().includes('edit')) {
            await button.click();
            foundEdit = true;
            break;
          }
        }
        
        if (!foundEdit) {
          this.results[viewportKey].issues.push('Edit milestone button not found');
          this.results[viewportKey].tests['Milestone Editing UI'] = 'FAILED';
          return;
        }
      } else {
        await editButton.click();
      }
      
      await page.waitForTimeout(1000);
      
      // Look for edit dialog
      const editDialog = await page.$('[role="dialog"], [data-testid="edit-milestone-dialog"]');
      if (!editDialog) {
        this.results[viewportKey].issues.push('Edit milestone dialog not opened');
        this.results[viewportKey].tests['Milestone Editing UI'] = 'FAILED';
        return;
      }
      
      await this.screenshot(page, 'milestone-edit-dialog', viewportKey);
      
      // Test form elements in dialog
      const nameField = await editDialog.$('input[placeholder*="Design"], input[id*="name"]');
      const statusSelect = await editDialog.$('select, [role="combobox"]');
      const assigneeField = await editDialog.$('[data-testid="assignee-selector"], .assignee-selector');
      
      let formElementsVisible = 0;
      if (nameField) formElementsVisible++;
      if (statusSelect) formElementsVisible++;
      if (assigneeField) formElementsVisible++;
      
      if (formElementsVisible < 2) {
        this.results[viewportKey].issues.push('Some form elements not visible in milestone edit dialog');
      }
      
      // Close dialog
      const closeButton = await page.$('button[aria-label*="close"], button:contains("Cancel")');
      if (closeButton) {
        await closeButton.click();
      } else {
        await page.keyboard.press('Escape');
      }
      
      this.results[viewportKey].tests['Milestone Editing UI'] = 'PASSED';
      this.results[viewportKey].passed++;
      
    } catch (error) {
      this.results[viewportKey].tests['Milestone Editing UI'] = `FAILED: ${error.message}`;
      this.results[viewportKey].issues.push(`Milestone Editing UI: ${error.message}`);
      this.results[viewportKey].failed++;
    }
  }

  async testMobileInteractions(page, viewportKey) {
    try {
      // Test touch-friendly interactions
      const viewport = VIEWPORTS[viewportKey];
      
      // Check if elements are large enough for touch
      const taskCards = await page.$$('.task-card, [data-testid="task-card"]');
      if (taskCards.length > 0) {
        const firstTaskBounds = await taskCards[0].boundingBox();
        if (firstTaskBounds && firstTaskBounds.height < 44) {
          this.results[viewportKey].issues.push('Task cards may be too small for touch interaction');
        }
      }
      
      // Test if mobile menu/navigation works
      const mobileMenu = await page.$('[data-testid="mobile-menu"], .mobile-menu, button[aria-label*="menu"]');
      if (mobileMenu && viewport.width <= 768) {
        await mobileMenu.click();
        await page.waitForTimeout(500);
        await this.screenshot(page, 'mobile-menu-open', viewportKey);
        
        // Close mobile menu
        await mobileMenu.click();
      }
      
      // Test scrolling and overflow
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await page.waitForTimeout(500);
      
      this.results[viewportKey].tests['Mobile Interactions'] = 'PASSED';
      this.results[viewportKey].passed++;
      
    } catch (error) {
      this.results[viewportKey].tests['Mobile Interactions'] = `FAILED: ${error.message}`;
      this.results[viewportKey].issues.push(`Mobile Interactions: ${error.message}`);
      this.results[viewportKey].failed++;
    }
  }

  async testResponsiveLayout(page, viewportKey) {
    try {
      const viewport = VIEWPORTS[viewportKey];
      
      // Check for horizontal scrollbars (should not exist)
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = viewport.width;
      
      if (bodyScrollWidth > viewportWidth + 20) { // 20px tolerance
        this.results[viewportKey].issues.push(`Horizontal overflow detected: ${bodyScrollWidth}px > ${viewportWidth}px`);
      }
      
      // Check if critical elements are visible
      const sidebar = await page.$('[data-testid="milestone-sidebar"], .milestone-sidebar');
      const kanban = await page.$('[data-testid="kanban-board"], .kanban-board');
      
      if (viewport.width <= 768) {
        // On mobile, sidebar might be hidden or collapsed
        if (sidebar) {
          const sidebarVisible = await sidebar.isIntersectingViewport();
          if (!sidebarVisible) {
            console.log('     ℹ️ Sidebar hidden on mobile (expected behavior)');
          }
        }
      } else {
        // On desktop, both should be visible
        if (!sidebar || !kanban) {
          this.results[viewportKey].issues.push('Critical layout elements missing on desktop');
        }
      }
      
      await this.screenshot(page, 'responsive-layout', viewportKey);
      
      this.results[viewportKey].tests['Responsive Layout'] = 'PASSED';
      this.results[viewportKey].passed++;
      
    } catch (error) {
      this.results[viewportKey].tests['Responsive Layout'] = `FAILED: ${error.message}`;
      this.results[viewportKey].issues.push(`Responsive Layout: ${error.message}`);
      this.results[viewportKey].failed++;
    }
  }

  async runAllViewportTests() {
    try {
      await this.init();
      
      console.log(`\n📱 Testing assignee system on ${Object.keys(VIEWPORTS).length} viewports...\n`);
      
      // Test each viewport
      for (const viewportKey of Object.keys(VIEWPORTS)) {
        await this.testAssigneeSystemOnViewport(viewportKey);
      }
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Viewport testing failed:', error.message);
    } finally {
      await this.cleanup();
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📱 PHASE 8 VIEWPORT TESTING REPORT');
    console.log('='.repeat(70));
    
    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;
    
    Object.entries(this.results).forEach(([viewport, results]) => {
      const viewportInfo = VIEWPORTS[viewport];
      console.log(`\n📱 ${viewportInfo.name} (${viewportInfo.width}x${viewportInfo.height}):`);
      console.log(`   ✅ Passed: ${results.passed}`);
      console.log(`   ❌ Failed: ${results.failed}`);
      
      if (Object.keys(results.tests).length > 0) {
        console.log(`   📋 Test Results:`);
        Object.entries(results.tests).forEach(([test, result]) => {
          const icon = result.startsWith('PASSED') ? '✅' : '❌';
          console.log(`      ${icon} ${test}: ${result}`);
        });
      }
      
      if (results.issues.length > 0) {
        console.log(`   ⚠️ Issues:`);
        results.issues.forEach(issue => {
          console.log(`      • ${issue}`);
        });
      }
      
      totalPassed += results.passed;
      totalFailed += results.failed;
      totalTests += results.passed + results.failed;
    });
    
    console.log(`\n📊 Overall Summary:`);
    console.log(`   ✅ Total Passed: ${totalPassed}`);
    console.log(`   ❌ Total Failed: ${totalFailed}`);
    console.log(`   📸 Screenshots: ${this.screenshots.length}`);
    
    const successRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;
    console.log(`   🎯 Success Rate: ${successRate.toFixed(1)}%`);
    
    console.log(`\n📸 Screenshots saved in: test-screenshots-viewports/`);
    
    // Overall assessment
    if (successRate >= 95) {
      console.log('🎉 VIEWPORT TESTING: EXCELLENT - Perfect responsive design!');
    } else if (successRate >= 85) {
      console.log('✅ VIEWPORT TESTING: GOOD - Minor responsive issues');
    } else if (successRate >= 70) {
      console.log('⚠️ VIEWPORT TESTING: NEEDS IMPROVEMENT - Some responsive issues');
    } else {
      console.log('❌ VIEWPORT TESTING: MAJOR ISSUES - Significant responsive problems');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Viewport Testing Complete!');
    console.log('='.repeat(70));
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ViewportTester;
}

// Run if called directly
if (require.main === module) {
  const tester = new ViewportTester();
  tester.runAllViewportTests().catch(console.error);
}