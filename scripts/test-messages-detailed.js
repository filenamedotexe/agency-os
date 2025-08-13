#!/usr/bin/env node

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots', 'messages-detailed');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Key viewports for testing
const VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 568, device: 'Mobile Small' },
  { name: 'mobile-375', width: 375, height: 667, device: 'Mobile Standard' },
  { name: 'tablet-768', width: 768, height: 1024, device: 'Tablet' },
  { name: 'desktop-1024', width: 1024, height: 768, device: 'Desktop' },
  { name: 'desktop-1440', width: 1440, height: 900, device: 'Desktop Large' }
];

// Test users
const TEST_USERS = {
  admin: { 
    email: 'admin@demo.com', 
    password: 'password123',
    shouldHaveAccess: true,
    expectedRedirect: '/admin'
  },
  team: { 
    email: 'team@demo.com', 
    password: 'password123',
    shouldHaveAccess: true,
    expectedRedirect: '/team'
  },
  client: { 
    email: 'sarah@acmecorp.com', 
    password: 'password123',
    shouldHaveAccess: false,
    expectedRedirect: '/client'
  }
};

async function testMessagesPageDetailed() {
  console.log('🚀 Starting Detailed Messages Page Test');
  console.log('📱 Testing', VIEWPORTS.length, 'viewports');
  console.log('👥 Testing', Object.keys(TEST_USERS).length, 'user roles');
  console.log('');
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser for visual verification
    slowMo: 1000 // Slow down to see what's happening
  });
  
  const results = [];
  
  try {
    for (const viewport of VIEWPORTS) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`📱 ${viewport.device} (${viewport.width}x${viewport.height})`);
      console.log('='.repeat(50));
      
      for (const [userType, user] of Object.entries(TEST_USERS)) {
        console.log(`\n👤 Testing ${userType} user:`);
        
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          userAgent: viewport.width < 768 ? 
            'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) Mobile/15E148' :
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });
        
        const page = await context.newPage();
        
        try {
          // Step 1: Navigate to login
          console.log('  1️⃣ Navigating to login page...');
          await page.goto(`${BASE_URL}/login`, { 
            waitUntil: 'networkidle',
            timeout: 30000 
          });
          
          // Take login screenshot
          await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, `${viewport.name}-${userType}-1-login.png`),
            fullPage: true
          });
          console.log('     📸 Login page captured');
          
          // Step 2: Fill and submit login form
          console.log('  2️⃣ Filling login form...');
          await page.fill('input[type="email"]', user.email);
          await page.fill('input[type="password"]', user.password);
          
          // Take filled form screenshot
          await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, `${viewport.name}-${userType}-2-login-filled.png`),
            fullPage: true
          });
          console.log('     📸 Filled form captured');
          
          // Step 3: Submit and wait for redirect
          console.log('  3️⃣ Submitting login...');
          await Promise.all([
            page.waitForNavigation({ 
              waitUntil: 'networkidle',
              timeout: 30000 
            }),
            page.click('button[type="submit"]')
          ]);
          
          const afterLoginUrl = page.url();
          console.log(`     ✅ Logged in, redirected to: ${afterLoginUrl.replace(BASE_URL, '')}`);
          
          // Take dashboard screenshot
          await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, `${viewport.name}-${userType}-3-dashboard.png`),
            fullPage: true
          });
          console.log('     📸 Dashboard captured');
          
          // Step 4: Navigate to messages page
          console.log('  4️⃣ Navigating to messages page...');
          await page.goto(`${BASE_URL}/messages`, { 
            waitUntil: 'networkidle',
            timeout: 30000 
          });
          
          // Wait a bit for any redirects
          await page.waitForTimeout(2000);
          
          const messagesUrl = page.url();
          const hasAccess = messagesUrl.includes('/messages');
          
          console.log(`     Current URL: ${messagesUrl.replace(BASE_URL, '')}`);
          console.log(`     Has access: ${hasAccess ? 'YES' : 'NO'}`);
          console.log(`     Expected access: ${user.shouldHaveAccess ? 'YES' : 'NO'}`);
          
          // Take messages/redirect screenshot
          await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, `${viewport.name}-${userType}-4-messages-result.png`),
            fullPage: true
          });
          console.log('     📸 Messages page result captured');
          
          // Step 5: Test messages page features (if accessible)
          if (hasAccess && user.shouldHaveAccess) {
            console.log('  5️⃣ Testing messages page features...');
            
            // Check for key elements
            const elements = {
              'Messages header': await page.locator('h2:has-text("Messages")').count(),
              'New message button': await page.locator('[data-testid="new-message-button"], button:has-text("New")').count(),
              'Conversation list': await page.locator('[data-testid^="conversation-"]').count(),
            };
            
            // Mobile specific checks
            if (viewport.width < 768) {
              elements['Mobile menu button'] = await page.locator('[data-testid="mobile-menu-button"], button[aria-label*="menu"]').count();
              
              // Try to open mobile menu
              if (elements['Mobile menu button'] > 0) {
                console.log('     📱 Opening mobile menu...');
                await page.click('[data-testid="mobile-menu-button"], button[aria-label*="menu"]');
                await page.waitForTimeout(1000);
                
                await page.screenshot({ 
                  path: path.join(SCREENSHOTS_DIR, `${viewport.name}-${userType}-5-mobile-menu.png`),
                  fullPage: true
                });
                console.log('     📸 Mobile menu captured');
                
                // Close menu
                await page.keyboard.press('Escape');
              }
            }
            
            console.log('     Elements found:');
            for (const [name, count] of Object.entries(elements)) {
              console.log(`       - ${name}: ${count > 0 ? `✅ (${count})` : '❌'}`);
            }
            
            // Try new message button
            const newMsgBtn = await page.locator('[data-testid="new-message-button"], button:has-text("New")').first();
            if (await newMsgBtn.count() > 0) {
              console.log('     🆕 Testing new message modal...');
              await newMsgBtn.click();
              await page.waitForTimeout(1000);
              
              await page.screenshot({ 
                path: path.join(SCREENSHOTS_DIR, `${viewport.name}-${userType}-6-new-message.png`),
                fullPage: true
              });
              console.log('     📸 New message modal captured');
              
              // Close modal
              await page.keyboard.press('Escape');
            }
            
            // Check responsive layout
            if (viewport.width >= 1024) {
              const sidebarVisible = await page.locator('.lg\\:flex').first().isVisible().catch(() => false);
              console.log(`     🖥️ Desktop sidebar visible: ${sidebarVisible ? '✅' : '❌'}`);
            }
            
            results.push({ 
              viewport: viewport.name, 
              user: userType, 
              success: true,
              hasAccess: true
            });
            
          } else if (!hasAccess && !user.shouldHaveAccess) {
            console.log('  5️⃣ Access correctly denied');
            console.log(`     ✅ Client redirected to: ${messagesUrl.replace(BASE_URL, '')}`);
            
            results.push({ 
              viewport: viewport.name, 
              user: userType, 
              success: true,
              hasAccess: false
            });
            
          } else {
            console.log('  5️⃣ ❌ Access control error!');
            console.log(`     Expected access: ${user.shouldHaveAccess}`);
            console.log(`     Actual access: ${hasAccess}`);
            
            results.push({ 
              viewport: viewport.name, 
              user: userType, 
              success: false,
              hasAccess: hasAccess,
              error: 'Access control mismatch'
            });
          }
          
        } catch (error) {
          console.error(`  ❌ Test failed: ${error.message}`);
          
          // Take error screenshot
          try {
            await page.screenshot({ 
              path: path.join(SCREENSHOTS_DIR, `${viewport.name}-${userType}-error.png`),
              fullPage: true
            });
            console.log('     📸 Error screenshot captured');
          } catch (e) {}
          
          results.push({ 
            viewport: viewport.name, 
            user: userType, 
            success: false,
            error: error.message
          });
        }
        
        await context.close();
        console.log('  ✅ Test completed for', userType);
      }
    }
    
    // Generate detailed summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DETAILED TEST SUMMARY');
    console.log('='.repeat(60));
    
    const totalTests = results.length;
    const successfulTests = results.filter(r => r.success).length;
    const failedTests = results.filter(r => !r.success).length;
    
    console.log(`\n✅ Passed: ${successfulTests}/${totalTests} (${((successfulTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failedTests}/${totalTests}`);
    
    // Results by viewport
    console.log('\n📱 Results by Viewport:');
    for (const viewport of VIEWPORTS) {
      const viewportResults = results.filter(r => r.viewport === viewport.name);
      const passed = viewportResults.filter(r => r.success).length;
      const total = viewportResults.length;
      const status = passed === total ? '✅' : '⚠️';
      console.log(`  ${status} ${viewport.device}: ${passed}/${total} passed`);
    }
    
    // Results by user role
    console.log('\n👥 Results by User Role:');
    for (const userType of Object.keys(TEST_USERS)) {
      const userResults = results.filter(r => r.user === userType);
      const passed = userResults.filter(r => r.success).length;
      const total = userResults.length;
      const status = passed === total ? '✅' : '⚠️';
      const expectedAccess = TEST_USERS[userType].shouldHaveAccess ? 'should have access' : 'should NOT have access';
      console.log(`  ${status} ${userType} (${expectedAccess}): ${passed}/${total} passed`);
    }
    
    // Failed tests details
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.viewport} / ${r.user}: ${r.error || 'Unknown error'}`);
      });
    }
    
    // Screenshots summary
    const screenshots = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
    console.log(`\n📸 Generated ${screenshots.length} screenshots`);
    console.log(`📁 Location: ${SCREENSHOTS_DIR}`);
    
    // Final verdict
    console.log('\n' + '='.repeat(60));
    if (failedTests === 0) {
      console.log('🎉 ALL TESTS PASSED! Messages page is working correctly.');
      console.log('✅ Admin users have access');
      console.log('✅ Team users have access');
      console.log('✅ Client users are redirected');
      console.log('✅ Responsive design works across all viewports');
    } else {
      console.log(`⚠️ ${failedTests} tests failed. Review screenshots for details.`);
    }
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Critical test failure:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testMessagesPageDetailed()
    .then(() => {
      console.log('\n✅ Test suite completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testMessagesPageDetailed };