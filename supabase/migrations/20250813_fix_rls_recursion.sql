-- =====================================================
-- FIX RLS INFINITE RECURSION
-- =====================================================
-- Fix the infinite recursion in services RLS policies
-- =====================================================

-- Drop problematic policies
DROP POLICY IF EXISTS "Clients can view their services" ON services;
DROP POLICY IF EXISTS "Clients can view their own services" ON services;

-- Recreate client policy without service_members reference to avoid recursion
CREATE POLICY "Clients can view their own services" 
  ON services 
  FOR SELECT 
  TO authenticated
  USING (
    client_id = auth.uid()
  );

-- Fix milestones policy
DROP POLICY IF EXISTS "Clients can view milestones for their services" ON milestones;

CREATE POLICY "Clients can view milestones for their services" 
  ON milestones 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services 
      WHERE services.id = milestones.service_id 
      AND services.client_id = auth.uid()
    )
  );

-- Fix tasks policy
DROP POLICY IF EXISTS "Clients can view tasks for their services" ON tasks;

CREATE POLICY "Clients can view tasks for their services" 
  ON tasks 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM milestones 
      JOIN services ON services.id = milestones.service_id
      WHERE milestones.id = tasks.milestone_id 
      AND services.client_id = auth.uid()
    )
  );

-- Fix service_members policies to be simpler
DROP POLICY IF EXISTS "Users can view their service memberships" ON service_members;

CREATE POLICY "Users can view service memberships" 
  ON service_members 
  FOR SELECT 
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'team_member')
    )
  );

-- Fix task_comments policy  
DROP POLICY IF EXISTS "Clients can view comments on their service tasks" ON task_comments;

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
      AND services.client_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'team_member')
    )
  );

-- =====================================================
-- VERIFY POLICIES
-- =====================================================
-- List all policies to verify
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('services', 'milestones', 'tasks', 'service_members', 'task_comments')
ORDER BY tablename, policyname;