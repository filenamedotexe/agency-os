-- Create email_logs table for tracking all sent emails
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES profiles(id),
  recipient_email TEXT NOT NULL,
  type TEXT NOT NULL, -- 'welcome', 'milestone_complete', 'task_assigned', etc.
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'sent', -- 'sent', 'failed'
  error TEXT, -- Store error message if failed
  metadata JSONB, -- Store template variables, resend_id, etc
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can view all email logs
CREATE POLICY "Admins can view email logs" ON email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policy: Users can view emails sent to them
CREATE POLICY "Users can view own emails" ON email_logs
  FOR SELECT
  USING (recipient_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient_id);
CREATE INDEX idx_email_logs_type ON email_logs(type);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX idx_email_logs_status ON email_logs(status);