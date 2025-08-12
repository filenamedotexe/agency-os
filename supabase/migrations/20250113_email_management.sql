-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
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
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_slug ON public.email_templates(slug);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON public.email_templates(is_active);

-- Add template_id to email_logs if not exists
ALTER TABLE public.email_logs 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.email_templates(id);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can view all templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admin can manage templates" ON public.email_templates;

-- Create policies for email_templates
CREATE POLICY "Admin can view all templates" ON public.email_templates
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Admin can manage templates" ON public.email_templates
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

-- Insert default templates
INSERT INTO public.email_templates (name, slug, subject, description, html_content, text_content, variables, is_active, trigger_event)
VALUES 
(
  'Welcome Email',
  'welcome',
  'Welcome to AgencyOS, {{first_name}}! 🎉',
  'Sent when a new client account is created',
  '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #18181b; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0;">AgencyOS</h1>
      </div>
      <div style="padding: 32px;">
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">Welcome to AgencyOS, {{first_name}}! 🎉</h2>
        <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">
          We''re excited to have {{company_name}} onboard! Your account has been set up and you''re ready to start collaborating with our team.
        </p>
        <p style="font-size: 16px; margin-bottom: 24px;">Here''s what you can do next:</p>
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
  </div>',
  'Welcome to AgencyOS, {{first_name}}! We are excited to have {{company_name}} onboard.',
  '[{"key": "first_name", "description": "Recipient first name"}, {"key": "company_name", "description": "Client company name"}, {"key": "dashboard_url", "description": "Dashboard URL"}]'::jsonb,
  true,
  'client_created'
),
(
  'Milestone Complete',
  'milestone_complete',
  'Milestone Complete: {{milestone_name}} ✅',
  'Sent when a project milestone is marked as complete',
  '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #18181b; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0;">AgencyOS</h1>
      </div>
      <div style="padding: 32px;">
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">Milestone Complete! ✅</h2>
        <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">Hi {{first_name}},</p>
        <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">
          Great news! We''ve completed <strong>{{milestone_name}}</strong> for your <strong>{{service_name}}</strong> project.
        </p>
        <p style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">What''s Next:</p>
        <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">
          {{next_steps}}
        </p>
        <a href="{{dashboard_url}}" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">
          View Progress
        </a>
      </div>
    </div>
  </div>',
  'Hi {{first_name}}, Great news! We have completed {{milestone_name}} for your {{service_name}} project.',
  '[{"key": "first_name", "description": "Recipient first name"}, {"key": "milestone_name", "description": "Name of completed milestone"}, {"key": "service_name", "description": "Service/Project name"}, {"key": "next_steps", "description": "Description of next steps"}, {"key": "dashboard_url", "description": "Dashboard URL"}]'::jsonb,
  true,
  'milestone_completed'
),
(
  'Task Assigned',
  'task_assigned',
  'New Task: {{task_title}}',
  'Sent when a task is assigned to a team member',
  '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #18181b; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0;">AgencyOS</h1>
      </div>
      <div style="padding: 32px;">
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">New Task Assigned 📋</h2>
        <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">Hi {{assignee_name}},</p>
        <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">You''ve been assigned a new task:</p>
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
  </div>',
  'Hi {{assignee_name}}, You have been assigned a new task: {{task_title}}',
  '[{"key": "assignee_name", "description": "Task assignee name"}, {"key": "task_title", "description": "Task title"}, {"key": "task_description", "description": "Task description"}, {"key": "service_name", "description": "Service/Project name"}, {"key": "due_date", "description": "Task due date"}, {"key": "priority", "description": "Task priority (HIGH, MEDIUM, LOW)"}, {"key": "priority_color", "description": "Priority color code"}, {"key": "task_url", "description": "Direct URL to task"}]'::jsonb,
  false,
  'task_assigned'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  description = EXCLUDED.description,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  variables = EXCLUDED.variables,
  trigger_event = EXCLUDED.trigger_event,
  updated_at = NOW();