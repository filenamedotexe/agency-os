#!/usr/bin/env node

/**
 * Test Messages Page Responsiveness
 * Tests the /messages page across all viewport sizes with proper authentication
 */

const { chromium } = require('playwright');

console.log('📱 Testing Messages Page Responsiveness');
console.log('========================================\n');

const TEST_URL = 'http://localhost:3000';
const VIEWPORTS = [
  { name: 'Mobile Small', width: 320, height: 568 },
  { name: 'Mobile Medium', width: 375, height: 667 },
  { name: 'Mobile Large', width: 414, height: 896 },
  { name: 'Tablet Portrait', width: 768, height: 1024 },
  { name: 'Tablet Landscape', width: 1024, height: 768 },
  { name: 'Desktop Small', width: 1280, height: 720 },
  { name: 'Desktop Medium', width: 1440, height: 900 },
  { name: 'Desktop Large', width: 1920, height: 1080 },
  { name: 'Desktop 4K', width: 3840, height: 2160 }
];

async function testResponsiveness() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = [];
  
  try {
    // Login first with proper wait
    console.log('🔐 Logging in as admin...');
    await page.goto(`${TEST_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Fill login form
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Click submit and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);
    
    // Wait for dashboard to load
    await page.waitForTimeout(3000);
    
    // Verify we're logged in
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('❌ Login failed - still on login page');
      return;
    }
    console.log('✅ Logged in successfully - redirected to:', currentUrl);
    
    // Navigate to messages page and wait for it to fully load
    console.log('🔄 Navigating to messages page...');
    await page.goto(`${TEST_URL}/messages`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Verify we're on the messages page
    const messagesUrl = page.url();
    if (!messagesUrl.includes('/messages')) {
      console.log('❌ Failed to navigate to messages page');
      console.log('Current URL:', messagesUrl);
      return;
    }
    console.log('✅ On messages page\n');
    
    // Wait for content to load
    await page.waitForSelector('h2:has-text("Messages"), h1:has-text("Messages")', { timeout: 10000 }).catch(() => {
      console.log('⚠️ Messages header not found, continuing anyway...');
    });
    
    for (const viewport of VIEWPORTS) {
      console.log(`\n📐 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      console.log('─'.repeat(50));
      
      await page.setViewportSize(viewport);
      await page.waitForTimeout(1500); // Give more time for responsive changes
      
      const testResult = {
        viewport: viewport.name,
        width: viewport.width,
        height: viewport.height,
        tests: {}
      };
      
      // Test 1: Check for horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      testResult.tests.noHorizontalScroll = !hasHorizontalScroll;
      console.log(`  Horizontal scroll: ${hasHorizontalScroll ? '❌ Present' : '✅ None'}`);
      
      // Test 2: Check mobile menu visibility (for viewports < 1024px)
      if (viewport.width < 1024) {
        // Look for mobile menu button (hamburger icon)
        const mobileMenuButton = await page.$('button:has(svg), button:has([class*="Menu"])')
          .catch(() => null);
        testResult.tests.mobileMenuVisible = !!mobileMenuButton;
        console.log(`  Mobile menu button: ${mobileMenuButton ? '✅ Visible' : '❌ Missing'}`);
        
        // Test mobile menu functionality
        if (mobileMenuButton) {
          try {
            await mobileMenuButton.click();
            await page.waitForTimeout(1000);
            
            // Check for sheet/modal/drawer
            const sheet = await page.$('[role="dialog"], [data-state="open"], .sheet-content')
              .catch(() => null);
            testResult.tests.mobileMenuWorks = !!sheet;
            console.log(`  Mobile menu opens: ${sheet ? '✅ Yes' : '❌ No'}`);
            
            if (sheet) {
              // Close the sheet
              await page.keyboard.press('Escape');
              await page.waitForTimeout(500);
            }
          } catch (e) {
            console.log(`  Mobile menu test error: ${e.message}`);
            testResult.tests.mobileMenuWorks = false;
          }
        }
      } else {
        // Desktop should show sidebar
        const sidebar = await page.$('.hidden.lg\\:flex, [class*="lg:flex"]')
          .catch(() => null);
        testResult.tests.desktopSidebarVisible = !!sidebar;
        console.log(`  Desktop sidebar: ${sidebar ? '✅ Visible' : '❌ Missing'}`);
      }
      
      // Test 3: Text readability
      const unreadableText = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const tooSmall = [];
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          if (fontSize > 0 && fontSize < 10 && el.textContent?.trim() && el.offsetParent !== null) {
            tooSmall.push({
              text: el.textContent.substring(0, 50),
              size: fontSize
            });
          }
        });
        return tooSmall;
      });
      testResult.tests.readableText = unreadableText.length === 0;
      console.log(`  Text readability: ${unreadableText.length === 0 ? '✅ Good' : `❌ ${unreadableText.length} elements too small`}`);
      
      // Test 4: Button/Touch target sizes (44x44 minimum for mobile)
      const smallButtons = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, a, [role="button"]');
        const tooSmall = [];
        buttons.forEach(btn => {
          if (btn.offsetParent !== null) { // Only check visible elements
            const rect = btn.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
              tooSmall.push({
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                text: btn.textContent?.substring(0, 20)
              });
            }
          }
        });
        return tooSmall;
      });
      
      const touchTargetOk = viewport.width >= 768 || smallButtons.length <= 2; // Allow a few small buttons
      testResult.tests.touchTargets = touchTargetOk;
      console.log(`  Touch targets: ${touchTargetOk ? '✅ Adequate' : `❌ ${smallButtons.length} targets too small`}`);
      
      // Test 5: Main content visibility
      const mainContent = await page.$('.flex-1, main, [role="main"]');
      const contentVisible = mainContent ? await mainContent.isVisible() : false;
      testResult.tests.contentVisible = contentVisible;
      console.log(`  Main content: ${contentVisible ? '✅ Visible' : '❌ Hidden'}`);
      
      // Test 6: Chat input accessibility
      const chatInput = await page.$('textarea, input[type="text"][placeholder*="message"], input[type="text"][placeholder*="Message"]');
      const inputAccessible = chatInput ? await chatInput.isVisible() : false;
      testResult.tests.inputAccessible = inputAccessible;
      console.log(`  Chat input: ${inputAccessible ? '✅ Accessible' : '❌ Not accessible'}`);
      
      // Test 7: Messages area visibility
      const messagesArea = await page.$('[class*="scroll"], [class*="messages"], [class*="conversation"]');
      const messagesVisible = messagesArea ? await messagesArea.isVisible() : false;
      testResult.tests.messagesVisible = messagesVisible;
      console.log(`  Messages area: ${messagesVisible ? '✅ Visible' : '❌ Hidden'}`);
      
      // Calculate score
      const passed = Object.values(testResult.tests).filter(Boolean).length;
      const total = Object.keys(testResult.tests).length;
      const score = Math.round((passed / total) * 100);
      testResult.score = score;
      
      console.log(`\n  📊 Score: ${score}% (${passed}/${total} tests passed)`);
      
      results.push(testResult);
    }
    
    // Summary
    console.log('\n\n🎯 RESPONSIVENESS TEST SUMMARY');
    console.log('================================\n');
    
    results.forEach(result => {
      const emoji = result.score === 100 ? '🎉' : result.score >= 80 ? '✅' : result.score >= 60 ? '⚠️' : '❌';
      console.log(`${emoji} ${result.viewport}: ${result.score}%`);
    });
    
    const averageScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
    console.log(`\n📊 Overall Score: ${averageScore}%`);
    
    if (averageScore >= 90) {
      console.log('🎉 EXCELLENT - Fully responsive across all viewports');
    } else if (averageScore >= 75) {
      console.log('✅ GOOD - Mostly responsive with minor issues');
    } else if (averageScore >= 60) {
      console.log('⚠️ NEEDS IMPROVEMENT - Several responsiveness issues');
    } else {
      console.log('❌ POOR - Major responsiveness issues need fixing');
    }
    
    // Detailed issues if score is low
    if (averageScore < 75) {
      console.log('\n⚠️ ISSUES TO FIX:');
      const commonIssues = new Set();
      results.forEach(r => {
        Object.entries(r.tests).forEach(([test, passed]) => {
          if (!passed) commonIssues.add(test);
        });
      });
      commonIssues.forEach(issue => {
        console.log(`  - ${issue.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      });
    }
    
    // Keep browser open for manual inspection
    console.log('\n⏰ Browser will remain open for 20 seconds for inspection...');
    await page.waitForTimeout(20000);
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('Stack:', error.stack);
  } finally {
    await browser.close();
  }
}

// Run the test
testResponsiveness().catch(console.error);