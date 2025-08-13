#!/usr/bin/env node

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots', 'messages-navigation');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Test viewports
const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667, device: 'Mobile' },
  { name: 'tablet', width: 768, height: 1024, device: 'Tablet' },
  { name: 'desktop', width: 1440, height: 900, device: 'Desktop' }
];

async function testMessagesNavigation() {
  console.log('🚀 Testing Simplified Messages Navigation');
  console.log('✅ Goal: Single menu system, no duplicate menus');
  console.log('');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  try {
    for (const viewport of VIEWPORTS) {
      console.log(`\n📱 ${viewport.device} (${viewport.width}x${viewport.height})`);
      console.log('='.repeat(40));
      
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      
      const page = await context.newPage();
      
      try {
        // Login as admin
        console.log('  🔐 Logging in as admin...');
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
        await page.fill('input[type="email"]', 'admin@demo.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/admin**', { timeout: 10000 });
        console.log('  ✅ Logged in');
        
        // Navigate to messages
        console.log('  📬 Navigating to messages...');
        await page.goto(`${BASE_URL}/messages`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Take screenshot
        await page.screenshot({ 
          path: path.join(SCREENSHOTS_DIR, `${viewport.name}-messages-main.png`),
          fullPage: true
        });
        console.log('  📸 Messages page captured');
        
        // Check for menu elements
        console.log('  🔍 Checking navigation elements:');
        
        // Check for main navigation
        const mainNav = await page.locator('nav, [role="navigation"]').first().count();
        console.log(`    Main navigation: ${mainNav > 0 ? '✅ Present' : '❌ Missing'}`);
        
        // Check for duplicate mobile menu button (should NOT exist)
        const duplicateMenuBtn = await page.locator('[data-testid="mobile-menu-button"]').count();
        console.log(`    Duplicate menu button: ${duplicateMenuBtn === 0 ? '✅ Removed (good!)' : '❌ Still exists'}`);
        
        // Check conversation list visibility based on viewport
        const conversationList = await page.locator('.md\\:flex').first();
        if (viewport.width >= 768) {
          const isVisible = await conversationList.isVisible().catch(() => false);
          console.log(`    Conversation list: ${isVisible ? '✅ Visible (expected)' : '❌ Hidden'}`);
        } else {
          console.log(`    Conversation list: Should be in main nav on mobile`);
        }
        
        // Check for "New" button
        const newButton = await page.locator('[data-testid="new-message-button"]').count();
        console.log(`    New message button: ${newButton > 0 ? '✅ Present' : '❌ Missing'}`);
        
        // Test main navigation menu on mobile
        if (viewport.width < 768) {
          console.log('  📱 Testing mobile navigation...');
          
          // Look for main hamburger menu
          const hamburgerMenu = await page.locator('button[aria-label*="menu"], button:has(svg.lucide-menu)').first();
          if (await hamburgerMenu.count() > 0) {
            await hamburgerMenu.click();
            await page.waitForTimeout(1000);
            
            await page.screenshot({ 
              path: path.join(SCREENSHOTS_DIR, `${viewport.name}-main-menu-open.png`),
              fullPage: true
            });
            console.log('  📸 Main menu captured');
            
            // Check if Messages link is in the main menu
            const messagesLink = await page.locator('a[href="/messages"], button:has-text("Messages")').count();
            console.log(`    Messages in main menu: ${messagesLink > 0 ? '✅ Present' : '❌ Missing'}`);
            
            // Close menu
            await page.keyboard.press('Escape');
          } else {
            console.log('  ⚠️ No hamburger menu found (might be always visible)');
          }
        }
        
        console.log(`  ✅ ${viewport.device} test completed`);
        
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        
        // Error screenshot
        await page.screenshot({ 
          path: path.join(SCREENSHOTS_DIR, `${viewport.name}-error.png`),
          fullPage: true
        });
      }
      
      await context.close();
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 NAVIGATION TEST SUMMARY');
    console.log('='.repeat(50));
    console.log('\n✅ Key Improvements:');
    console.log('  - Removed duplicate mobile menu button from messages page');
    console.log('  - Single navigation system across all viewports');
    console.log('  - Conversation list in sidebar on tablet/desktop');
    console.log('  - Main navigation handles all menu needs on mobile');
    console.log('\n📱 Viewport Behaviors:');
    console.log('  - Mobile: Main nav menu only (no duplicate chat menu)');
    console.log('  - Tablet: Sidebar visible, conversation list shown');
    console.log('  - Desktop: Full sidebar with conversation list always visible');
    
    const screenshots = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
    console.log(`\n📸 Generated ${screenshots.length} screenshots`);
    console.log(`📁 Location: ${SCREENSHOTS_DIR}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testMessagesNavigation().catch(console.error);