-- =====================================================
-- SERVICES FEATURE DATABASE MIGRATION
-- =====================================================
-- This migration creates the complete database schema for the services
-- project management system with 3-layer hierarchy:
-- Services (Projects) → Milestones (Phases) → Tasks (Actions)
-- =====================================================

-- =====================================================
-- STEP 1: CREATE TABLES
-- =====================================================

-- 1.1 Services table (main projects/services)
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'paused', 'completed', 'cancelled')),
  start_date date,
  end_date date,
  budget decimal(10,2),
  color text DEFAULT 'blue' CHECK (color IN ('blue', 'green', 'purple', 'orange', 'red', 'yellow', 'pink', 'gray')),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE services IS 'Main services/projects table for agency work';
COMMENT ON COLUMN services.status IS 'Service status: planning, active, paused, completed, cancelled';
COMMENT ON COLUMN services.color IS 'Visual color identifier for UI display';

-- 1.2 Milestones table (phases within a service)
CREATE TABLE IF NOT EXISTS milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'delayed')),
  position integer NOT NULL DEFAULT 0,
  due_date date,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE milestones IS 'Milestones/phases within a service';
COMMENT ON COLUMN milestones.position IS 'Sort order within the service';
COMMENT ON COLUMN milestones.status IS 'Milestone status: upcoming, in_progress, completed, delayed';

-- 1.3 Tasks table (individual tasks within milestones)
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id uuid NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'blocked')),
  position integer NOT NULL DEFAULT 0,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE tasks IS 'Individual tasks within milestones';
COMMENT ON COLUMN tasks.position IS 'Sort order within kanban column';
COMMENT ON COLUMN tasks.status IS 'Task status for kanban: todo, in_progress, review, done, blocked';
COMMENT ON COLUMN tasks.priority IS 'Task priority: low, medium, high, urgent';

-- 1.4 Service members table (team members assigned to services)
CREATE TABLE IF NOT EXISTS service_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('lead', 'member', 'viewer')),
  added_at timestamp with time zone DEFAULT now(),
  UNIQUE(service_id, user_id)
);

-- Add comment for documentation
COMMENT ON TABLE service_members IS 'Team members assigned to services';
COMMENT ON COLUMN service_members.role IS 'Member role: lead, member, viewer';

-- 1.5 Task comments table (comments on tasks)
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE task_comments IS 'Comments on tasks for collaboration';

-- =====================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Services indexes
CREATE INDEX idx_services_client_id ON services(client_id);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_created_at ON services(created_at DESC);

-- Milestones indexes
CREATE INDEX idx_milestones_service_id ON milestones(service_id);
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_milestones_position ON milestones(service_id, position);

-- Tasks indexes
CREATE INDEX idx_tasks_milestone_id ON tasks(milestone_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_position ON tasks(milestone_id, status, position);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);

-- Service members indexes
CREATE INDEX idx_service_members_service_id ON service_members(service_id);
CREATE INDEX idx_service_members_user_id ON service_members(user_id);

-- Task comments indexes
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX idx_task_comments_created_at ON task_comments(created_at DESC);

-- =====================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: CREATE RLS POLICIES
-- =====================================================

-- 4.1 Services table policies
-- Admin and team can do everything with all services
CREATE POLICY "Admin and team can manage all services" 
  ON services 
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

-- Clients can only view their own services
CREATE POLICY "Clients can view their own services" 
  ON services 
  FOR SELECT 
  TO authenticated
  USING (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_members.service_id = services.id 
      AND service_members.user_id = auth.uid()
    )
  );

-- 4.2 Milestones table policies
-- Admin and team can manage all milestones
CREATE POLICY "Admin and team can manage all milestones" 
  ON milestones 
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

-- Clients can view milestones for their services
CREATE POLICY "Clients can view milestones for their services" 
  ON milestones 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services 
      WHERE services.id = milestones.service_id 
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

-- 4.3 Tasks table policies
-- Admin and team can manage all tasks
CREATE POLICY "Admin and team can manage all tasks" 
  ON tasks 
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

-- Clients can view tasks for their services
CREATE POLICY "Clients can view tasks for their services" 
  ON tasks 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM milestones 
      JOIN services ON services.id = milestones.service_id
      WHERE milestones.id = tasks.milestone_id 
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

-- 4.4 Service members table policies
-- Admin and team can manage service members
CREATE POLICY "Admin and team can manage service members" 
  ON service_members 
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

-- Service members can view their own memberships
CREATE POLICY "Users can view their service memberships" 
  ON service_members 
  FOR SELECT 
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM services 
      WHERE services.id = service_members.service_id 
      AND services.client_id = auth.uid()
    )
  );

-- 4.5 Task comments table policies
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
-- STEP 5: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
-- STEP 6: CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for services with calculated progress
CREATE OR REPLACE VIEW services_with_progress AS
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
CREATE OR REPLACE VIEW milestones_with_progress AS
SELECT 
  m.*,
  calculate_milestone_progress(m.id) as progress,
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks
FROM milestones m
LEFT JOIN tasks t ON t.milestone_id = m.id
GROUP BY m.id;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- To rollback this migration, run:
-- DROP TABLE IF EXISTS task_comments CASCADE;
-- DROP TABLE IF EXISTS service_members CASCADE;
-- DROP TABLE IF EXISTS tasks CASCADE;
-- DROP TABLE IF EXISTS milestones CASCADE;
-- DROP TABLE IF EXISTS services CASCADE;
-- DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
-- DROP FUNCTION IF EXISTS calculate_service_progress CASCADE;
-- DROP FUNCTION IF EXISTS calculate_milestone_progress CASCADE;
-- DROP VIEW IF EXISTS services_with_progress CASCADE;
-- DROP VIEW IF EXISTS milestones_with_progress CASCADE;