-- Optimize database performance with strategic indexes
-- Run this in Supabase SQL Editor

-- Services indexes
CREATE INDEX IF NOT EXISTS idx_services_client_id ON services(client_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_services_status_client ON services(status, client_id);

-- Milestones indexes
CREATE INDEX IF NOT EXISTS idx_milestones_service_id ON milestones(service_id);
CREATE INDEX IF NOT EXISTS idx_milestones_due_date ON milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_service_due ON milestones(service_id, due_date);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_milestone_id ON tasks(milestone_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(position);
-- Composite index for Kanban board queries
CREATE INDEX IF NOT EXISTS idx_tasks_milestone_status_position ON tasks(milestone_id, status, position);
-- Composite index for overdue tasks
CREATE INDEX IF NOT EXISTS idx_tasks_status_due ON tasks(status, due_date) WHERE status != 'done';

-- Service members indexes
CREATE INDEX IF NOT EXISTS idx_service_members_service_id ON service_members(service_id);
CREATE INDEX IF NOT EXISTS idx_service_members_user_id ON service_members(user_id);
CREATE INDEX IF NOT EXISTS idx_service_members_composite ON service_members(service_id, user_id);

-- Task comments indexes
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at DESC);

-- Messages and conversations indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);

-- Profiles indexes (if not already present)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Analyze tables to update statistics
ANALYZE services;
ANALYZE milestones;
ANALYZE tasks;
ANALYZE service_members;
ANALYZE task_comments;
ANALYZE messages;
ANALYZE conversations;
ANALYZE conversation_participants;
ANALYZE profiles;

-- Query to check index usage (run this separately to monitor)
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
*/