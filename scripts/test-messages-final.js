#!/usr/bin/env node

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔍 Testing final messages page responsiveness...\n');
  
  try {
    // Login
    console.log('Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    // Navigate to messages
    console.log('Navigating to messages...');
    await page.goto('http://localhost:3000/messages');
    await page.waitForTimeout(3000);
    
    // Test viewports
    const viewports = [
      { name: 'Mobile (375px)', width: 375, height: 812 },
      { name: 'Tablet (768px)', width: 768, height: 1024 },
      { name: 'Desktop (1920px)', width: 1920, height: 1080 }
    ];
    
    for (const vp of viewports) {
      console.log(`\n📱 ${vp.name}`);
      console.log('─'.repeat(40));
      await page.setViewportSize(vp);
      await page.waitForTimeout(2000);
      
      // Check for horizontal scroll
      const hasScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      console.log(`  Horizontal scroll: ${hasScroll ? '❌ Yes (BAD)' : '✅ None'}`);
      
      // Mobile/Tablet checks
      if (vp.width < 1024) {
        // Check for menu button
        const menuBtn = await page.$('button:has(svg[class*="h-5 w-5"])')
          .catch(() => null);
        console.log(`  Menu button: ${menuBtn ? '✅ Found' : '❌ Missing'}`);
        
        if (menuBtn) {
          // Test menu opens
          await menuBtn.click();
          await page.waitForTimeout(1000);
          const sheet = await page.$('[role="dialog"]');
          console.log(`  Menu opens: ${sheet ? '✅ Yes' : '❌ No'}`);
          
          if (sheet) {
            // Select first conversation
            const conv = await page.$('[role="dialog"] .cursor-pointer');
            if (conv) {
              await conv.click();
              await page.waitForTimeout(1000);
              const chatVisible = await page.$('textarea');
              console.log(`  Chat loads: ${chatVisible ? '✅ Yes' : '❌ No'}`);
            }
          }
        }
      } else {
        // Desktop checks
        const sidebar = await page.$('.hidden.lg\\:flex');
        console.log(`  Sidebar visible: ${sidebar ? '✅ Yes' : '❌ No'}`);
        
        // Check if conversations are visible
        const convList = await page.$$('.cursor-pointer');
        console.log(`  Conversations: ${convList.length > 0 ? `✅ ${convList.length} found` : '❌ None'}`);
      }
      
      // Check main content area
      const content = await page.$('.flex-1');
      console.log(`  Content area: ${content ? '✅ Present' : '❌ Missing'}`);
      
      // Take screenshot
      await page.screenshot({ 
        path: `/tmp/messages-${vp.width}px.png`,
        fullPage: false
      });
      console.log(`  📸 Screenshot saved: /tmp/messages-${vp.width}px.png`);
    }
    
    console.log('\n✅ Test complete!');
    console.log('\nKeeping browser open for 20 seconds for manual inspection...');
    await page.waitForTimeout(20000);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})().catch(console.error);