#!/usr/bin/env node

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots', 'settings-fixes');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Mobile focused viewports
const VIEWPORTS = [
  { name: 'mobile-small', width: 320, height: 568 },
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1024, height: 768 }
];

async function loginAsAdmin(page) {
  console.log('🔐 Logging in as admin...');
  
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  // Fill login form
  await page.fill('input[type="email"]', 'admin@demo.com');
  await page.fill('input[type="password"]', 'password123');
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for redirect to admin dashboard
  await page.waitForURL('**/admin**', { timeout: 10000 });
  console.log('✅ Successfully logged in as admin');
}

async function testSettingsPageFixes() {
  console.log('🚀 Testing Admin Settings Page Fixes');
  
  const browser = await chromium.launch({ headless: false });
  
  try {
    for (const viewport of VIEWPORTS) {
      console.log(`\n📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      
      const page = await context.newPage();
      
      try {
        // Login as admin
        await loginAsAdmin(page);
        
        // Navigate to settings
        await page.goto(`${BASE_URL}/admin/settings`);
        await page.waitForLoadState('networkidle');
        
        // Wait for content to load
        await page.waitForSelector('h1:has-text("Settings")', { timeout: 5000 });
        
        // Take screenshot of main page
        const mainScreenshot = path.join(SCREENSHOTS_DIR, `${viewport.name}-fixed-main.png`);
        await page.screenshot({ 
          path: mainScreenshot, 
          fullPage: true
        });
        console.log(`📸 Main page: ${mainScreenshot}`);
        
        // Test main tabs - they should work now
        const mainTabs = [
          { value: 'emails', text: 'Email' },
          { value: 'sms', text: 'SMS' },
          { value: 'general', text: 'General' },
          { value: 'users', text: 'Users' }
        ];
        
        for (const tab of mainTabs) {
          try {
            console.log(`🔗 Testing ${tab.text} tab...`);
            
            // Click tab by value
            await page.click(`[data-state="inactive"][data-value="${tab.value}"], [data-value="${tab.value}"]`);
            await page.waitForTimeout(500);
            
            // Wait for tab content
            await page.waitForSelector(`[data-state="active"][data-value="${tab.value}"]`, { timeout: 3000 });
            
            // Take screenshot
            const tabScreenshot = path.join(SCREENSHOTS_DIR, `${viewport.name}-fixed-${tab.value}.png`);
            await page.screenshot({ 
              path: tabScreenshot, 
              fullPage: true
            });
            console.log(`📸 ${tab.text} tab: ${tabScreenshot}`);
            
          } catch (error) {
            console.log(`⚠️ Could not test ${tab.text} tab:`, error.message);
          }
        }
        
        // Test email sub-tabs specifically
        try {
          console.log('📧 Testing email sub-tabs...');
          
          // First make sure we're on emails tab
          await page.click(`[data-value="emails"]`);
          await page.waitForTimeout(500);
          
          const emailTabs = [
            { value: 'logs', text: 'Logs' },
            { value: 'templates', text: 'Templates' },
            { value: 'test', text: 'Test' }
          ];
          
          for (const subTab of emailTabs) {
            try {
              console.log(`   Testing ${subTab.text} sub-tab...`);
              
              // Find the nested tabs within the email content
              await page.click(`[data-value="${subTab.value}"]`);
              await page.waitForTimeout(500);
              
              // Take screenshot
              const subTabScreenshot = path.join(SCREENSHOTS_DIR, `${viewport.name}-fixed-email-${subTab.value}.png`);
              await page.screenshot({ 
                path: subTabScreenshot, 
                fullPage: true
              });
              console.log(`   📸 ${subTab.text}: ${subTabScreenshot}`);
              
            } catch (error) {
              console.log(`   ⚠️ Could not test ${subTab.text}:`, error.message);
            }
          }
        } catch (error) {
          console.log('⚠️ Email sub-tabs test failed:', error.message);
        }
        
        // Check responsive behavior
        console.log('🔍 Checking responsive behavior...');
        
        if (viewport.width < 768) {
          // Check if tabs are in grid layout on mobile
          const tabsList = await page.locator('[role="tablist"]').first();
          const classList = await tabsList.getAttribute('class');
          const hasGridLayout = classList && classList.includes('grid');
          console.log(`📱 Mobile grid layout: ${hasGridLayout ? 'Yes' : 'No'}`);
        }
        
        // Check for overflow scrolling
        const scrollContainer = await page.locator('.overflow-x-auto').first();
        if (await scrollContainer.count() > 0) {
          const hasOverflow = await scrollContainer.evaluate((el) => {
            return el.scrollWidth > el.clientWidth;
          });
          console.log(`📜 Has horizontal scroll: ${hasOverflow ? 'Yes' : 'No'}`);
        }
        
        console.log(`✅ ${viewport.name} testing completed`);
        
      } catch (error) {
        console.error(`❌ Error testing ${viewport.name}:`, error.message);
        
        // Take error screenshot
        const errorScreenshot = path.join(SCREENSHOTS_DIR, `${viewport.name}-error.png`);
        await page.screenshot({ path: errorScreenshot, fullPage: true });
        console.log(`📸 Error screenshot: ${errorScreenshot}`);
      }
      
      await context.close();
    }
    
    console.log('\n🎉 Settings Page Fix Testing Completed!');
    
    // List screenshots
    const screenshots = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
    console.log(`📁 Generated ${screenshots.length} screenshots in: ${SCREENSHOTS_DIR}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testSettingsPageFixes().catch(console.error);
}

module.exports = { testSettingsPageFixes };