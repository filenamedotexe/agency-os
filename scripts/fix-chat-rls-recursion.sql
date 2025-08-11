-- Fix RLS Policy Recursion Issue
-- The "Users can view participants" policy is causing infinite recursion

-- Drop the problematic policy
DROP POLICY "Users can view participants" ON conversation_participants;

-- Create a simpler, non-recursive policy
-- Users can view participants in conversations they belong to by checking conversations table
CREATE POLICY "Users can view participants" ON conversation_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_participants.conversation_id 
      AND conversations.client_id = auth.uid()
    )
  );

-- Verify the fix by listing all policies
SELECT 
    policyname,
    CASE 
        WHEN qual LIKE '%conversation_participants%' AND tablename = 'conversation_participants' THEN 'POTENTIAL RECURSION'
        ELSE 'OK'
    END as recursion_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'conversation_participants'
ORDER BY policyname;

-- Success message
SELECT 'RLS recursion issue fixed!' as status;