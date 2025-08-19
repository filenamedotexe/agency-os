-- =====================================================
-- SERVICE TEMPLATES MIGRATION
-- =====================================================
-- Add service template system for reusable project structures
-- Date: 2025-08-19
-- =====================================================

-- =====================================================
-- STEP 1: CREATE SERVICE TEMPLATES TABLE
-- =====================================================

-- Create service_templates table
CREATE TABLE service_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(50) DEFAULT 'blue',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add constraints
ALTER TABLE service_templates
ADD CONSTRAINT service_templates_name_check 
CHECK (char_length(name) >= 1 AND char_length(name) <= 255);

ALTER TABLE service_templates
ADD CONSTRAINT service_templates_color_check 
CHECK (color IN ('blue', 'green', 'purple', 'orange', 'pink', 'red', 'yellow', 'indigo', 'gray'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_templates_created_by 
ON service_templates(created_by);

CREATE INDEX IF NOT EXISTS idx_service_templates_is_default 
ON service_templates(is_default);

CREATE INDEX IF NOT EXISTS idx_service_templates_name 
ON service_templates(name);

-- Add comments for documentation
COMMENT ON TABLE service_templates IS 'Reusable service project templates';
COMMENT ON COLUMN service_templates.name IS 'Template name (1-255 characters)';
COMMENT ON COLUMN service_templates.description IS 'Optional template description';
COMMENT ON COLUMN service_templates.color IS 'Template color theme';
COMMENT ON COLUMN service_templates.created_by IS 'User who created this template';
COMMENT ON COLUMN service_templates.is_default IS 'Whether this is a system default template';

-- =====================================================
-- STEP 2: CREATE TEMPLATE MILESTONES TABLE
-- =====================================================

-- Create template_milestones table
CREATE TABLE template_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES service_templates(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  relative_start_days INTEGER DEFAULT 0,
  relative_due_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add constraints
ALTER TABLE template_milestones
ADD CONSTRAINT template_milestones_name_check 
CHECK (char_length(name) >= 1 AND char_length(name) <= 255);

ALTER TABLE template_milestones
ADD CONSTRAINT template_milestones_position_check 
CHECK (position >= 0);

ALTER TABLE template_milestones
ADD CONSTRAINT template_milestones_relative_start_check 
CHECK (relative_start_days >= 0);

ALTER TABLE template_milestones
ADD CONSTRAINT template_milestones_relative_due_check 
CHECK (relative_due_days IS NULL OR relative_due_days >= relative_start_days);

-- Ensure unique position per template
ALTER TABLE template_milestones
ADD CONSTRAINT template_milestones_unique_position 
UNIQUE (template_id, position);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_milestones_template_id 
ON template_milestones(template_id);

CREATE INDEX IF NOT EXISTS idx_template_milestones_position 
ON template_milestones(template_id, position);

-- Add comments for documentation
COMMENT ON TABLE template_milestones IS 'Milestone templates for service templates';
COMMENT ON COLUMN template_milestones.name IS 'Milestone name (1-255 characters)';
COMMENT ON COLUMN template_milestones.position IS 'Order position within template (0-based)';
COMMENT ON COLUMN template_milestones.relative_start_days IS 'Days from service start date (default 0)';
COMMENT ON COLUMN template_milestones.relative_due_days IS 'Days from service start date for due date';

-- =====================================================
-- STEP 3: CREATE TEMPLATE TASKS TABLE
-- =====================================================

-- Create template_tasks table
CREATE TABLE template_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_milestone_id UUID NOT NULL REFERENCES template_milestones(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  estimated_hours INTEGER,
  position INTEGER NOT NULL,
  relative_due_days INTEGER,
  visibility VARCHAR(20) DEFAULT 'internal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add constraints
ALTER TABLE template_tasks
ADD CONSTRAINT template_tasks_title_check 
CHECK (char_length(title) >= 1 AND char_length(title) <= 255);

ALTER TABLE template_tasks
ADD CONSTRAINT template_tasks_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE template_tasks
ADD CONSTRAINT template_tasks_position_check 
CHECK (position >= 0);

ALTER TABLE template_tasks
ADD CONSTRAINT template_tasks_estimated_hours_check 
CHECK (estimated_hours IS NULL OR estimated_hours > 0);

ALTER TABLE template_tasks
ADD CONSTRAINT template_tasks_relative_due_check 
CHECK (relative_due_days IS NULL OR relative_due_days >= 0);

ALTER TABLE template_tasks
ADD CONSTRAINT template_tasks_visibility_check 
CHECK (visibility IN ('internal', 'client'));

-- Ensure unique position per milestone
ALTER TABLE template_tasks
ADD CONSTRAINT template_tasks_unique_position 
UNIQUE (template_milestone_id, position);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_tasks_milestone_id 
ON template_tasks(template_milestone_id);

CREATE INDEX IF NOT EXISTS idx_template_tasks_position 
ON template_tasks(template_milestone_id, position);

CREATE INDEX IF NOT EXISTS idx_template_tasks_priority 
ON template_tasks(priority);

-- Add comments for documentation
COMMENT ON TABLE template_tasks IS 'Task templates for milestone templates';
COMMENT ON COLUMN template_tasks.title IS 'Task title (1-255 characters)';
COMMENT ON COLUMN template_tasks.priority IS 'Task priority level';
COMMENT ON COLUMN template_tasks.estimated_hours IS 'Estimated hours to complete (positive integer)';
COMMENT ON COLUMN template_tasks.position IS 'Order position within milestone (0-based)';
COMMENT ON COLUMN template_tasks.relative_due_days IS 'Days from milestone start date for due date';
COMMENT ON COLUMN template_tasks.visibility IS 'Whether clients can see this task';

-- =====================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on service_templates table
ALTER TABLE service_templates ENABLE ROW LEVEL SECURITY;

-- Note: template_milestones and template_tasks don't need RLS 
-- as they are accessed through service_templates

-- =====================================================
-- STEP 5: CREATE RLS POLICIES FOR SERVICE_TEMPLATES
-- =====================================================

-- Policy 1: Admin and team can view all templates
CREATE POLICY "Admin and team can view all templates" ON service_templates
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'team_member')
    )
  );

-- Policy 2: Admin and team can create templates
CREATE POLICY "Admin and team can create templates" ON service_templates
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'team_member')
    )
    AND created_by = auth.uid()
  );

-- Policy 3: Creator or admin can update templates
CREATE POLICY "Creator and admin can update templates" ON service_templates
  FOR UPDATE 
  TO authenticated
  USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy 4: Only admin can delete templates
CREATE POLICY "Admin can delete templates" ON service_templates
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy 5: Clients have no access to templates
-- (Implicit - no policy means no access for clients)

-- =====================================================
-- STEP 6: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to update template updated_at timestamp
CREATE OR REPLACE FUNCTION update_service_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_service_template_updated_at_trigger ON service_templates;
CREATE TRIGGER update_service_template_updated_at_trigger
  BEFORE UPDATE ON service_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_service_template_updated_at();

-- Function to validate template structure
CREATE OR REPLACE FUNCTION validate_template_structure()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure template has at least one milestone when creating tasks
  IF TG_TABLE_NAME = 'template_tasks' THEN
    IF NOT EXISTS (
      SELECT 1 FROM template_milestones 
      WHERE id = NEW.template_milestone_id
    ) THEN
      RAISE EXCEPTION 'Template milestone does not exist';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for template structure validation
DROP TRIGGER IF EXISTS validate_template_tasks_trigger ON template_tasks;
CREATE TRIGGER validate_template_tasks_trigger
  BEFORE INSERT OR UPDATE ON template_tasks
  FOR EACH ROW
  EXECUTE FUNCTION validate_template_structure();

-- =====================================================
-- STEP 7: GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant access to authenticated users
GRANT ALL ON service_templates TO authenticated;
GRANT ALL ON template_milestones TO authenticated;
GRANT ALL ON template_tasks TO authenticated;

-- Grant sequence access for auto-incrementing fields
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- STEP 8: CREATE HELPER VIEW FOR TEMPLATE QUERIES
-- =====================================================

-- Create view for template with milestone/task counts
CREATE OR REPLACE VIEW template_summary AS
SELECT 
  t.id,
  t.name,
  t.description,
  t.color,
  t.created_by,
  t.is_default,
  t.created_at,
  t.updated_at,
  p.full_name as created_by_name,
  COUNT(DISTINCT tm.id) as milestone_count,
  COUNT(tt.id) as task_count
FROM service_templates t
LEFT JOIN profiles p ON t.created_by = p.id
LEFT JOIN template_milestones tm ON t.id = tm.template_id
LEFT JOIN template_tasks tt ON tm.id = tt.template_milestone_id
GROUP BY t.id, t.name, t.description, t.color, t.created_by, t.is_default, 
         t.created_at, t.updated_at, p.full_name;

-- Grant access to the view
GRANT SELECT ON template_summary TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary of changes:
-- 1. Created service_templates table with RLS policies
-- 2. Created template_milestones table with constraints
-- 3. Created template_tasks table with constraints
-- 4. Added proper indexes for performance
-- 5. Created helper functions and triggers
-- 6. Created template_summary view for queries
-- 7. Granted necessary permissions to authenticated users
-- =====================================================