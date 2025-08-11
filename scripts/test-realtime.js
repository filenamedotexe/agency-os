const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page1 = await context.newPage();
  const page2 = await context.newPage();
  
  console.log('🔄 Testing Realtime Message Sync\n');
  
  try {
    // Login as admin in page 1
    await page1.goto('http://localhost:3001/login');
    await page1.fill('input[type="email"]', 'admin@agencyos.dev');
    await page1.fill('input[type="password"]', 'password123');
    await page1.click('button[type="submit"]');
    await page1.waitForURL('**/admin');
    console.log('✅ Page 1: Logged in as admin');
    
    // Login as client in page 2
    await page2.goto('http://localhost:3001/login');
    await page2.fill('input[type="email"]', 'client1@acme.com');
    await page2.fill('input[type="password"]', 'password123');
    await page2.click('button[type="submit"]');
    await page2.waitForURL('**/client');
    console.log('✅ Page 2: Logged in as client');
    
    // Both navigate to chat (once UI is built)
    // Test message appears in both windows
    
    console.log('✅ Realtime connection test prepared');
    
  } catch (error) {
    console.error('❌ Realtime test failed:', error);
  } finally {
    await browser.close();
  }
})();