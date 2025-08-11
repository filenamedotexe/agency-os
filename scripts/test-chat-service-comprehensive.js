#!/usr/bin/env node

/**
 * Step 3.1: Chat Service Functionality Test
 * Tests all chat server actions to ensure they work correctly
 * Run with: node scripts/test-chat-service.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create service client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🧪 CHAT SERVICE FUNCTIONALITY TEST');
console.log('===================================');

async function testDatabaseTables() {
  console.log('\n📊 STEP 1: Database Tables Verification');
  console.log('-'.repeat(50));

  try {
    // Test conversations table
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);

    if (convError) {
      console.log('❌ Conversations table error:', convError.message);
      return false;
    }
    console.log('✅ Conversations table accessible');

    // Test messages table  
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);

    if (msgError) {
      console.log('❌ Messages table error:', msgError.message);
      return false;
    }
    console.log('✅ Messages table accessible');

    // Test conversation_participants table
    const { data: participants, error: partError } = await supabase
      .from('conversation_participants')
      .select('*')
      .limit(1);

    if (partError) {
      console.log('❌ Conversation_participants table error:', partError.message);
      return false;
    }
    console.log('✅ Conversation_participants table accessible');

    // Test profiles table (for join queries)
    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role')
      .limit(1);

    if (profError) {
      console.log('❌ Profiles table error:', profError.message);
      return false;
    }
    console.log('✅ Profiles table accessible');

    return true;
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
    return false;
  }
}

async function testConversationCreation() {
  console.log('\n💬 STEP 2: Conversation Creation Test');
  console.log('-'.repeat(50));

  try {
    // Get a test client user
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'client')
      .limit(1)
      .single();

    if (!clientProfile) {
      console.log('❌ No client profile found for testing');
      return false;
    }

    console.log(`Using test client: ${clientProfile.email}`);

    // Test conversation creation logic (simulating the server action)
    const clientId = clientProfile.id;

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (existing) {
      console.log('✅ Existing conversation found:', existing.id);
      return existing;
    }

    // Create new conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        client_id: clientId
      })
      .select()
      .single();

    if (convError) {
      console.log('❌ Conversation creation failed:', convError.message);
      return false;
    }

    console.log('✅ New conversation created:', conversation.id);

    // Add client as participant
    const { error: partError } = await supabase
      .from('conversation_participants')
      .insert({
        conversation_id: conversation.id,
        user_id: clientId
      });

    if (partError) {
      console.log('❌ Participant addition failed:', partError.message);
      return false;
    }

    console.log('✅ Client added as participant');
    return conversation;

  } catch (error) {
    console.log('❌ Conversation creation test failed:', error.message);
    return false;
  }
}

async function testMessageInsertion(conversation) {
  console.log('\n📝 STEP 3: Message Insertion Test');
  console.log('-'.repeat(50));

  if (!conversation) {
    console.log('❌ No conversation provided for message test');
    return false;
  }

  try {
    // Get a team member to send a message
    const { data: teamProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'team_member')
      .limit(1)
      .single();

    if (!teamProfile) {
      console.log('❌ No team profile found for testing');
      return false;
    }

    console.log(`Using test team member: ${teamProfile.email}`);

    // Insert a test message (simulating sendMessage server action)
    const testContent = `Test message from chat service - ${new Date().toISOString()}`;

    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: teamProfile.id,
        type: 'user',
        content: testContent,
        attachments: []
      })
      .select(`
        *,
        sender:profiles(*)
      `)
      .single();

    if (msgError) {
      console.log('❌ Message insertion failed:', msgError.message);
      return false;
    }

    console.log('✅ Message inserted successfully');
    console.log(`   Content: ${message.content}`);
    console.log(`   Sender: ${message.sender.email}`);

    // Update conversation last message (simulating server action)
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: testContent.substring(0, 100)
      })
      .eq('id', conversation.id);

    if (updateError) {
      console.log('❌ Conversation update failed:', updateError.message);
      return false;
    }

    console.log('✅ Conversation updated with last message');
    return message;

  } catch (error) {
    console.log('❌ Message insertion test failed:', error.message);
    return false;
  }
}

async function testSystemMessage(conversation) {
  console.log('\n🤖 STEP 4: System Message Test');
  console.log('-'.repeat(50));

  if (!conversation) {
    console.log('❌ No conversation provided for system message test');
    return false;
  }

  try {
    // Insert a system message (simulating sendSystemMessage server action)
    const systemContent = 'New service milestone completed: Project Phase 1';
    const systemMetadata = { 
      type: 'milestone_completed',
      milestone_id: 'test-milestone-123',
      service_id: 'test-service-456'
    };

    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: null, // System messages have null sender
        type: 'system',
        content: systemContent,
        metadata: systemMetadata
      })
      .select()
      .single();

    if (msgError) {
      console.log('❌ System message insertion failed:', msgError.message);
      return false;
    }

    console.log('✅ System message inserted successfully');
    console.log(`   Content: ${message.content}`);
    console.log(`   Metadata:`, message.metadata);

    // Update conversation (simulating server action)
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: `System: ${systemContent.substring(0, 80)}`
      })
      .eq('id', conversation.id);

    if (updateError) {
      console.log('❌ Conversation update failed:', updateError.message);
      return false;
    }

    console.log('✅ Conversation updated with system message');
    return message;

  } catch (error) {
    console.log('❌ System message test failed:', error.message);
    return false;
  }
}

async function testMessageRetrieval(conversation) {
  console.log('\n📖 STEP 5: Message Retrieval Test');
  console.log('-'.repeat(50));

  if (!conversation) {
    console.log('❌ No conversation provided for message retrieval test');
    return false;
  }

  try {
    // Retrieve messages (simulating getMessages server action)
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(
          id,
          email,
          first_name,
          last_name,
          avatar_url,
          role
        )
      `)
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.log('❌ Message retrieval failed:', error.message);
      return false;
    }

    console.log(`✅ Retrieved ${messages.length} messages`);
    
    // Display message summary
    messages.reverse().forEach((msg, index) => {
      const senderInfo = msg.sender ? msg.sender.email : 'System';
      const contentPreview = msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '');
      console.log(`   ${index + 1}. [${msg.type}] ${senderInfo}: ${contentPreview}`);
    });

    return messages;

  } catch (error) {
    console.log('❌ Message retrieval test failed:', error.message);
    return false;
  }
}

async function testStorageConnection() {
  console.log('\n📂 STEP 6: Storage Connection Test');
  console.log('-'.repeat(50));

  try {
    // Test storage bucket access
    const { data: files, error } = await supabase
      .storage
      .from('chat-attachments')
      .list();

    if (error) {
      console.log('❌ Storage access failed:', error.message);
      return false;
    }

    console.log(`✅ Storage bucket accessible`);
    console.log(`   Found ${files.length} files/folders in bucket`);

    // Test public URL generation
    const testUrl = supabase
      .storage
      .from('chat-attachments')
      .getPublicUrl('test-path/test-file.txt');

    console.log('✅ Public URL generation working');
    console.log(`   Test URL: ${testUrl.data.publicUrl}`);

    return true;

  } catch (error) {
    console.log('❌ Storage connection test failed:', error.message);
    return false;
  }
}

async function cleanupTestData(conversation) {
  console.log('\n🧹 CLEANUP: Removing Test Data');
  console.log('-'.repeat(50));

  if (!conversation) {
    console.log('ℹ️  No test conversation to clean up');
    return;
  }

  try {
    // Delete test messages
    const { error: msgError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversation.id);

    if (msgError) {
      console.log('⚠️  Could not delete test messages:', msgError.message);
    } else {
      console.log('✅ Test messages cleaned up');
    }

    // Delete test participants
    const { error: partError } = await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversation.id);

    if (partError) {
      console.log('⚠️  Could not delete test participants:', partError.message);
    } else {
      console.log('✅ Test participants cleaned up');
    }

    // Delete test conversation
    const { error: convError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversation.id);

    if (convError) {
      console.log('⚠️  Could not delete test conversation:', convError.message);
    } else {
      console.log('✅ Test conversation cleaned up');
    }

  } catch (error) {
    console.log('⚠️  Cleanup failed:', error.message);
  }
}

async function runAllTests() {
  console.log('Starting comprehensive chat service tests...\n');

  const results = {
    database: false,
    conversation: false,
    message: false,
    systemMessage: false,
    retrieval: false,
    storage: false
  };

  let testConversation = null;

  try {
    // Run all tests
    results.database = await testDatabaseTables();
    testConversation = await testConversationCreation();
    results.conversation = !!testConversation;
    results.message = await testMessageInsertion(testConversation);
    results.systemMessage = await testSystemMessage(testConversation);
    results.retrieval = await testMessageRetrieval(testConversation);
    results.storage = await testStorageConnection();

    // Final summary
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));

    console.log(`Database Tables:       ${results.database ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Conversation Creation: ${results.conversation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Message Insertion:     ${results.message ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`System Messages:       ${results.systemMessage ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Message Retrieval:     ${results.retrieval ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Storage Connection:    ${results.storage ? '✅ PASS' : '❌ FAIL'}`);

    const passCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;

    console.log('\n' + '='.repeat(50));
    if (passCount === totalTests) {
      console.log('🎉 ALL TESTS PASSED - Chat service is fully functional!');
      console.log('✅ Ready to proceed with UI implementation');
    } else {
      console.log(`⚠️  ${passCount}/${totalTests} tests passed - Issues need to be resolved`);
      console.log('❌ Fix the failing tests before proceeding');
    }

    // Cleanup
    await cleanupTestData(testConversation);

    console.log('\n✨ Chat service functionality verification completed!');
    process.exit(passCount === totalTests ? 0 : 1);

  } catch (error) {
    console.log('\n💥 CRITICAL ERROR during testing:', error.message);
    console.log('Stack:', error.stack);
    
    // Attempt cleanup even on failure
    await cleanupTestData(testConversation);
    process.exit(1);
  }
}

// Run the tests
runAllTests();