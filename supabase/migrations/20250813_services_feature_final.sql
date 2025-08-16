-- =====================================================
-- SERVICES FEATURE - FINAL MIGRATION
-- =====================================================
-- Clean up and complete the services feature tables
-- =====================================================

-- =====================================================
-- STEP 1: UPDATE SERVICES TABLE
-- =====================================================

-- Add color column if not exists
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS color text DEFAULT 'blue';

-- Add constraint for color values
ALTER TABLE services 
ADD CONSTRAINT services_color_check 
CHECK (color IN ('blue', 'green', 'purple', 'orange', 'red', 'yellow', 'pink', 'gray'));

-- Set client_id as NOT NULL (data already cleaned)
ALTER TABLE services 
ALTER COLUMN client_id SET NOT NULL;

-- Update any 'in_progress' status to 'active' to match our spec
UPDATE services SET status = 'active' WHERE status = 'in_progress';

-- Add status constraint
ALTER TABLE services 
ADD CONSTRAINT services_status_check 
CHECK (status IN ('planning', 'active', 'paused', 'completed', 'cancelled'));

-- =====================================================
-- STEP 2: UPDATE MILESTONES TABLE
-- =====================================================

-- Rename columns
ALTER TABLE milestones 
RENAME COLUMN title TO name;

ALTER TABLE milestones
RENAME COLUMN order_index TO position;

-- Add missing columns
ALTER TABLE milestones
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;

ALTER TABLE milestones
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Update status values to match spec
UPDATE milestones SET status = 'upcoming' WHERE status = 'pending';

-- Add status constraint
ALTER TABLE milestones
ADD CONSTRAINT milestones_status_check 
CHECK (status IN ('upcoming', 'in_progress', 'completed', 'delayed'));

-- Set service_id as NOT NULL
ALTER TABLE milestones
ALTER COLUMN service_id SET NOT NULL;

-- Set default for position
ALTER TABLE milestones
ALTER COLUMN position SET DEFAULT 0;

-- =====================================================
-- STEP 3: UPDATE TASKS TABLE
-- =====================================================

-- Rename column
ALTER TABLE tasks
RENAME COLUMN assignee_id TO assigned_to;

-- Add missing columns
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0;

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Add constraints
ALTER TABLE tasks
ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'blocked'));

ALTER TABLE tasks
ADD CONSTRAINT tasks_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Convert due_date to timestamp with time zone
ALTER TABLE tasks 
ALTER COLUMN due_date TYPE timestamp with time zone 
USING due_date::timestamp with time zone;

-- Set milestone_id as NOT NULL
ALTER TABLE tasks
ALTER COLUMN milestone_id SET NOT NULL;

-- =====================================================
-- STEP 4: CREATE TASK_COMMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE task_comments IS 'Comments on tasks for collaboration';

-- =====================================================
-- STEP 5: CREATE MISSING INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_milestones_position 
ON milestones(service_id, position);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to 
ON tasks(assigned_to);

CREATE INDEX IF NOT EXISTS idx_tasks_position 
ON tasks(milestone_id, status, position);

CREATE INDEX IF NOT EXISTS idx_tasks_created_by 
ON tasks(created_by);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id 
ON task_comments(task_id);

CREATE INDEX IF NOT EXISTS idx_task_comments_user_id 
ON task_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_task_comments_created_at 
ON task_comments(created_at DESC);

-- =====================================================
-- STEP 6: ENABLE RLS ON TASK_COMMENTS
-- =====================================================

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 7: CREATE RLS POLICIES FOR TASK_COMMENTS
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin and team can manage all comments" ON task_comments;
DROP POLICY IF EXISTS "Users can edit their own comments" ON task_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON task_comments;
DROP POLICY IF EXISTS "Clients can view comments on their service tasks" ON task_comments;

-- Admin and team can manage all comments
CREATE POLICY "Admin and team can manage all comments" 
  ON task_comments 
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'team_member')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'team_member')
    )
  );

-- Users can edit their own comments
CREATE POLICY "Users can edit their own comments" 
  ON task_comments 
  FOR UPDATE 
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" 
  ON task_comments 
  FOR DELETE 
  TO authenticated
  USING (user_id = auth.uid());

-- Clients can view comments on their service tasks
CREATE POLICY "Clients can view comments on their service tasks" 
  ON task_comments 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks 
      JOIN milestones ON milestones.id = tasks.milestone_id
      JOIN services ON services.id = milestones.service_id
      WHERE tasks.id = task_comments.task_id 
      AND (
        services.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM service_members 
          WHERE service_members.service_id = services.id 
          AND service_members.user_id = auth.uid()
        )
      )
    )
  );

-- =====================================================
-- STEP 8: CREATE/UPDATE TRIGGERS
-- =====================================================

-- Check if trigger exists before creating
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_task_comments_updated_at'
  ) THEN
    CREATE TRIGGER update_task_comments_updated_at 
    BEFORE UPDATE ON task_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Check if trigger exists for milestones
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_milestones_updated_at'
  ) THEN
    CREATE TRIGGER update_milestones_updated_at 
    BEFORE UPDATE ON milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- STEP 9: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to calculate service progress
CREATE OR REPLACE FUNCTION calculate_service_progress(service_uuid uuid)
RETURNS integer AS $$
DECLARE
  total_milestones integer;
  completed_milestones integer;
  progress integer;
BEGIN
  SELECT COUNT(*) INTO total_milestones
  FROM milestones
  WHERE service_id = service_uuid;
  
  SELECT COUNT(*) INTO completed_milestones
  FROM milestones
  WHERE service_id = service_uuid
  AND status = 'completed';
  
  IF total_milestones = 0 THEN
    progress := 0;
  ELSE
    progress := ROUND((completed_milestones::numeric / total_milestones::numeric) * 100);
  END IF;
  
  RETURN progress;
END;
$$ language 'plpgsql';

-- Function to calculate milestone progress
CREATE OR REPLACE FUNCTION calculate_milestone_progress(milestone_uuid uuid)
RETURNS integer AS $$
DECLARE
  total_tasks integer;
  completed_tasks integer;
  progress integer;
BEGIN
  SELECT COUNT(*) INTO total_tasks
  FROM tasks
  WHERE milestone_id = milestone_uuid;
  
  SELECT COUNT(*) INTO completed_tasks
  FROM tasks
  WHERE milestone_id = milestone_uuid
  AND status = 'done';
  
  IF total_tasks = 0 THEN
    progress := 0;
  ELSE
    progress := ROUND((completed_tasks::numeric / total_tasks::numeric) * 100);
  END IF;
  
  RETURN progress;
END;
$$ language 'plpgsql';

-- =====================================================
-- STEP 10: CREATE VIEWS
-- =====================================================

-- Drop and recreate views
DROP VIEW IF EXISTS services_with_progress CASCADE;
DROP VIEW IF EXISTS milestones_with_progress CASCADE;

-- View for services with calculated progress
CREATE VIEW services_with_progress AS
SELECT 
  s.*,
  calculate_service_progress(s.id) as progress,
  COUNT(DISTINCT m.id) as total_milestones,
  COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) as completed_milestones,
  COUNT(DISTINCT sm.user_id) as team_member_count
FROM services s
LEFT JOIN milestones m ON m.service_id = s.id
LEFT JOIN service_members sm ON sm.service_id = s.id
GROUP BY s.id;

-- View for milestones with calculated progress  
CREATE VIEW milestones_with_progress AS
SELECT 
  m.*,
  calculate_milestone_progress(m.id) as progress,
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks
FROM milestones m
LEFT JOIN tasks t ON t.milestone_id = m.id
GROUP BY m.id;

-- =====================================================
-- MIGRATION COMPLETE - VERIFY STRUCTURE
-- =====================================================
-- All tables are now ready for the services feature