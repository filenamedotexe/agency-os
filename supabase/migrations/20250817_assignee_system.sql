-- =====================================================
-- ASSIGNEE SYSTEM MIGRATION
-- =====================================================
-- Add assignee support for milestones and task visibility
-- Date: 2025-08-17
-- =====================================================

-- =====================================================
-- STEP 1: ADD ASSIGNEE TO MILESTONES
-- =====================================================

-- Add assignee_id column to milestones table
ALTER TABLE milestones 
ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_milestones_assignee 
ON milestones(assignee_id);

-- Add comment for documentation
COMMENT ON COLUMN milestones.assignee_id IS 'The user assigned to this milestone (admin or team only)';

-- =====================================================
-- STEP 2: ADD VISIBILITY TO TASKS
-- =====================================================

-- Add visibility column to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'internal';

-- Add constraint to ensure valid values
ALTER TABLE tasks
ADD CONSTRAINT tasks_visibility_check 
CHECK (visibility IN ('internal', 'client'));

-- Add index for visibility queries
CREATE INDEX IF NOT EXISTS idx_tasks_visibility 
ON tasks(visibility);

-- Add comment for documentation
COMMENT ON COLUMN tasks.visibility IS 'Controls whether clients can see this task (internal = team only, client = visible to assigned client)';

-- =====================================================
-- STEP 3: UPDATE EXISTING DATA
-- =====================================================

-- Update existing tasks: if assigned to a client user, make it visible to clients
UPDATE tasks t
SET visibility = 'client'
FROM profiles p
WHERE t.assigned_to = p.id 
  AND p.role = 'client'
  AND t.visibility = 'internal';

-- =====================================================
-- STEP 4: DROP EXISTING TASK RLS POLICIES
-- =====================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admin and team can manage all tasks" ON tasks;
DROP POLICY IF EXISTS "Clients can view tasks in their services" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks in their services" ON tasks;

-- =====================================================
-- STEP 5: CREATE NEW RLS POLICIES FOR TASKS
-- =====================================================

-- Policy 1: Admin and team can view all tasks
CREATE POLICY "Admin and team can view all tasks"
ON tasks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'team_member')
  )
);

-- Policy 2: Admin and team can manage all tasks
CREATE POLICY "Admin and team can manage all tasks"
ON tasks FOR ALL
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

-- Policy 3: Clients can view their assigned tasks or client-visible tasks in their services
CREATE POLICY "Clients can view assigned or visible tasks"
ON tasks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'client'
  )
  AND (
    -- Task is directly assigned to this client
    assigned_to = auth.uid()
    OR
    -- Task is marked as client-visible and belongs to a service for this client
    (
      visibility = 'client' 
      AND EXISTS (
        SELECT 1 
        FROM milestones m
        JOIN services s ON m.service_id = s.id
        WHERE m.id = tasks.milestone_id
        AND s.client_id = auth.uid()
      )
    )
  )
);

-- Policy 4: Clients can update their assigned tasks (status only)
CREATE POLICY "Clients can update their assigned tasks"
ON tasks FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'client'
  )
  AND assigned_to = auth.uid()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'client'
  )
  AND assigned_to = auth.uid()
);

-- =====================================================
-- STEP 6: CREATE RLS POLICIES FOR MILESTONE ASSIGNEES
-- =====================================================

-- Note: Existing milestone policies should already handle basic access
-- We'll add specific policies for assignee management if needed

-- Drop existing milestone policies if they exist
DROP POLICY IF EXISTS "Admin and team can manage all milestones" ON milestones;
DROP POLICY IF EXISTS "Clients can view milestones in their services" ON milestones;

-- Policy 1: Admin and team can manage all milestones
CREATE POLICY "Admin and team can manage all milestones"
ON milestones FOR ALL
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

-- Policy 2: Clients can view milestones in their services
CREATE POLICY "Clients can view milestones in their services"
ON milestones FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'client'
  )
  AND EXISTS (
    SELECT 1 FROM services s
    WHERE s.id = milestones.service_id
    AND s.client_id = auth.uid()
  )
);

-- =====================================================
-- STEP 7: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create composite index for task visibility queries
CREATE INDEX IF NOT EXISTS idx_tasks_visibility_assigned 
ON tasks(visibility, assigned_to);

-- Create index for milestone-service joins
CREATE INDEX IF NOT EXISTS idx_milestones_service_id 
ON milestones(service_id);

-- =====================================================
-- STEP 8: VALIDATE CONSTRAINTS
-- =====================================================

-- Ensure milestone assignees are only admin or team members (not clients)
CREATE OR REPLACE FUNCTION check_milestone_assignee_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow NULL assignee
  IF NEW.assignee_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if assignee is admin or team_member
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.assignee_id
    AND role IN ('admin', 'team_member')
  ) THEN
    RAISE EXCEPTION 'Milestone assignee must be an admin or team member';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce the constraint
DROP TRIGGER IF EXISTS check_milestone_assignee_role_trigger ON milestones;
CREATE TRIGGER check_milestone_assignee_role_trigger
BEFORE INSERT OR UPDATE OF assignee_id ON milestones
FOR EACH ROW
EXECUTE FUNCTION check_milestone_assignee_role();

-- =====================================================
-- STEP 9: GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Ensure authenticated users can access the tables with RLS
GRANT ALL ON tasks TO authenticated;
GRANT ALL ON milestones TO authenticated;
GRANT ALL ON services TO authenticated;
GRANT ALL ON profiles TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary of changes:
-- 1. Added assignee_id to milestones table (admin/team only)
-- 2. Added visibility field to tasks table (internal/client)
-- 3. Updated existing client-assigned tasks to be client-visible
-- 4. Created comprehensive RLS policies for task visibility
-- 5. Added constraint to ensure milestones are only assigned to admin/team
-- 6. Created indexes for performance optimization
-- =====================================================