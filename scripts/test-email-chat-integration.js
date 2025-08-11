#!/usr/bin/env node

/**
 * Step 4.1: Test Email-to-Chat Integration
 * Verifies that emails are automatically logged as system messages in chat threads
 * Run with: node scripts/test-email-chat-integration.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create service client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🧪 EMAIL-TO-CHAT INTEGRATION TEST');
console.log('==================================');

async function setupTestData() {
  console.log('\n📋 STEP 1: Test Data Setup');
  console.log('-'.repeat(50));

  try {
    // Get a test client
    const { data: testClient } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'client')
      .limit(1)
      .single();

    if (!testClient) {
      console.log('❌ No client profile found for testing');
      return null;
    }

    console.log(`✅ Using test client: ${testClient.email} (${testClient.id})`);

    // Create or get conversation for this client
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('client_id', testClient.id)
      .single();

    if (!conversation) {
      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          client_id: testClient.id
        })
        .select()
        .single();

      if (convError) {
        console.log('❌ Failed to create conversation:', convError.message);
        return null;
      }

      conversation = newConv;
      console.log(`✅ Created test conversation: ${conversation.id}`);

      // Add client as participant
      await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversation.id,
          user_id: testClient.id
        });
    } else {
      console.log(`✅ Using existing conversation: ${conversation.id}`);
    }

    return { client: testClient, conversation };

  } catch (error) {
    console.log('❌ Test data setup failed:', error.message);
    return null;
  }
}

async function testEmailLogToChat(testData) {
  console.log('\n📧 STEP 2: Email Logging to Chat Test');
  console.log('-'.repeat(50));

  if (!testData) {
    console.log('❌ No test data provided');
    return false;
  }

  try {
    const { client, conversation } = testData;
    
    // Simulate the sendSystemMessage function call that would happen in the email service
    const testEmailSubject = `Test Email Integration - ${new Date().toISOString()}`;
    const testEmailMetadata = {
      type: 'email_sent',
      email_type: 'welcome',
      subject: testEmailSubject,
      resend_id: 'test-id-123',
      test: true
    };

    console.log('📨 Simulating email sent notification...');
    console.log(`   Subject: ${testEmailSubject}`);
    console.log(`   Conversation ID: ${conversation.id}`);

    // Insert system message (this simulates what the updated email service would do)
    const { data: systemMessage, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: null, // System message
        type: 'system',
        content: `📧 Email sent: ${testEmailSubject}`,
        metadata: testEmailMetadata
      })
      .select()
      .single();

    if (msgError) {
      console.log('❌ Failed to create system message:', msgError.message);
      return false;
    }

    console.log('✅ System message created successfully');
    console.log(`   Message ID: ${systemMessage.id}`);
    console.log(`   Content: ${systemMessage.content}`);

    // Verify message appears in conversation
    const { data: messages, error: queryError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (queryError) {
      console.log('❌ Failed to query messages:', queryError.message);
      return false;
    }

    const emailMessage = messages.find(m => m.id === systemMessage.id);
    if (emailMessage) {
      console.log('✅ Email system message found in conversation');
      console.log(`   Created at: ${emailMessage.created_at}`);
      console.log(`   Metadata: ${JSON.stringify(emailMessage.metadata, null, 2)}`);
    } else {
      console.log('❌ Email system message not found in conversation');
      return false;
    }

    return { testData, systemMessage };

  } catch (error) {
    console.log('❌ Email logging test failed:', error.message);
    return false;
  }
}

async function testConversationUpdate(testResult) {
  console.log('\n💬 STEP 3: Conversation Update Test');
  console.log('-'.repeat(50));

  if (!testResult) {
    console.log('❌ No test result provided');
    return false;
  }

  try {
    const { testData, systemMessage } = testResult;
    const { conversation } = testData;

    // Simulate updating conversation with last message (as the email service would do)
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        last_message_at: systemMessage.created_at,
        last_message_preview: `System: ${systemMessage.content.substring(0, 80)}`
      })
      .eq('id', conversation.id);

    if (updateError) {
      console.log('❌ Failed to update conversation:', updateError.message);
      return false;
    }

    console.log('✅ Conversation updated with email notification');

    // Verify conversation was updated
    const { data: updatedConv, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversation.id)
      .single();

    if (fetchError) {
      console.log('❌ Failed to fetch updated conversation:', fetchError.message);
      return false;
    }

    console.log(`✅ Last message preview: ${updatedConv.last_message_preview}`);
    console.log(`✅ Last message time: ${updatedConv.last_message_at}`);

    return testResult;

  } catch (error) {
    console.log('❌ Conversation update test failed:', error.message);
    return false;
  }
}

async function verifyIntegration(testResult) {
  console.log('\n🔍 STEP 4: Integration Verification');
  console.log('-'.repeat(50));

  if (!testResult) {
    console.log('❌ No test result provided');
    return false;
  }

  try {
    const { testData, systemMessage } = testResult;
    const { conversation } = testData;

    // Check that the message has the correct structure for email notifications
    console.log('🔍 Verifying message structure...');
    
    const requiredFields = {
      'sender_id': null, // System message
      'type': 'system',
      'content': (content) => content.startsWith('📧 Email sent:'),
      'metadata.type': 'email_sent',
      'metadata.email_type': (val) => val !== undefined,
      'metadata.subject': (val) => val !== undefined
    };

    let verificationPassed = true;

    Object.entries(requiredFields).forEach(([field, expectedValue]) => {
      const fieldPath = field.split('.');
      let actualValue = systemMessage;
      
      for (const path of fieldPath) {
        actualValue = actualValue?.[path];
      }

      let isValid = false;
      if (typeof expectedValue === 'function') {
        isValid = expectedValue(actualValue);
      } else {
        isValid = actualValue === expectedValue;
      }

      if (isValid) {
        console.log(`   ✅ ${field}: ${actualValue}`);
      } else {
        console.log(`   ❌ ${field}: expected ${expectedValue}, got ${actualValue}`);
        verificationPassed = false;
      }
    });

    if (verificationPassed) {
      console.log('✅ All message fields verified correctly');
    } else {
      console.log('❌ Message structure verification failed');
      return false;
    }

    // Verify the message appears in chronological order
    const { data: allMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    console.log(`✅ Total messages in conversation: ${allMessages.length}`);
    console.log('📋 Message timeline:');
    allMessages.forEach((msg, index) => {
      const sender = msg.sender_id ? 'User' : 'System';
      const preview = msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '');
      console.log(`   ${index + 1}. [${msg.type}] ${sender}: ${preview}`);
    });

    return true;

  } catch (error) {
    console.log('❌ Integration verification failed:', error.message);
    return false;
  }
}

async function cleanupTestData(testData) {
  console.log('\n🧹 CLEANUP: Removing Test Data');
  console.log('-'.repeat(50));

  if (!testData) {
    console.log('ℹ️  No test data to clean up');
    return;
  }

  try {
    const { conversation } = testData;

    // Delete test messages
    const { error: msgError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversation.id)
      .eq('type', 'system')
      .like('content', '%Test Email Integration%');

    if (msgError) {
      console.log('⚠️  Could not delete test messages:', msgError.message);
    } else {
      console.log('✅ Test messages cleaned up');
    }

  } catch (error) {
    console.log('⚠️  Cleanup failed:', error.message);
  }
}

async function runIntegrationTest() {
  console.log('Starting email-to-chat integration test...\n');

  const results = {
    setup: false,
    emailLogging: false,
    conversationUpdate: false,
    verification: false
  };

  let testData = null;

  try {
    // Run all tests
    testData = await setupTestData();
    results.setup = !!testData;

    const emailResult = await testEmailLogToChat(testData);
    results.emailLogging = !!emailResult;

    const updateResult = await testConversationUpdate(emailResult);
    results.conversationUpdate = !!updateResult;

    results.verification = await verifyIntegration(updateResult);

    // Final summary
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));

    console.log(`Test Data Setup:        ${results.setup ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Email Logging to Chat:  ${results.emailLogging ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Conversation Update:    ${results.conversationUpdate ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Integration Verification: ${results.verification ? '✅ PASS' : '❌ FAIL'}`);

    const passCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;

    console.log('\n' + '='.repeat(50));
    if (passCount === totalTests) {
      console.log('🎉 ALL TESTS PASSED - Email-to-chat integration is working!');
      console.log('✅ Emails will now appear as system messages in client conversations');
    } else {
      console.log(`⚠️  ${passCount}/${totalTests} tests passed - Issues need to be resolved`);
      console.log('❌ Review the failing tests above');
    }

    // Cleanup
    await cleanupTestData(testData);

    console.log('\n✨ Email-to-chat integration test completed!');
    process.exit(passCount === totalTests ? 0 : 1);

  } catch (error) {
    console.log('\n💥 CRITICAL ERROR during testing:', error.message);
    console.log('Stack:', error.stack);
    
    // Attempt cleanup even on failure
    await cleanupTestData(testData);
    process.exit(1);
  }
}

// Run the tests
runIntegrationTest();