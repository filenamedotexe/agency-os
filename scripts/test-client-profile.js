#!/usr/bin/env node

/**
 * Test Client Profile Page
 * Verify the profile page works for clients
 */

const { chromium } = require('playwright');

console.log('👤 Client Profile Page Test');
console.log('============================\n');

const TEST_URL = 'http://localhost:3000';
const CLIENT_USER = { email: 'sarah@acmecorp.com', password: 'password123' };

async function testClientProfile() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔐 Step 1: Login as client');
    await page.goto(`${TEST_URL}/login`);
    await page.fill('[name="email"]', CLIENT_USER.email);
    await page.fill('[name="password"]', CLIENT_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/client**', { timeout: 10000 });
    console.log('  ✅ Client logged in successfully');
    
    console.log('\n🔍 Step 2: Check sidebar for Profile link');
    
    // Check if Profile link is visible in sidebar
    const profileLink = await page.locator('text=Profile').count();
    console.log(`  📍 Profile links found in sidebar: ${profileLink}`);
    
    if (profileLink > 0) {
      console.log('\n👤 Step 3: Navigate to Profile page');
      
      await page.click('text=Profile');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log(`  📍 Current URL: ${currentUrl}`);
      
      if (currentUrl.includes('/profile')) {
        console.log('  ✅ Successfully navigated to profile page');
        
        console.log('\n🔍 Step 4: Check profile page content');
        
        // Check for key profile elements
        const pageTitle = await page.locator('text=My Profile').count();
        const userInfo = await page.locator('text=Sarah Johnson').count();
        const companyInfo = await page.locator('text=Acme Corp').count();
        const clientBadge = await page.locator('text=Client').count();
        
        console.log(`  📊 Page title "My Profile": ${pageTitle}`);
        console.log(`  📊 User name "Sarah Johnson": ${userInfo}`);
        console.log(`  📊 Company "Acme Corp": ${companyInfo}`);
        console.log(`  📊 Client badge: ${clientBadge}`);
        
        // Check for profile sections
        const profileCards = await page.locator('[class*="card"]').count();
        console.log(`  📊 Profile cards: ${profileCards}`);
        
        // Look for specific sections
        const companySection = await page.locator('text=Company Information').count();
        const securitySection = await page.locator('text=Account Security').count();
        const contactSection = await page.locator('text=Contact Preferences').count();
        
        console.log(`  📊 Company Information section: ${companySection}`);
        console.log(`  📊 Account Security section: ${securitySection}`);
        console.log(`  📊 Contact Preferences section: ${contactSection}`);
        
        // Take screenshot
        await page.screenshot({ path: '/Users/zachwieder/Documents/CODING MAIN/final-agency/client-profile-page.png', fullPage: true });
        console.log('  📸 Screenshot saved as client-profile-page.png');
        
        console.log('\n✅ PROFILE PAGE TEST RESULTS');
        console.log('==============================');
        console.log(`🟢 Profile page accessible: ${currentUrl.includes('/profile') ? 'YES' : 'NO'}`);
        console.log(`🟢 User information displayed: ${userInfo > 0 ? 'YES' : 'NO'}`);
        console.log(`🟢 Company information displayed: ${companyInfo > 0 ? 'YES' : 'NO'}`);
        console.log(`🟢 Profile sections present: ${profileCards >= 3 ? 'YES' : 'NO'}`);
        
        const allWorking = currentUrl.includes('/profile') && userInfo > 0 && profileCards >= 3;
        console.log(`\n🎯 OVERALL STATUS: ${allWorking ? '✅ WORKING PERFECTLY' : '❌ NEEDS FIXES'}`);
        
      } else {
        console.log('  ❌ Failed to navigate to profile page');
        console.log(`  📍 Redirected to: ${currentUrl}`);
      }
    } else {
      console.log('  ❌ Profile link not found in sidebar');
    }
    
  } catch (error) {
    console.error('❌ Profile test failed:', error.message);
  }
  
  console.log('\n⏳ Browser will stay open for 15 seconds for inspection...');
  await page.waitForTimeout(15000);
  
  await browser.close();
}

testClientProfile().catch(console.error);