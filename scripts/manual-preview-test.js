#!/usr/bin/env node

/**
 * Manual Preview Test - Simple verification
 * Quick test to verify preview and download buttons are working
 */

const { chromium } = require('playwright');

console.log('🧪 Manual Preview & Download Test');
console.log('=================================\n');

const TEST_URL = 'http://localhost:3006';

async function manualTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000 
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('1️⃣ Navigate to login...');
    await page.goto(`${TEST_URL}/login`);
    console.log('✅ Login page loaded');
    
    console.log('\n2️⃣ Manual login required...');
    console.log('👤 Please login as admin@demo.com / password123');
    
    // Wait for user to login manually
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 60000 });
    console.log('✅ Login detected');
    
    console.log('\n3️⃣ Navigate to messages...');
    await page.goto(`${TEST_URL}/messages`);
    await page.waitForTimeout(3000);
    console.log('✅ Messages page loaded');
    
    console.log('\n4️⃣ Check for attachment buttons...');
    const attachmentButtons = await page.$$('button[title*="attachment"]');
    console.log(`Found ${attachmentButtons.length} attachment buttons`);
    
    if (attachmentButtons.length > 0) {
      console.log('\n5️⃣ Click first attachment button...');
      await attachmentButtons[0].click();
      await page.waitForTimeout(3000);
      
      console.log('\n6️⃣ Check for preview buttons...');
      const previewButtons = await page.$$('button:has-text("Preview"), button:has-text("View")');
      console.log(`Found ${previewButtons.length} preview buttons`);
      
      const downloadButtons = await page.$$('button:has-text("Download"), button:has-text("Get")');
      console.log(`Found ${downloadButtons.length} download buttons`);
      
      if (previewButtons.length > 0) {
        console.log('\n7️⃣ Testing preview functionality...');
        console.log('👁️  Clicking preview button...');
        await previewButtons[0].click();
        await page.waitForTimeout(3000);
        
        // Check if preview modal opened
        const modals = await page.$$('[role="dialog"]');
        console.log(`${modals.length > 1 ? '✅' : '❌'} Preview modal opened (${modals.length} modals total)`);
      }
      
      console.log('\n📊 Manual Test Results:');
      console.log('======================');
      console.log(`✅ Server running on port 3006`);
      console.log(`✅ Messages page accessible`);
      console.log(`${attachmentButtons.length > 0 ? '✅' : '❌'} Attachment buttons present (${attachmentButtons.length})`);
      console.log(`${previewButtons.length > 0 ? '✅' : '❌'} Preview buttons present (${previewButtons.length})`);
      console.log(`${downloadButtons.length > 0 ? '✅' : '❌'} Download buttons present (${downloadButtons.length})`);
      
      console.log('\n🎯 Manual Testing Instructions:');
      console.log('==============================');
      console.log('1. Click any Preview button to test preview modal');
      console.log('2. Click any Download button to test file downloads');
      console.log('3. Test different file types (text, images, PDFs)');
      console.log('4. Verify modal responsiveness on different screen sizes');
      console.log('5. Check that downloads actually save files');
      
      console.log('\n⏰ Browser will stay open for 2 minutes for manual testing...');
      await page.waitForTimeout(120000);
    } else {
      console.log('❌ No attachment buttons found - upload some files first');
    }

  } catch (error) {
    console.log('💥 Test error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the manual test
manualTest().catch(console.error);