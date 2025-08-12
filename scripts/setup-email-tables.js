#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupEmailTables() {
  console.log('🔧 Setting up email management tables...\n');

  try {
    // 1. Create email_templates table
    console.log('Creating email_templates table...');
    const { error: templatesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS email_templates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          subject VARCHAR(500) NOT NULL,
          description TEXT,
          html_content TEXT NOT NULL,
          text_content TEXT,
          variables JSONB DEFAULT '[]'::jsonb,
          is_active BOOLEAN DEFAULT true,
          trigger_event VARCHAR(255),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          created_by UUID REFERENCES profiles(id),
          updated_by UUID REFERENCES profiles(id)
        );
        
        -- Create index on slug for fast lookups
        CREATE INDEX IF NOT EXISTS idx_email_templates_slug ON email_templates(slug);
        CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);
      `
    });
    
    if (templatesError) {
      console.log('⚠️ email_templates table might already exist or error:', templatesError.message);
    } else {
      console.log('✅ email_templates table created');
    }

    // 2. Ensure email_logs table exists with proper structure
    console.log('\nChecking email_logs table...');
    const { error: logsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS email_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          recipient_id UUID REFERENCES profiles(id),
          recipient_email VARCHAR(255) NOT NULL,
          template_id UUID REFERENCES email_templates(id),
          type VARCHAR(255) NOT NULL,
          subject VARCHAR(500) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          error TEXT,
          metadata JSONB DEFAULT '{}'::jsonb,
          sent_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_id ON email_logs(recipient_id);
        CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
        CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
      `
    });
    
    if (logsError) {
      console.log('⚠️ email_logs table might already exist or error:', logsError.message);
    } else {
      console.log('✅ email_logs table created/verified');
    }

    // 3. Insert default email templates
    console.log('\nInserting default email templates...');
    
    const defaultTemplates = [
      {
        name: 'Welcome Email',
        slug: 'welcome',
        subject: 'Welcome to AgencyOS, {{first_name}}! 🎉',
        description: 'Sent when a new client account is created',
        html_content: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #18181b; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0;">AgencyOS</h1>
              </div>
              <div style="padding: 32px;">
                <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">Welcome to AgencyOS, {{first_name}}! 🎉</h2>
                <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                  We're excited to have {{company_name}} onboard! Your account has been set up and you're ready to start collaborating with our team.
                </p>
                <p style="font-size: 16px; margin-bottom: 24px;">Here's what you can do next:</p>
                <ul style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                  <li>View your active projects and milestones</li>
                  <li>Track progress in real-time</li>
                  <li>Communicate directly with your team</li>
                  <li>Access all project files and deliverables</li>
                </ul>
                <a href="{{dashboard_url}}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">
                  Access Your Dashboard
                </a>
                <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
                  If you have any questions, just reply to this email or message us through the platform.
                </p>
              </div>
            </div>
          </div>
        `,
        text_content: 'Welcome to AgencyOS, {{first_name}}! We are excited to have {{company_name}} onboard.',
        variables: [
          { key: 'first_name', description: 'Recipient first name' },
          { key: 'company_name', description: 'Client company name' },
          { key: 'dashboard_url', description: 'Dashboard URL' }
        ],
        is_active: true,
        trigger_event: 'client_created'
      },
      {
        name: 'Milestone Complete',
        slug: 'milestone_complete',
        subject: 'Milestone Complete: {{milestone_name}} ✅',
        description: 'Sent when a project milestone is marked as complete',
        html_content: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #18181b; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0;">AgencyOS</h1>
              </div>
              <div style="padding: 32px;">
                <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">Milestone Complete! ✅</h2>
                <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">Hi {{first_name}},</p>
                <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                  Great news! We've completed <strong>{{milestone_name}}</strong> for your <strong>{{service_name}}</strong> project.
                </p>
                <p style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">What's Next:</p>
                <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                  {{next_steps}}
                </p>
                <a href="{{dashboard_url}}" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">
                  View Progress
                </a>
              </div>
            </div>
          </div>
        `,
        text_content: 'Hi {{first_name}}, Great news! We have completed {{milestone_name}} for your {{service_name}} project.',
        variables: [
          { key: 'first_name', description: 'Recipient first name' },
          { key: 'milestone_name', description: 'Name of completed milestone' },
          { key: 'service_name', description: 'Service/Project name' },
          { key: 'next_steps', description: 'Description of next steps' },
          { key: 'dashboard_url', description: 'Dashboard URL' }
        ],
        is_active: true,
        trigger_event: 'milestone_completed'
      },
      {
        name: 'Task Assigned',
        slug: 'task_assigned',
        subject: 'New Task: {{task_title}}',
        description: 'Sent when a task is assigned to a team member',
        html_content: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #18181b; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0;">AgencyOS</h1>
              </div>
              <div style="padding: 32px;">
                <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">New Task Assigned 📋</h2>
                <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">Hi {{assignee_name}},</p>
                <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">You've been assigned a new task:</p>
                <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
                  <h3 style="font-size: 18px; font-weight: bold; margin: 0 0 8px 0;">{{task_title}}</h3>
                  <p style="font-size: 14px; margin: 0 0 12px 0;">{{task_description}}</p>
                  <div style="font-size: 14px;">
                    <div style="margin-bottom: 4px;"><strong>Project:</strong> {{service_name}}</div>
                    <div style="margin-bottom: 4px;"><strong>Due:</strong> {{due_date}}</div>
                    <div><strong>Priority:</strong> <span style="color: {{priority_color}}; font-weight: bold;">{{priority}}</span></div>
                  </div>
                </div>
                <a href="{{task_url}}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">
                  View Task Details
                </a>
              </div>
            </div>
          </div>
        `,
        text_content: 'Hi {{assignee_name}}, You have been assigned a new task: {{task_title}}',
        variables: [
          { key: 'assignee_name', description: 'Task assignee name' },
          { key: 'task_title', description: 'Task title' },
          { key: 'task_description', description: 'Task description' },
          { key: 'service_name', description: 'Service/Project name' },
          { key: 'due_date', description: 'Task due date' },
          { key: 'priority', description: 'Task priority (HIGH, MEDIUM, LOW)' },
          { key: 'priority_color', description: 'Priority color code' },
          { key: 'task_url', description: 'Direct URL to task' }
        ],
        is_active: false, // Start as inactive for testing
        trigger_event: 'task_assigned'
      }
    ];

    for (const template of defaultTemplates) {
      const { error } = await supabase
        .from('email_templates')
        .upsert(template, { onConflict: 'slug' });
      
      if (error) {
        console.log(`⚠️ Error inserting ${template.name}:`, error.message);
      } else {
        console.log(`✅ Template inserted: ${template.name}`);
      }
    }

    // 4. Create RLS policies
    console.log('\nSetting up RLS policies...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS
        ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
        ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
        
        -- Email templates policies (admin only)
        CREATE POLICY "Admin can view all templates" ON email_templates
          FOR SELECT TO authenticated
          USING (EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
          ));
        
        CREATE POLICY "Admin can manage templates" ON email_templates
          FOR ALL TO authenticated
          USING (EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
          ));
        
        -- Email logs policies
        CREATE POLICY "Admin can view all logs" ON email_logs
          FOR SELECT TO authenticated
          USING (EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
          ));
        
        CREATE POLICY "Users can view their own email logs" ON email_logs
          FOR SELECT TO authenticated
          USING (recipient_id = auth.uid());
        
        CREATE POLICY "System can insert email logs" ON email_logs
          FOR INSERT TO authenticated
          WITH CHECK (true);
      `
    });
    
    if (rlsError) {
      console.log('⚠️ RLS policies might already exist:', rlsError.message);
    } else {
      console.log('✅ RLS policies created');
    }

    console.log('\n✅ Email management tables setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up email tables:', error);
    process.exit(1);
  }
}

// Run the setup
setupEmailTables();