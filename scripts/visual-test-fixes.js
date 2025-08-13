#!/usr/bin/env node

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots', 'fixes-verified');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Key responsive viewports
const VIEWPORTS = [
  { name: 'mobile', width: 320, height: 568 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1024, height: 768 }
];

async function testResponsiveFixes() {
  console.log('📱 Testing Responsive Fixes for Admin Settings');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for visual verification
  });
  
  try {
    for (const viewport of VIEWPORTS) {
      console.log(`\n${viewport.name.toUpperCase()} (${viewport.width}x${viewport.height})`);
      
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      
      const page = await context.newPage();
      
      try {
        // Go directly to login
        console.log('🔐 Going to login...');
        await page.goto(`${BASE_URL}/login`);
        await page.waitForLoadState('networkidle');
        
        // Login as admin  
        await page.fill('input[name="email"], input[type="email"]', 'admin@demo.com');
        await page.fill('input[name="password"], input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        // Wait for redirect
        await page.waitForURL('**/admin**', { timeout: 15000 });
        console.log('✅ Logged in successfully');
        
        // Go to settings
        await page.goto(`${BASE_URL}/admin/settings`);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('h1:has-text("Settings")', { timeout: 10000 });
        
        // Take main screenshot
        await page.screenshot({ 
          path: path.join(SCREENSHOTS_DIR, `${viewport.name}-settings-main.png`),
          fullPage: true
        });
        console.log(`📸 Main settings page captured`);
        
        // Test main tabs
        const mainTabs = ['sms', 'general', 'users'];
        for (const tab of mainTabs) {
          try {
            await page.click(`[data-value="${tab}"]`);
            await page.waitForTimeout(1000);
            
            await page.screenshot({ 
              path: path.join(SCREENSHOTS_DIR, `${viewport.name}-${tab}-tab.png`),
              fullPage: true
            });
            console.log(`📸 ${tab} tab captured`);
          } catch (e) {
            console.log(`⚠️ Could not capture ${tab} tab`);
          }
        }
        
        // Test email sub-tabs
        try {
          await page.click(`[data-value="emails"]`);
          await page.waitForTimeout(1000);
          
          const emailTabs = ['templates', 'test'];
          for (const subTab of emailTabs) {
            try {
              // Look for nested tabs within email content
              await page.click(`[data-value="${subTab}"]`);
              await page.waitForTimeout(1000);
              
              await page.screenshot({ 
                path: path.join(SCREENSHOTS_DIR, `${viewport.name}-email-${subTab}.png`),
                fullPage: true
              });
              console.log(`📸 Email ${subTab} captured`);
            } catch (e) {
              console.log(`⚠️ Could not capture email ${subTab}`);
            }
          }
        } catch (e) {
          console.log('⚠️ Could not test email tabs');
        }
        
        console.log(`✅ ${viewport.name} testing completed`);
        
      } catch (error) {
        console.error(`❌ Error testing ${viewport.name}:`, error.message);
      }
      
      await context.close();
    }
    
    console.log('\n🎉 Visual testing completed!');
    
    // List generated screenshots
    const screenshots = fs.readdirSync(SCREENSHOTS_DIR)
      .filter(f => f.endsWith('.png'))
      .sort();
    
    console.log(`\n📁 Generated ${screenshots.length} screenshots:`);
    screenshots.forEach(file => console.log(`   ✓ ${file}`));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testResponsiveFixes().catch(console.error);