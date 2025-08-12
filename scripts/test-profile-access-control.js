#!/usr/bin/env node

/**
 * Test Profile Access Control
 * Verify only clients can access profile page
 */

const { chromium } = require('playwright');

console.log('🔒 Profile Access Control Test');
console.log('===============================\n');

const TEST_URL = 'http://localhost:3000';
const CLIENT_USER = { email: 'sarah@acmecorp.com', password: 'password123' };
const ADMIN_USER = { email: 'admin@demo.com', password: 'password123' };

async function testProfileAccessControl() {
  const browser = await chromium.launch({ headless: false });
  
  try {
    console.log('👤 Test 1: Client Access (Should Work)');
    
    const clientContext = await browser.newContext();
    const clientPage = await clientContext.newPage();
    
    await clientPage.goto(`${TEST_URL}/login`);
    await clientPage.fill('[name="email"]', CLIENT_USER.email);
    await clientPage.fill('[name="password"]', CLIENT_USER.password);
    await clientPage.click('button[type="submit"]');
    await clientPage.waitForURL('**/client**', { timeout: 10000 });
    
    // Try to access profile page directly
    await clientPage.goto(`${TEST_URL}/profile`);
    await clientPage.waitForTimeout(2000);
    
    const clientUrl = clientPage.url();
    const clientHasProfile = await clientPage.locator('text=My Profile').count() > 0;
    const clientHasCompany = await clientPage.locator('text=Acme Corp').count() > 0;
    
    console.log(`  📍 Client URL: ${clientUrl}`);
    console.log(`  ✅ Client can access profile: ${clientHasProfile ? 'YES' : 'NO'}`);
    console.log(`  ✅ Company info showing: ${clientHasCompany ? 'YES' : 'NO'}`);
    
    await clientContext.close();
    
    console.log('\\n👨‍💼 Test 2: Admin Access (Should Redirect)');
    
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    await adminPage.goto(`${TEST_URL}/login`);
    await adminPage.fill('[name="email"]', ADMIN_USER.email);
    await adminPage.fill('[name="password"]', ADMIN_USER.password);
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL('**/admin**', { timeout: 10000 });
    
    // Try to access profile page directly
    await adminPage.goto(`${TEST_URL}/profile`);
    await adminPage.waitForTimeout(2000);
    
    const adminUrl = adminPage.url();
    const adminRedirected = !adminUrl.includes('/profile');
    const adminHasProfile = await adminPage.locator('text=My Profile').count() > 0;
    
    console.log(`  📍 Admin URL: ${adminUrl}`);
    console.log(`  ✅ Admin redirected from profile: ${adminRedirected ? 'YES' : 'NO'}`);
    console.log(`  ✅ Admin cannot see profile: ${!adminHasProfile ? 'YES' : 'NO'}`);
    
    await adminContext.close();
    
    console.log('\\n🔍 Test 3: Check Sidebar Navigation');
    
    const testContext = await browser.newContext();
    const testPage = await testContext.newPage();
    
    // Login as client
    await testPage.goto(`${TEST_URL}/login`);
    await testPage.fill('[name="email"]', CLIENT_USER.email);
    await testPage.fill('[name="password"]', CLIENT_USER.password);
    await testPage.click('button[type="submit"]');
    await testPage.waitForURL('**/client**', { timeout: 10000 });
    
    const profileLinkInSidebar = await testPage.locator('text=Profile').count();
    console.log(`  📍 Profile link in client sidebar: ${profileLinkInSidebar > 0 ? 'YES' : 'NO'}`);
    
    await testContext.close();
    
    console.log('\\n✅ ACCESS CONTROL TEST RESULTS');
    console.log('=================================');
    console.log(`🟢 Client can access profile page: ${clientHasProfile ? 'PASS' : 'FAIL'}`);
    console.log(`🟢 Company information displays: ${clientHasCompany ? 'PASS' : 'FAIL'}`);
    console.log(`🟢 Admin redirected from profile: ${adminRedirected ? 'PASS' : 'FAIL'}`);
    console.log(`🟢 Profile link shown to clients: ${profileLinkInSidebar > 0 ? 'PASS' : 'FAIL'}`);
    
    const allTests = clientHasProfile && adminRedirected && profileLinkInSidebar > 0;
    console.log(`\\n🎯 OVERALL STATUS: ${allTests ? '✅ ALL ACCESS CONTROLS WORKING' : '❌ SOME ISSUES FOUND'}`);
    
  } catch (error) {
    console.error('❌ Access control test failed:', error.message);
  }
  
  await browser.close();
}

testProfileAccessControl().catch(console.error);