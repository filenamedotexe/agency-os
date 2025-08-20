-- =====================================================
-- RICH TEXT EDITOR SUPPORT MIGRATION
-- =====================================================
-- Add rich text support to existing tables
-- Date: 2025-08-20
-- =====================================================

-- =====================================================
-- STEP 1: ADD RICH TEXT COLUMNS
-- =====================================================

-- Add rich text support to resources
ALTER TABLE resources 
ADD COLUMN rich_description JSONB,
ADD COLUMN rich_content JSONB;

-- Add rich text support to collections
ALTER TABLE collections 
ADD COLUMN rich_description JSONB;

-- Add rich text support to services
ALTER TABLE services 
ADD COLUMN rich_description JSONB;

-- Add rich text support to milestones
ALTER TABLE milestones 
ADD COLUMN rich_description JSONB;

-- Add rich text support to tasks
ALTER TABLE tasks 
ADD COLUMN rich_notes JSONB;

-- Add rich text support to messages (if we want rich messaging)
ALTER TABLE messages 
ADD COLUMN rich_content JSONB;

-- =====================================================
-- STEP 2: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to validate TipTap JSON structure
CREATE OR REPLACE FUNCTION validate_tiptap_json(content JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Basic validation - ensure it's an object with type and content
  IF content IS NULL THEN
    RETURN TRUE; -- NULL is allowed
  END IF;
  
  -- Must be an object
  IF jsonb_typeof(content) != 'object' THEN
    RETURN FALSE;
  END IF;
  
  -- Should have type field
  IF NOT (content ? 'type') THEN
    RETURN FALSE;
  END IF;
  
  -- Type should be 'doc' for TipTap documents
  IF content->>'type' != 'doc' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 3: ADD CONSTRAINTS
-- =====================================================

-- Add validation constraints for rich text fields
ALTER TABLE resources 
ADD CONSTRAINT resources_rich_description_check 
CHECK (validate_tiptap_json(rich_description));

ALTER TABLE resources 
ADD CONSTRAINT resources_rich_content_check 
CHECK (validate_tiptap_json(rich_content));

ALTER TABLE collections 
ADD CONSTRAINT collections_rich_description_check 
CHECK (validate_tiptap_json(rich_description));

ALTER TABLE services 
ADD CONSTRAINT services_rich_description_check 
CHECK (validate_tiptap_json(rich_description));

ALTER TABLE milestones 
ADD CONSTRAINT milestones_rich_description_check 
CHECK (validate_tiptap_json(rich_description));

ALTER TABLE tasks 
ADD CONSTRAINT tasks_rich_notes_check 
CHECK (validate_tiptap_json(rich_notes));

ALTER TABLE messages 
ADD CONSTRAINT messages_rich_content_check 
CHECK (validate_tiptap_json(rich_content));

-- =====================================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create GIN indexes for rich text content searching
CREATE INDEX IF NOT EXISTS idx_resources_rich_content_gin 
ON resources USING GIN (rich_content);

CREATE INDEX IF NOT EXISTS idx_resources_rich_description_gin 
ON resources USING GIN (rich_description);

CREATE INDEX IF NOT EXISTS idx_services_rich_description_gin 
ON services USING GIN (rich_description);

CREATE INDEX IF NOT EXISTS idx_messages_rich_content_gin 
ON messages USING GIN (rich_content);

-- =====================================================
-- STEP 5: CREATE MIGRATION HELPER FUNCTIONS
-- =====================================================

-- Function to convert plain text to TipTap JSON format
CREATE OR REPLACE FUNCTION text_to_tiptap_json(plain_text TEXT)
RETURNS JSONB AS $$
BEGIN
  IF plain_text IS NULL OR plain_text = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN jsonb_build_object(
    'type', 'doc',
    'content', jsonb_build_array(
      jsonb_build_object(
        'type', 'paragraph',
        'content', jsonb_build_array(
          jsonb_build_object(
            'type', 'text',
            'text', plain_text
          )
        )
      )
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to extract plain text from TipTap JSON
CREATE OR REPLACE FUNCTION tiptap_json_to_text(tiptap_json JSONB)
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
  content_item JSONB;
  text_node JSONB;
BEGIN
  IF tiptap_json IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Simple extraction for paragraph content
  FOR content_item IN SELECT jsonb_array_elements(tiptap_json->'content')
  LOOP
    IF content_item->>'type' = 'paragraph' AND content_item ? 'content' THEN
      FOR text_node IN SELECT jsonb_array_elements(content_item->'content')
      LOOP
        IF text_node->>'type' = 'text' THEN
          result := result || (text_node->>'text') || ' ';
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  
  RETURN trim(result);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 6: OPTIONAL DATA MIGRATION
-- =====================================================

-- Migrate existing text content to rich text format
-- This is commented out to avoid automatic migration
-- Uncomment and run manually if needed

/*
-- Migrate knowledge resources descriptions
UPDATE knowledge_resources 
SET rich_description = text_to_tiptap_json(description)
WHERE description IS NOT NULL AND description != '' AND rich_description IS NULL;

-- Migrate knowledge resources content
UPDATE knowledge_resources 
SET rich_content = text_to_tiptap_json(content)
WHERE content IS NOT NULL AND content != '' AND rich_content IS NULL;

-- Migrate knowledge collections descriptions
UPDATE knowledge_collections 
SET rich_description = text_to_tiptap_json(description)
WHERE description IS NOT NULL AND description != '' AND rich_description IS NULL;

-- Migrate services descriptions
UPDATE services 
SET rich_description = text_to_tiptap_json(description)
WHERE description IS NOT NULL AND description != '' AND rich_description IS NULL;
*/

-- =====================================================
-- STEP 7: GRANT PERMISSIONS
-- =====================================================

-- Permissions are inherited from table-level RLS policies
-- No additional grants needed

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- The migration adds:
-- 1. Rich text JSONB columns to major content tables
-- 2. Validation functions for TipTap JSON structure
-- 3. Helper functions for text conversion
-- 4. Performance indexes for content searching
-- 5. Proper constraints and validation

COMMENT ON COLUMN resources.rich_description IS 'Rich text description in TipTap JSON format';
COMMENT ON COLUMN resources.rich_content IS 'Rich text content in TipTap JSON format';
COMMENT ON COLUMN collections.rich_description IS 'Rich text description in TipTap JSON format';
COMMENT ON COLUMN services.rich_description IS 'Rich text description in TipTap JSON format';
COMMENT ON COLUMN milestones.rich_description IS 'Rich text description in TipTap JSON format';
COMMENT ON COLUMN tasks.rich_notes IS 'Rich text notes in TipTap JSON format';
COMMENT ON COLUMN messages.rich_content IS 'Rich text message content in TipTap JSON format';