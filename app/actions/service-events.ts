"use server"

import { sendSystemMessage } from './chat'
import { createClient } from '@/shared/lib/supabase/server'

export async function logServiceEvent({
  clientId,
  eventType,
  content,
  metadata = {}
}: {
  clientId: string
  eventType: 'milestone_complete' | 'task_assigned' | 'status_changed' | 'invoice_created'
  content: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  
  // Get conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('client_id', clientId)
    .single()
  
  if (!conversation) return
  
  // Add appropriate emoji based on event type
  const emojis = {
    milestone_complete: '✅',
    task_assigned: '📋',
    status_changed: '🔄',
    invoice_created: '💰'
  }
  
  await sendSystemMessage({
    conversationId: conversation.id,
    content: `${emojis[eventType]} ${content}`,
    metadata: {
      type: eventType,
      ...metadata
    }
  })
}