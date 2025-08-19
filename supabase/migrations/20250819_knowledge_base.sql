-- =====================================================
-- KNOWLEDGE BASE MIGRATION
-- =====================================================
-- Create knowledge collections and resources tables
-- Date: 2025-08-19
-- =====================================================

-- =====================================================
-- STEP 1: CREATE KNOWLEDGE COLLECTIONS TABLE
-- =====================================================

CREATE TABLE knowledge_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'folder',
  color VARCHAR(50) DEFAULT 'blue',
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'team', 'private')),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add constraints
ALTER TABLE knowledge_collections
ADD CONSTRAINT knowledge_collections_name_check 
CHECK (char_length(name) >= 1 AND char_length(name) <= 255);

ALTER TABLE knowledge_collections
ADD CONSTRAINT knowledge_collections_icon_check 
CHECK (icon IN ('folder', 'file', 'video', 'link'));

ALTER TABLE knowledge_collections
ADD CONSTRAINT knowledge_collections_color_check 
CHECK (color IN ('blue', 'green', 'purple', 'orange', 'red', 'yellow', 'pink', 'indigo', 'gray'));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_collections_created_by 
ON knowledge_collections(created_by);

CREATE INDEX IF NOT EXISTS idx_knowledge_collections_visibility 
ON knowledge_collections(visibility);

-- =====================================================
-- STEP 2: CREATE KNOWLEDGE RESOURCES TABLE
-- =====================================================

CREATE TABLE knowledge_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES knowledge_collections(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  url TEXT,
  file_url TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  file_type VARCHAR(100),
  resource_type VARCHAR(20) DEFAULT 'note' CHECK (resource_type IN ('link', 'file', 'note')),
  tags TEXT[],
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add constraints
ALTER TABLE knowledge_resources
ADD CONSTRAINT knowledge_resources_title_check 
CHECK (char_length(title) >= 1 AND char_length(title) <= 255);

ALTER TABLE knowledge_resources
ADD CONSTRAINT knowledge_resources_file_size_check 
CHECK (file_size IS NULL OR file_size > 0);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_resources_collection_id 
ON knowledge_resources(collection_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_resources_created_by 
ON knowledge_resources(created_by);

CREATE INDEX IF NOT EXISTS idx_knowledge_resources_resource_type 
ON knowledge_resources(resource_type);

-- =====================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE knowledge_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_resources ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: CREATE RLS POLICIES
-- =====================================================

-- Collections policies
CREATE POLICY "Users can view public and team collections" ON knowledge_collections
  FOR SELECT 
  TO authenticated
  USING (
    visibility = 'public' OR
    (visibility = 'team' AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'team_member')
    )) OR
    (visibility = 'private' AND created_by = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin and team can create collections" ON knowledge_collections
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'team_member')
    )
  );

CREATE POLICY "Creator and admin can update collections" ON knowledge_collections
  FOR UPDATE 
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Creator and admin can delete collections" ON knowledge_collections
  FOR DELETE 
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Resources policies (inherit from collections)
CREATE POLICY "Users can view resources in accessible collections" ON knowledge_resources
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_collections kc
      WHERE kc.id = knowledge_resources.collection_id
      AND (
        kc.visibility = 'public' OR
        (kc.visibility = 'team' AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('admin', 'team_member')
        )) OR
        (kc.visibility = 'private' AND kc.created_by = auth.uid()) OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Admin and team can create resources" ON knowledge_resources
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'team_member')
    )
  );

CREATE POLICY "Creator and admin can update resources" ON knowledge_resources
  FOR UPDATE 
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Creator and admin can delete resources" ON knowledge_resources
  FOR DELETE 
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- STEP 5: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_knowledge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_knowledge_collections_updated_at
  BEFORE UPDATE ON knowledge_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_updated_at();

CREATE TRIGGER update_knowledge_resources_updated_at
  BEFORE UPDATE ON knowledge_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_updated_at();

-- =====================================================
-- STEP 6: SEED INITIAL DATA
-- =====================================================

-- Get admin user for seeding
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM profiles WHERE email = 'admin@demo.com' LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    -- Create sample collections
    INSERT INTO knowledge_collections (name, description, icon, color, visibility, created_by) VALUES
    ('Getting Started', 'Essential resources for new clients and team members', 'folder', 'blue', 'public', admin_id),
    ('Project Templates', 'Reusable templates and best practices', 'file', 'green', 'team', admin_id),
    ('Client Resources', 'Resources shared with clients during projects', 'link', 'purple', 'public', admin_id);
    
    -- Get collection IDs for seeding resources
    INSERT INTO knowledge_resources (collection_id, title, description, content, resource_type, created_by)
    SELECT 
      kc.id,
      'Welcome Guide',
      'Getting started with AgencyOS',
      'This guide covers the basics of using the platform...',
      'note',
      admin_id
    FROM knowledge_collections kc 
    WHERE kc.name = 'Getting Started' AND kc.created_by = admin_id;
    
    INSERT INTO knowledge_resources (collection_id, title, description, url, resource_type, created_by)
    SELECT 
      kc.id,
      'Project Management Best Practices',
      'External resource on project management',
      'https://example.com/project-management',
      'link',
      admin_id
    FROM knowledge_collections kc 
    WHERE kc.name = 'Project Templates' AND kc.created_by = admin_id;
  END IF;
END $$;

-- =====================================================
-- STEP 7: GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON knowledge_collections TO authenticated;
GRANT ALL ON knowledge_resources TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================