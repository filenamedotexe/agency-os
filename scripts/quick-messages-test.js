#!/usr/bin/env node

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔍 Testing messages page responsiveness...\n');
  
  try {
    // Login
    console.log('Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    const afterLoginUrl = page.url();
    console.log('After login URL:', afterLoginUrl);
    
    // Go to messages
    console.log('\nNavigating to messages...');
    await page.goto('http://localhost:3000/messages');
    await page.waitForTimeout(3000);
    
    const messagesUrl = page.url();
    console.log('Messages page URL:', messagesUrl);
    
    if (!messagesUrl.includes('/messages')) {
      console.log('❌ Failed to reach messages page');
      await browser.close();
      return;
    }
    
    // Test different viewports
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (const vp of viewports) {
      console.log(`\n📱 Testing ${vp.name} (${vp.width}x${vp.height})`);
      await page.setViewportSize(vp);
      await page.waitForTimeout(2000);
      
      // Check for mobile menu on mobile/tablet
      if (vp.width < 1024) {
        const menuBtn = await page.$('button:has(svg)');
        console.log(`  Mobile menu button: ${menuBtn ? '✅ Found' : '❌ Missing'}`);
        
        if (menuBtn) {
          await menuBtn.click();
          await page.waitForTimeout(1000);
          const sheet = await page.$('[role="dialog"]');
          console.log(`  Menu sheet opens: ${sheet ? '✅ Yes' : '❌ No'}`);
          if (sheet) {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
          }
        }
      } else {
        // Desktop should have visible sidebar
        const sidebar = await page.$('.hidden.lg\\:flex');
        console.log(`  Desktop sidebar: ${sidebar ? '✅ Visible' : '❌ Missing'}`);
      }
      
      // Check main content area
      const content = await page.$('.flex-1');
      console.log(`  Main content area: ${content ? '✅ Present' : '❌ Missing'}`);
      
      // Check chat input
      const input = await page.$('textarea');
      console.log(`  Chat input: ${input ? '✅ Found' : '❌ Missing'}`);
      
      // Check for horizontal scroll
      const hasScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      console.log(`  Horizontal scroll: ${hasScroll ? '❌ Present (bad)' : '✅ None'}`);
    }
    
    console.log('\n✅ Test complete! Keeping browser open for 15 seconds...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})().catch(console.error);