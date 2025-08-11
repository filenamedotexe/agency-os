#!/usr/bin/env node

/**
 * COMPREHENSIVE CHAT E2E TEST SUITE
 * Tests real database usage, multiple users, all roles, all viewports
 * Creates real test data and validates complete user flows
 */

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔥 COMPREHENSIVE CHAT SYSTEM E2E TEST SUITE');
console.log('===========================================');
console.log('Testing real database usage, multiple users, all roles, all viewports\n');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3004',
  viewports: [
    { width: 375, height: 667, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' }, 
    { width: 1920, height: 1080, name: 'Desktop' }
  ],
  testUsers: {
    admin: {
      email: 'test-admin@agencytest.com',
      password: 'TestPassword123!',
      role: 'admin',
      firstName: 'Test',
      lastName: 'Admin'
    },
    teamMember: {
      email: 'test-team@agencytest.com', 
      password: 'TestPassword123!',
      role: 'team_member',
      firstName: 'Test',
      lastName: 'Team'
    },
    client: {
      email: 'test-client@agencytest.com',
      password: 'TestPassword123!', 
      role: 'client',
      firstName: 'Test',
      lastName: 'Client',
      companyName: 'Test Company LLC'
    }
  }
};

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  issues: [],
  fixes: [],
  metrics: {
    pageLoads: [],
    messageDelivery: [],
    userInteractions: [],
    responsiveTests: []
  }
};

// Utility functions
function logTest(testName, status, details = '') {
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`✅ PASS: ${testName} ${details}`);
  } else {
    testResults.failed++;
    console.log(`❌ FAIL: ${testName} ${details}`);
    testResults.issues.push({ test: testName, details });
  }
}

function logIssue(issue, severity = 'medium') {
  testResults.issues.push({ issue, severity, timestamp: new Date().toISOString() });
  console.log(`🐛 ISSUE [${severity}]: ${issue}`);
}

function logFix(fix) {
  testResults.fixes.push({ fix, timestamp: new Date().toISOString() });
  console.log(`🔧 FIX APPLIED: ${fix}`);
}

async function setupTestUsers() {
  console.log('\n🔧 Setting up test users in Supabase...');
  
  for (const [role, userData] of Object.entries(TEST_CONFIG.testUsers)) {
    try {
      console.log(`Creating ${role} user: ${userData.email}`);
      
      // Try to sign up user (will fail if exists, which is fine)
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          first_name: userData.firstName,
          last_name: userData.lastName
        }
      });
      
      if (data?.user && !error) {
        console.log(`✅ Created user: ${userData.email}`);
        
        // Create profile
        await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: userData.email,
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: userData.role
          });
          
        // Create client profile if needed
        if (userData.role === 'client') {
          await supabase
            .from('client_profiles')
            .upsert({
              id: data.user.id,
              company_name: userData.companyName
            });
        }
        
      } else if (error?.message.includes('already been registered')) {
        console.log(`ℹ️  User already exists: ${userData.email}`);
      } else if (error) {
        console.log(`⚠️  Error creating user: ${error.message}`);
      }
      
    } catch (err) {
      console.log(`⚠️  Setup error for ${userData.email}: ${err.message}`);
    }
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  // Clean up test conversations and messages
  await supabase
    .from('messages')
    .delete()
    .ilike('content', '%E2E TEST%');
    
  await supabase
    .from('conversations')
    .delete()
    .in('client_id', [
      (await supabase.from('profiles').select('id').eq('email', TEST_CONFIG.testUsers.client.email).single())?.data?.id
    ].filter(Boolean));
}

async function authenticateUser(page, userType) {
  const userData = TEST_CONFIG.testUsers[userType];
  console.log(`\n🔐 Authenticating as ${userType}: ${userData.email}`);
  
  const start = Date.now();
  
  await page.goto(`${TEST_CONFIG.baseUrl}/login`);
  
  // Wait for login form
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  // Fill credentials
  await page.fill('input[type="email"]', userData.email);
  await page.fill('input[type="password"]', userData.password);
  
  // Submit and wait for navigation
  const [response] = await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click('button[type="submit"]')
  ]);
  
  const authTime = Date.now() - start;
  testResults.metrics.pageLoads.push({ action: `${userType}_auth`, time: authTime });
  
  const currentUrl = page.url();
  const isAuthenticated = currentUrl.includes('/dashboard') || currentUrl.includes('/admin') || currentUrl.includes('/client');
  
  if (isAuthenticated) {
    logTest(`${userType} Authentication`, 'PASS', `(${authTime}ms)`);
    return true;
  } else {
    logTest(`${userType} Authentication`, 'FAIL', `Redirected to ${currentUrl}`);
    logIssue(`${userType} authentication failed - redirected to ${currentUrl}`, 'high');
    return false;
  }
}

async function testMessagesPageAccess(page, userType) {
  console.log(`\n📱 Testing Messages page access for ${userType}...`);
  
  const start = Date.now();
  
  try {
    await page.goto(`${TEST_CONFIG.baseUrl}/messages`);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - start;
    testResults.metrics.pageLoads.push({ action: `${userType}_messages_page`, time: loadTime });
    
    const currentUrl = page.url();
    
    if (userType === 'client') {
      // Clients should be redirected away from messages page
      // Wait a bit longer for potential redirect
      await page.waitForTimeout(2000);
      const finalUrl = page.url();
      
      if (finalUrl.includes('/messages')) {
        logTest(`${userType} Messages Access Control`, 'FAIL', 'Client can access Messages page');
        logIssue('Client role has access to Messages page - should be restricted', 'high');
        return false;
      } else {
        logTest(`${userType} Messages Access Control`, 'PASS', `Correctly redirected to ${finalUrl}`);
        return true;
      }
    } else {
      // Admin and team should access messages page
      if (currentUrl.includes('/messages')) {
        // Check for messages interface elements
        const sidebarExists = await page.isVisible('.w-80.border-r');
        const messagesHeaderExists = await page.locator('text=Messages').first().isVisible();
        
        if (sidebarExists) {
          logTest(`${userType} Messages Page Access`, 'PASS', `(${loadTime}ms)`);
          return true;
        } else {
          logTest(`${userType} Messages Page Access`, 'FAIL', 'Interface elements missing');
          logIssue(`Messages page loaded but interface elements missing for ${userType}`, 'medium');
          return false;
        }
      } else {
        logTest(`${userType} Messages Page Access`, 'FAIL', `Redirected to ${currentUrl}`);
        logIssue(`${userType} cannot access Messages page - redirected to ${currentUrl}`, 'high');
        return false;
      }
    }
    
  } catch (error) {
    logTest(`${userType} Messages Page Access`, 'FAIL', error.message);
    logIssue(`Error accessing Messages page as ${userType}: ${error.message}`, 'high');
    return false;
  }
}

async function createRealConversation(adminPage, clientUserId) {
  console.log('\n💬 Creating real conversation in database...');
  
  try {
    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        client_id: clientUserId
      })
      .select()
      .single();
      
    if (convError) {
      logIssue(`Failed to create conversation: ${convError.message}`, 'high');
      return null;
    }
    
    console.log(`✅ Created conversation ID: ${conversation.id}`);
    
    // Get admin and team user IDs
    const { data: adminUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', TEST_CONFIG.testUsers.admin.email)
      .single();
      
    const { data: teamUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', TEST_CONFIG.testUsers.teamMember.email)
      .single();
    
    // Add participants to conversation
    const participants = [
      { conversation_id: conversation.id, user_id: clientUserId },
      { conversation_id: conversation.id, user_id: adminUser?.id },
      { conversation_id: conversation.id, user_id: teamUser?.id }
    ].filter(p => p.user_id);
    
    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert(participants);
      
    if (participantsError) {
      logIssue(`Failed to add participants: ${participantsError.message}`, 'medium');
    } else {
      console.log(`✅ Added ${participants.length} participants to conversation`);
    }
    
    // Send initial message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: clientUserId,
        content: 'Hello! This is a test message from E2E testing. 🤖',
        type: 'user'
      })
      .select()
      .single();
      
    if (msgError) {
      logIssue(`Failed to create message: ${msgError.message}`, 'high');
      return conversation.id;
    }
    
    console.log(`✅ Created initial message: ${message.id}`);
    return conversation.id;
    
  } catch (error) {
    logIssue(`Error creating conversation: ${error.message}`, 'high');
    return null;
  }
}

async function testRealMessageSending(page, userType, conversationId) {
  console.log(`\n✉️  Testing real message sending as ${userType}...`);
  
  if (!conversationId) {
    logTest(`${userType} Message Sending`, 'FAIL', 'No conversation available');
    return false;
  }
  
  try {
    // Navigate to messages page
    await page.goto(`${TEST_CONFIG.baseUrl}/messages`);
    await page.waitForLoadState('networkidle');
    
    // Look for conversation in sidebar
    const conversationButtons = await page.$$('[class*="w-full p-3 rounded-lg"]');
    
    if (conversationButtons.length === 0) {
      logTest(`${userType} Message Sending`, 'FAIL', 'No conversations found in UI');
      logIssue(`Conversations exist in DB but not showing in ${userType} UI`, 'high');
      return false;
    }
    
    console.log(`Found ${conversationButtons.length} conversations in UI`);
    
    // Click first conversation
    await conversationButtons[0].click();
    await page.waitForTimeout(1000); // Wait for conversation to load
    
    // Look for message input
    const messageInput = await page.$('textarea[placeholder*="message"]');
    
    if (!messageInput) {
      logTest(`${userType} Message Sending`, 'FAIL', 'Message input not found');
      logIssue(`Message input field not found for ${userType}`, 'high');
      return false;
    }
    
    // Send test message
    const testMessage = `E2E TEST MESSAGE from ${userType} at ${new Date().toISOString()}`;
    
    const start = Date.now();
    await messageInput.fill(testMessage);
    
    // Find send button (look for various possible selectors)
    let sendButton = await page.$('button[type="submit"]') || 
                     await page.$('button:has-text("Send")') ||
                     await page.$('button[class*="flex-shrink-0"]:has([class*="h-4 w-4"])') ||
                     await page.$('button:last-child');
    
    if (!sendButton) {
      // Debug: log all buttons found
      const allButtons = await page.$$('button');
      console.log(`Found ${allButtons.length} buttons total`);
      
      logTest(`${userType} Message Sending`, 'FAIL', 'Send button not found');
      logIssue(`Send button not found for ${userType} (${allButtons.length} buttons total)`, 'medium');
      return false;
    }
    
    await sendButton.click();
    
    // Wait for message to appear
    try {
      await page.waitForSelector(`text="${testMessage}"`, { timeout: 5000 });
      const deliveryTime = Date.now() - start;
      testResults.metrics.messageDelivery.push({ user: userType, time: deliveryTime });
      
      logTest(`${userType} Message Sending`, 'PASS', `(${deliveryTime}ms)`);
      return true;
      
    } catch {
      logTest(`${userType} Message Sending`, 'FAIL', 'Message not visible after sending');
      logIssue(`Message sent by ${userType} but not visible in UI`, 'high');
      return false;
    }
    
  } catch (error) {
    logTest(`${userType} Message Sending`, 'FAIL', error.message);
    logIssue(`Error sending message as ${userType}: ${error.message}`, 'high');
    return false;
  }
}

async function testResponsiveDesign(page, userType) {
  console.log(`\n📱 Testing responsive design for ${userType}...`);
  
  let responsiveIssues = [];
  
  for (const viewport of TEST_CONFIG.viewports) {
    console.log(`Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
    
    await page.setViewportSize(viewport);
    await page.waitForTimeout(500); // Allow layout to adjust
    
    // Navigate to messages page
    await page.goto(`${TEST_CONFIG.baseUrl}/messages`);
    await page.waitForLoadState('networkidle');
    
    // Check if user should have access
    await page.waitForTimeout(1000); // Wait for any redirects
    const currentUrl = page.url();
    
    if (userType === 'client') {
      // Client should be redirected away from messages page
      if (currentUrl.includes('/messages')) {
        responsiveIssues.push(`${viewport.name}: Client can access messages page`);
      } else {
        console.log(`${viewport.name}: Client correctly redirected to ${currentUrl}`);
      }
      continue; // Skip UI tests for client
    }
    
    if (userType !== 'client' && !currentUrl.includes('/messages')) {
      responsiveIssues.push(`${viewport.name}: ${userType} cannot access messages page`);
      continue;
    }
    
    if (userType !== 'client') {
      // Test UI elements for admin/team
      const sidebar = await page.$('.w-80.border-r');
      const sidebarVisible = sidebar ? await sidebar.isVisible() : false;
      
      if (viewport.width >= 768) {
        // Desktop/tablet should show sidebar
        if (!sidebarVisible) {
          responsiveIssues.push(`${viewport.name}: Sidebar should be visible but isn't`);
        }
      } else {
        // Mobile - sidebar behavior depends on implementation
        console.log(`${viewport.name}: Sidebar visible: ${sidebarVisible} (mobile behavior)`);
      }
      
      // Test if chat interface is usable
      const chatThread = await page.$('.flex-1');
      const chatThreadVisible = chatThread ? await chatThread.isVisible() : false;
      
      if (!chatThreadVisible && viewport.width >= 768) {
        responsiveIssues.push(`${viewport.name}: Chat thread should be visible`);
      }
    }
    
    testResults.metrics.responsiveTests.push({
      user: userType,
      viewport: viewport.name,
      width: viewport.width,
      issues: responsiveIssues.length
    });
  }
  
  // Reset to desktop
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  if (responsiveIssues.length === 0) {
    logTest(`${userType} Responsive Design`, 'PASS', `All viewports working`);
    return true;
  } else {
    logTest(`${userType} Responsive Design`, 'FAIL', `${responsiveIssues.length} issues`);
    responsiveIssues.forEach(issue => logIssue(issue, 'medium'));
    return false;
  }
}

async function testFileUpload(page, userType) {
  console.log(`\n📎 Testing file upload for ${userType}...`);
  
  try {
    await page.goto(`${TEST_CONFIG.baseUrl}/messages`);
    await page.waitForLoadState('networkidle');
    
    // Look for file input or upload button
    const fileInputs = await page.$$('input[type="file"]');
    const uploadButtons = await page.$$('button:has-text("attach"), button:has-text("file"), [class*="upload"]');
    
    if (fileInputs.length > 0 || uploadButtons.length > 0) {
      logTest(`${userType} File Upload Interface`, 'PASS', `${fileInputs.length} inputs, ${uploadButtons.length} buttons`);
      return true;
    } else {
      logTest(`${userType} File Upload Interface`, 'FAIL', 'No upload interface found');
      logIssue(`File upload interface missing for ${userType}`, 'low');
      return false;
    }
    
  } catch (error) {
    logTest(`${userType} File Upload Interface`, 'FAIL', error.message);
    return false;
  }
}

async function runComprehensiveTests() {
  console.log('\n🚀 Starting comprehensive E2E tests...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  try {
    // Setup phase
    await setupTestUsers();
    await cleanupTestData();
    
    // Get client user ID for conversation creation
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', TEST_CONFIG.testUsers.client.email)
      .single();
      
    const clientUserId = clientProfile?.id;
    
    if (!clientUserId) {
      console.log('❌ Could not find client user ID');
      return;
    }
    
    // Create real conversation
    const conversationId = await createRealConversation(null, clientUserId);
    
    // Test each user role
    for (const [userType, userData] of Object.entries(TEST_CONFIG.testUsers)) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🧪 TESTING USER ROLE: ${userType.toUpperCase()}`);
      console.log(`${'='.repeat(50)}`);
      
      const page = await browser.newPage();
      
      try {
        // Authentication test
        const authSuccess = await authenticateUser(page, userType);
        if (!authSuccess) continue;
        
        // Messages page access test
        const accessSuccess = await testMessagesPageAccess(page, userType);
        
        // Only test messaging features for admin/team
        if (userType !== 'client' && accessSuccess) {
          // Real message sending test
          await testRealMessageSending(page, userType, conversationId);
          
          // File upload test
          await testFileUpload(page, userType);
        }
        
        // Responsive design test
        await testResponsiveDesign(page, userType);
        
      } catch (error) {
        logIssue(`Critical error testing ${userType}: ${error.message}`, 'critical');
      } finally {
        await page.close();
      }
    }
    
    // Final results
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 SUMMARY:`);
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
    
    if (testResults.issues.length > 0) {
      console.log(`\n🐛 ISSUES FOUND (${testResults.issues.length}):`);
      testResults.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity || 'medium'}] ${issue.issue || issue.test + ': ' + issue.details}`);
      });
    }
    
    if (testResults.fixes.length > 0) {
      console.log(`\n🔧 FIXES APPLIED (${testResults.fixes.length}):`);
      testResults.fixes.forEach((fix, index) => {
        console.log(`${index + 1}. ${fix.fix}`);
      });
    }
    
    // Performance metrics
    console.log(`\n⚡ PERFORMANCE METRICS:`);
    if (testResults.metrics.pageLoads.length > 0) {
      const avgPageLoad = Math.round(
        testResults.metrics.pageLoads.reduce((sum, metric) => sum + metric.time, 0) / 
        testResults.metrics.pageLoads.length
      );
      console.log(`Average Page Load: ${avgPageLoad}ms`);
    }
    
    if (testResults.metrics.messageDelivery.length > 0) {
      const avgMessageDelivery = Math.round(
        testResults.metrics.messageDelivery.reduce((sum, metric) => sum + metric.time, 0) / 
        testResults.metrics.messageDelivery.length
      );
      console.log(`Average Message Delivery: ${avgMessageDelivery}ms`);
    }
    
    const successRate = (testResults.passed / testResults.total) * 100;
    
    if (successRate === 100) {
      console.log('\n🎉 PERFECT! All tests passed with 100% success rate!');
    } else if (successRate >= 80) {
      console.log('\n✅ GOOD! Most tests passed - review and fix remaining issues');
    } else {
      console.log('\n⚠️  NEEDS WORK! Multiple issues found - significant improvements needed');
    }
    
    // Cleanup
    await cleanupTestData();
    
  } catch (error) {
    console.log('💥 CRITICAL ERROR:', error);
  } finally {
    await browser.close();
  }
}

// Run the comprehensive test suite
runComprehensiveTests().catch(console.error);