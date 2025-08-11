#!/usr/bin/env node

/**
 * Create Demo Conversations and Message History
 * Creates realistic conversation threads between demo users
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('💬 Creating Demo Conversations and Message History');
console.log('=================================================');

// Get user IDs helper
async function getUserByEmail(email) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();
  return data;
}

// Demo conversation scenarios
const CONVERSATION_SCENARIOS = [
  {
    clientEmail: 'sarah@acmecorp.com',
    clientName: 'Sarah Johnson',
    companyName: 'Acme Corporation',
    messages: [
      {
        sender: 'client',
        content: "Hi! I'm excited to get started with our new website project. Could you walk me through the initial steps?",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        sender: 'admin',
        content: "Hello Sarah! Welcome to the team. I'll be your primary contact for this project. Let's schedule a kickoff meeting to discuss your requirements in detail.",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000) // 30 min later
      },
      {
        sender: 'client', 
        content: "That sounds perfect! I'm available this Thursday or Friday afternoon. We need a modern, responsive site that showcases our technology solutions.",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        sender: 'team',
        content: "Hi Sarah! I'm Taylor, the lead developer on your project. I've reviewed your requirements and have some initial wireframes ready. Would you like me to share them?",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        sender: 'client',
        content: "Yes, I'd love to see the wireframes! Also, can we discuss integrating with our existing CRM system?",
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      },
      {
        sender: 'admin', 
        content: "Absolutely! CRM integration is definitely doable. I'll have our technical team review your current setup. The wireframes look great - you'll love the modern design approach.",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      }
    ]
  },
  {
    clientEmail: 'mike@techstartup.co',
    clientName: 'Mike Chen', 
    companyName: 'TechStartup Co',
    messages: [
      {
        sender: 'client',
        content: "Hey team! We're ready to launch our mobile app development project. Our startup is moving fast and we need an agile approach.",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        sender: 'team',
        content: "Hi Mike! Great to have you aboard. As a startup ourselves, we totally understand the need for speed. Let's set up a sprint-based development cycle.",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000) // 45 min later
      },
      {
        sender: 'client',
        content: "Perfect! We're thinking React Native for cross-platform compatibility. Our target is iOS and Android launch within 3 months.",
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
      },
      {
        sender: 'admin',
        content: "React Native is an excellent choice for your timeline. I'm assigning Taylor as your lead developer - they have extensive experience with startup mobile projects.",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        sender: 'team',
        content: "Thanks Alex! Mike, I've created a project roadmap with weekly milestones. Week 1-2: Core architecture, Week 3-6: Feature development, Week 7-8: Testing & polish.",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        sender: 'client',
        content: "This timeline looks aggressive but achievable! Can we also discuss the backend API requirements?",
        timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000) // 18 hours ago
      }
    ]
  },
  {
    clientEmail: 'lisa@retailplus.com', 
    clientName: 'Lisa Rodriguez',
    companyName: 'RetailPlus Inc',
    messages: [
      {
        sender: 'client',
        content: "Hello! We need help modernizing our e-commerce platform. Our current site is outdated and we're losing customers to competitors.",
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      {
        sender: 'admin',
        content: "Hi Lisa! E-commerce modernization is our specialty. Let's start with a comprehensive audit of your current platform and user experience.",
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000) // 1 hour later  
      },
      {
        sender: 'client',
        content: "We're particularly concerned about mobile shopping experience and page load speeds. Our analytics show 60% mobile traffic but low conversion rates.",
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
      },
      {
        sender: 'team',
        content: "Those are critical issues for e-commerce success. I'll run a performance audit and mobile UX analysis. We can likely improve conversions significantly.",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        sender: 'client',
        content: "That would be amazing! We're also interested in implementing abandoned cart recovery and better product recommendations.",
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
      },
      {
        sender: 'admin',
        content: "Excellent additions! Those features typically increase revenue by 15-25%. I'll prepare a comprehensive proposal with timeline and investment details.",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago  
      },
      {
        sender: 'client',
        content: "Looking forward to the proposal! When can we expect the initial audit results?",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
      }
    ]
  }
];

async function createDemoConversations() {
  console.log('\n🔧 Creating demo conversations...\n');
  
  // Get user profiles
  const adminUser = await getUserByEmail('admin@demo.com');
  const teamUser = await getUserByEmail('team@demo.com');
  
  if (!adminUser || !teamUser) {
    console.log('❌ Could not find admin or team users');
    return;
  }
  
  for (const scenario of CONVERSATION_SCENARIOS) {
    try {
      console.log(`Creating conversation with ${scenario.clientName} (${scenario.companyName})`);
      
      const clientUser = await getUserByEmail(scenario.clientEmail);
      if (!clientUser) {
        console.log(`  ❌ Client not found: ${scenario.clientEmail}`);
        continue;
      }
      
      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          client_id: clientUser.id
        })
        .select()
        .single();
        
      if (convError) {
        console.log(`  ❌ Conversation error: ${convError.message}`);
        continue;
      }
      
      console.log(`  ✅ Created conversation: ${conversation.id}`);
      
      // Add participants 
      const participants = [
        { conversation_id: conversation.id, user_id: clientUser.id },
        { conversation_id: conversation.id, user_id: adminUser.id },
        { conversation_id: conversation.id, user_id: teamUser.id }
      ];
      
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participants);
        
      if (participantsError) {
        console.log(`  ⚠️  Participants error: ${participantsError.message}`);
      } else {
        console.log(`  ✅ Added participants`);
      }
      
      // Create messages
      for (let i = 0; i < scenario.messages.length; i++) {
        const msgData = scenario.messages[i];
        
        let senderId;
        switch (msgData.sender) {
          case 'client':
            senderId = clientUser.id;
            break;
          case 'admin': 
            senderId = adminUser.id;
            break;
          case 'team':
            senderId = teamUser.id;
            break;
        }
        
        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            sender_id: senderId,
            content: msgData.content,
            type: 'user',
            created_at: msgData.timestamp.toISOString()
          });
          
        if (msgError) {
          console.log(`    ⚠️  Message ${i + 1} error: ${msgError.message}`);
        } else {
          console.log(`    ✅ Added message ${i + 1}`);
        }
      }
      
      console.log(`  🎉 Completed conversation (${scenario.messages.length} messages)\n`);
      
    } catch (error) {
      console.log(`  ❌ Error with ${scenario.clientEmail}: ${error.message}\n`);
    }
  }
}

async function displayConversationSummary() {
  console.log('💬 DEMO CONVERSATIONS CREATED:');
  console.log('==============================\n');
  
  CONVERSATION_SCENARIOS.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.companyName} (${scenario.clientName})`);
    console.log(`   Client: ${scenario.clientEmail}`);
    console.log(`   Messages: ${scenario.messages.length} messages`);
    console.log(`   Timeline: ${Math.ceil((Date.now() - scenario.messages[0].timestamp) / (24 * 60 * 60 * 1000))} days of history`);
    console.log('');
  });
  
  console.log('🎯 CONVERSATION THEMES:');
  console.log('========================');
  console.log('• Acme Corp - Website redesign project (ongoing)');
  console.log('• TechStartup - Mobile app development (sprint planning)'); 
  console.log('• RetailPlus - E-commerce platform modernization (audit phase)');
  console.log('');
  console.log('📱 TO TEST:');
  console.log('============');
  console.log('1. Login as admin@demo.com or team@demo.com');
  console.log('2. Go to Messages page');
  console.log('3. See conversation threads with realistic history');
  console.log('4. Test message button on client profile pages');
}

// Run the conversation creation
createDemoConversations()
  .then(displayConversationSummary)
  .catch(console.error);