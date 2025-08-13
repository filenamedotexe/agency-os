#!/usr/bin/env node

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots', 'admin-settings');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Viewport configurations for testing
const VIEWPORTS = [
  { name: 'mobile', width: 320, height: 568 },
  { name: 'mobile-large', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1024, height: 768 },
  { name: 'desktop-large', width: 1920, height: 1080 }
];

async function loginAsAdmin(page) {
  console.log('🔐 Logging in as admin...');
  
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  // Fill login form
  await page.fill('[data-testid="email-input"], input[type="email"]', 'admin@demo.com');
  await page.fill('[data-testid="password-input"], input[type="password"]', 'password123');
  
  // Submit form
  await page.click('[data-testid="login-button"], button[type="submit"]');
  
  // Wait for redirect to admin dashboard
  await page.waitForURL('**/admin**', { timeout: 10000 });
  console.log('✅ Successfully logged in as admin');
}

async function testAdminSettingsPage() {
  console.log('🚀 Starting Admin Settings Page Responsive Test');
  console.log('📱 Testing viewports:', VIEWPORTS.map(v => `${v.name} (${v.width}x${v.height})`).join(', '));
  
  const browser = await chromium.launch({ headless: false });
  
  try {
    for (const viewport of VIEWPORTS) {
      console.log(`\n📱 Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`);
      
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        userAgent: viewport.width < 768 ? 
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1' :
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      const page = await context.newPage();
      
      try {
        // Login as admin
        await loginAsAdmin(page);
        
        // Navigate to settings page
        console.log('📄 Navigating to admin settings page...');
        await page.goto(`${BASE_URL}/admin/settings`);
        await page.waitForLoadState('networkidle');
        
        // Wait for page content to load
        await page.waitForSelector('[data-testid="page-content"], .space-y-6', { timeout: 5000 });
        
        // Take screenshot of main page
        const mainScreenshot = path.join(SCREENSHOTS_DIR, `${viewport.name}-main.png`);
        await page.screenshot({ 
          path: mainScreenshot, 
          fullPage: true,
          clip: viewport.width < 768 ? undefined : { x: 0, y: 0, width: viewport.width, height: Math.min(viewport.height, 1200) }
        });
        console.log(`📸 Main page screenshot: ${mainScreenshot}`);
        
        // Test all main tabs
        const mainTabs = ['emails', 'sms', 'general', 'users'];
        
        for (const tab of mainTabs) {
          try {
            console.log(`🔗 Testing ${tab} tab...`);
            
            // Click tab
            await page.click(`[data-testid="${tab}-tab"], [role="tab"]:has-text("${tab.charAt(0).toUpperCase() + tab.slice(1)}")`);
            await page.waitForTimeout(500); // Wait for tab content to render
            
            // Wait for tab content
            await page.waitForSelector(`[role="tabpanel"]`, { timeout: 3000 });
            
            // Take screenshot
            const tabScreenshot = path.join(SCREENSHOTS_DIR, `${viewport.name}-${tab}-tab.png`);
            await page.screenshot({ 
              path: tabScreenshot, 
              fullPage: true,
              clip: viewport.width < 768 ? undefined : { x: 0, y: 0, width: viewport.width, height: Math.min(viewport.height, 1200) }
            });
            console.log(`📸 ${tab} tab screenshot: ${tabScreenshot}`);
            
          } catch (error) {
            console.log(`⚠️ Could not test ${tab} tab:`, error.message);
          }
        }
        
        // Test email sub-tabs if on emails tab
        try {
          console.log('🔗 Testing email sub-tabs...');
          await page.click('[role="tab"]:has-text("Email Management")');
          await page.waitForTimeout(500);
          
          const emailTabs = ['logs', 'templates', 'test'];
          
          for (const subTab of emailTabs) {
            try {
              console.log(`📧 Testing email ${subTab} sub-tab...`);
              
              // Click sub-tab
              await page.click(`[role="tab"]:has-text("${subTab.charAt(0).toUpperCase() + subTab.slice(1)}")`);
              await page.waitForTimeout(500);
              
              // Take screenshot
              const subTabScreenshot = path.join(SCREENSHOTS_DIR, `${viewport.name}-email-${subTab}.png`);
              await page.screenshot({ 
                path: subTabScreenshot, 
                fullPage: true,
                clip: viewport.width < 768 ? undefined : { x: 0, y: 0, width: viewport.width, height: Math.min(viewport.height, 1200) }
              });
              console.log(`📸 Email ${subTab} screenshot: ${subTabScreenshot}`);
              
            } catch (error) {
              console.log(`⚠️ Could not test email ${subTab} sub-tab:`, error.message);
            }
          }
        } catch (error) {
          console.log('⚠️ Could not test email sub-tabs:', error.message);
        }
        
        // Test responsive elements
        console.log('🔍 Checking responsive elements...');
        
        // Check if tabs are scrollable on mobile
        if (viewport.width < 768) {
          const tabsList = await page.locator('[role="tablist"]').first();
          const isScrollable = await tabsList.evaluate((el) => {
            return el.scrollWidth > el.clientWidth;
          });
          console.log(`📱 Tabs scrollable on mobile: ${isScrollable ? 'Yes' : 'No'}`);
        }
        
        // Check spacing and padding
        const contentArea = await page.locator('[role="tabpanel"]').first();
        if (await contentArea.count() > 0) {
          const padding = await contentArea.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return {
              paddingTop: styles.paddingTop,
              paddingRight: styles.paddingRight,
              paddingBottom: styles.paddingBottom,
              paddingLeft: styles.paddingLeft
            };
          });
          console.log(`📏 Content padding:`, padding);
        }
        
        console.log(`✅ ${viewport.name} viewport testing completed`);
        
      } catch (error) {
        console.error(`❌ Error testing ${viewport.name}:`, error.message);
        
        // Take error screenshot
        try {
          const errorScreenshot = path.join(SCREENSHOTS_DIR, `${viewport.name}-error.png`);
          await page.screenshot({ path: errorScreenshot, fullPage: true });
          console.log(`📸 Error screenshot: ${errorScreenshot}`);
        } catch (screenshotError) {
          console.log('Could not take error screenshot:', screenshotError.message);
        }
      }
      
      await context.close();
    }
    
    console.log('\n🎉 Admin Settings Page Responsive Testing Completed!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);
    
    // Generate summary report
    const screenshotFiles = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
    console.log(`📊 Generated ${screenshotFiles.length} screenshots:`);
    screenshotFiles.forEach(file => console.log(`   - ${file}`));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testAdminSettingsPage().catch(console.error);
}

module.exports = { testAdminSettingsPage };