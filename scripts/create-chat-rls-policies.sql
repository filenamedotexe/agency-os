-- Step 1.3: Create RLS Policies for Chat Tables
-- This secures the chat system so users can only access appropriate data

-- First, enable RLS on all three tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CONVERSATIONS TABLE POLICIES
-- ============================================

-- Policy: Users can view their own conversations (as client) or conversations they participate in
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    client_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Policy: System/service role can create conversations
CREATE POLICY "System can create conversations" ON conversations
  FOR INSERT WITH CHECK (true); -- Will use service role

-- Policy: System can update conversations (for last_message_at, unread_count, etc.)
CREATE POLICY "System can update conversations" ON conversations
  FOR UPDATE WITH CHECK (true); -- Will use service role

-- ============================================
-- MESSAGES TABLE POLICIES
-- ============================================

-- Policy: Participants can view messages in their conversations
CREATE POLICY "Participants can view messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Policy: Participants can send messages (user messages must match sender_id, system messages have NULL sender)
CREATE POLICY "Participants can send messages" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    ) AND (
      sender_id = auth.uid() OR 
      (type = 'system' AND sender_id IS NULL)
    )
  );

-- Policy: Users can update their own messages (for edit functionality)
CREATE POLICY "Users can edit own messages" ON messages
  FOR UPDATE USING (
    sender_id = auth.uid()
  ) WITH CHECK (
    sender_id = auth.uid()
  );

-- ============================================
-- CONVERSATION_PARTICIPANTS TABLE POLICIES
-- ============================================

-- Policy: Users can view participants in conversations they're part of
CREATE POLICY "Users can view participants" ON conversation_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id
      AND cp2.user_id = auth.uid()
    )
  );

-- Policy: System can manage participants (add/remove)
CREATE POLICY "System can manage participants" ON conversation_participants
  FOR ALL WITH CHECK (true); -- Will use service role

-- Policy: Users can update their own participant record (for last_read_at, notifications)
CREATE POLICY "Users can update own participation" ON conversation_participants
  FOR UPDATE USING (
    user_id = auth.uid()
  ) WITH CHECK (
    user_id = auth.uid()
  );

-- ============================================
-- Verify RLS is enabled
-- ============================================
SELECT 
    tablename,
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'messages', 'conversation_participants')
ORDER BY tablename;

-- Count policies created
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('conversations', 'messages', 'conversation_participants')
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Success message
SELECT 'RLS policies created successfully!' as status;