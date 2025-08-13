#!/usr/bin/env node

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots', 'messages-focused');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Key viewports only for focused testing
const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667, device: 'iPhone 8' },
  { name: 'tablet', width: 768, height: 1024, device: 'iPad' },
  { name: 'desktop', width: 1440, height: 900, device: 'Desktop' }
];

// Test users
const TEST_USERS = {
  admin: { 
    email: 'admin@demo.com', 
    password: 'password123',
    shouldHaveAccess: true
  },
  team: { 
    email: 'team@demo.com', 
    password: 'password123',
    shouldHaveAccess: true
  },
  client: { 
    email: 'sarah@acmecorp.com', 
    password: 'password123',
    shouldHaveAccess: false
  }
};

async function testMessagesAccess() {
  console.log('🚀 Starting Focused Messages Page Test');
  console.log('📱 Testing viewports:', VIEWPORTS.map(v => v.device).join(', '));
  console.log('👥 Testing users:', Object.keys(TEST_USERS).join(', '));
  console.log('');
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser for debugging
    slowMo: 500 // Slow down for visibility
  });
  
  const results = [];
  
  try {
    for (const viewport of VIEWPORTS) {
      console.log(`\n📱 Testing ${viewport.device} (${viewport.width}x${viewport.height})`);
      
      for (const [userType, user] of Object.entries(TEST_USERS)) {
        console.log(`\n  👤 ${userType}:`);
        
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height }
        });
        
        const page = await context.newPage();
        
        try {
          // Go to login
          console.log('    🔐 Logging in...');
          await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
          
          // Fill login form
          await page.fill('input[type="email"]', user.email);
          await page.fill('input[type="password"]', user.password);
          
          // Submit
          await page.click('button[type="submit"]');
          
          // Wait for navigation
          await page.waitForURL((url) => !url.includes('/login'), { timeout: 10000 });
          console.log('    ✅ Logged in');
          
          // Go to messages
          await page.goto(`${BASE_URL}/messages`, { waitUntil: 'networkidle' });
          
          // Check access
          const currentUrl = page.url();
          const hasAccess = currentUrl.includes('/messages');
          
          if (user.shouldHaveAccess) {
            if (hasAccess) {
              console.log('    ✅ Has access to messages (expected)');
              
              // Wait for page to load
              await page.waitForSelector('h2:has-text("Messages"), [data-testid="new-message-button"]', { 
                timeout: 5000 
              }).catch(() => console.log('    ⚠️ Messages page elements not found'));
              
              // Take screenshot
              await page.screenshot({ 
                path: path.join(SCREENSHOTS_DIR, `${viewport.name}-${userType}-messages.png`),
                fullPage: true
              });
              console.log(`    📸 Screenshot saved`);
              
              // Test mobile menu on mobile
              if (viewport.width < 768) {
                const mobileMenu = await page.locator('[data-testid="mobile-menu-button"]').count();
                console.log(`    📱 Mobile menu button: ${mobileMenu > 0 ? 'Found' : 'Not found'}`);
                
                if (mobileMenu > 0) {
                  await page.click('[data-testid="mobile-menu-button"]');
                  await page.waitForTimeout(500);
                  await page.screenshot({ 
                    path: path.join(SCREENSHOTS_DIR, `${viewport.name}-${userType}-mobile-menu.png`),
                    fullPage: true
                  });
                  console.log(`    📸 Mobile menu screenshot saved`);
                }
              }
              
              results.push({ viewport: viewport.name, user: userType, success: true });
            } else {
              console.log('    ❌ No access to messages (unexpected!)');
              results.push({ viewport: viewport.name, user: userType, success: false });
            }
          } else {
            if (!hasAccess) {
              console.log('    ✅ No access to messages (expected)');
              await page.screenshot({ 
                path: path.join(SCREENSHOTS_DIR, `${viewport.name}-${userType}-redirected.png`),
                fullPage: true
              });
              console.log(`    📸 Redirect screenshot saved`);
              results.push({ viewport: viewport.name, user: userType, success: true });
            } else {
              console.log('    ❌ Has access to messages (unexpected!)');
              results.push({ viewport: viewport.name, user: userType, success: false });
            }
          }
          
        } catch (error) {
          console.error(`    ❌ Error: ${error.message}`);
          results.push({ viewport: viewport.name, user: userType, success: false, error: error.message });
          
          // Error screenshot
          try {
            await page.screenshot({ 
              path: path.join(SCREENSHOTS_DIR, `${viewport.name}-${userType}-error.png`),
              fullPage: true
            });
          } catch (e) {}
        }
        
        await context.close();
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    const totalTests = results.length;
    const successfulTests = results.filter(r => r.success).length;
    const failedTests = results.filter(r => !r.success).length;
    
    console.log(`✅ Passed: ${successfulTests}/${totalTests}`);
    console.log(`❌ Failed: ${failedTests}/${totalTests}`);
    
    // Details
    console.log('\n📝 Details:');
    for (const result of results) {
      const status = result.success ? '✅' : '❌';
      const error = result.error ? ` (${result.error})` : '';
      console.log(`  ${status} ${result.viewport} - ${result.user}${error}`);
    }
    
    // Screenshots
    const screenshots = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
    console.log(`\n📸 Generated ${screenshots.length} screenshots`);
    console.log(`📁 Location: ${SCREENSHOTS_DIR}`);
    
    console.log('\n' + '='.repeat(50));
    if (failedTests === 0) {
      console.log('🎉 ALL TESTS PASSED!');
    } else {
      console.log(`⚠️ ${failedTests} tests failed. Check screenshots.`);
    }
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Critical error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testMessagesAccess().catch(console.error);