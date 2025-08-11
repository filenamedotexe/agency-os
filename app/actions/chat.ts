"use server"

import { createClient } from '@/shared/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

// Initialize or get conversation for a client
export async function getOrCreateConversation(clientId: string) {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  
  // Check if conversation exists
  const { data: existing, error: existingError } = await supabase
    .from('conversations')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle()
  
  if (existingError) {
    return { error: existingError }
  }
  
  if (existing) return { conversation: existing }
  
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      client_id: clientId
    })
    .select()
    .single()
  
  if (convError) return { error: convError }
  
  // Add client as participant
  const { data: clientProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', clientId)
    .single()
  
  if (clientProfile) {
    const { error: clientParticipantError } = await supabase
      .from('conversation_participants')
      .insert({
        conversation_id: conversation.id,
        user_id: clientId
      })
      
    if (clientParticipantError) {
      console.error('Error adding client participant:', clientParticipantError)
    }
    
    // Add current user (admin/team) as participant
    const { error: currentUserError } = await supabase
      .from('conversation_participants')
      .insert({
        conversation_id: conversation.id,
        user_id: user.id
      })
      
    if (currentUserError) {
      console.error('Error adding current user participant:', currentUserError)
    }
    
    // Add assigned team members (if any)
    try {
      await addTeamParticipants(conversation.id, clientId)
    } catch (error) {
      console.error('Error adding team participants:', error)
    }
  }
  
  return { conversation }
}

// Send a message
export async function sendMessage({
  conversationId,
  content,
  attachments = []
}: {
  conversationId: string
  content: string
  attachments?: Array<{ name: string; url: string; size: number; type: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  // Insert message
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      type: 'user',
      content,
      attachments
    })
    .select(`
      *,
      sender:profiles(*)
    `)
    .single()
  
  if (error) return { error }
  
  // Update conversation last message
  await supabase
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: content.substring(0, 100)
    })
    .eq('id', conversationId)
  
  // Update participant last read
  await supabase
    .from('conversation_participants')
    .update({
      last_read_at: new Date().toISOString()
    })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
  
  return { message }
}

// Send system message (for automated events)
export async function sendSystemMessage({
  conversationId,
  content,
  metadata = {}
}: {
  conversationId: string
  content: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: null,
      type: 'system',
      content,
      metadata
    })
    .select()
    .single()
  
  if (error) return { error }
  
  // Update conversation
  await supabase
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: `System: ${content.substring(0, 80)}`
    })
    .eq('id', conversationId)
  
  return { message }
}

// Upload file attachment
export async function uploadAttachment(file: File, conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${conversationId}/${uuidv4()}.${fileExt}`
  
  const { error } = await supabase.storage
    .from('chat-attachments')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) return { error }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('chat-attachments')
    .getPublicUrl(fileName)
  
  return {
    attachment: {
      name: file.name,
      url: publicUrl,
      size: file.size,
      type: file.type
    }
  }
}

// Get conversation messages
export async function getMessages(conversationId: string, limit = 50) {
  const supabase = await createClient()
  
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles(
        id,
        email,
        first_name,
        last_name,
        avatar_url,
        role
      )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) return { error }
  
  return { messages: messages.reverse() } // Reverse to get chronological order
}

// Mark conversation as read
export async function markAsRead(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  // Update participant last read
  const { error } = await supabase
    .from('conversation_participants')
    .update({
      last_read_at: new Date().toISOString()
    })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
  
  if (error) return { error }
  
  return { success: true }
}

// Helper: Add team participants
async function addTeamParticipants(conversationId: string, clientId: string) {
  const supabase = await createClient()
  
  // Get all team members assigned to this client's services
  const { data: services } = await supabase
    .from('services')
    .select('assigned_to')
    .eq('client_id', clientId)
  
  if (services) {
    const teamMemberIds = Array.from(new Set(services.map(s => s.assigned_to).filter(Boolean)))
    
    for (const memberId of teamMemberIds) {
      await supabase
        .from('conversation_participants')
        .upsert({
          conversation_id: conversationId,
          user_id: memberId
        }, {
          onConflict: 'conversation_id,user_id'
        })
    }
  }
}

// Get user conversations (for admin/team inbox)
export async function getUserConversations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { conversations: [] }
  
  // First, get conversation IDs where user is a participant
  const { data: participantData } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id)
  
  if (!participantData || participantData.length === 0) {
    return { conversations: [] }
  }
  
  const conversationIds = participantData.map(p => p.conversation_id)
  
  // Then get full conversations data
  const { data: conversations } = await supabase
    .from("conversations")
    .select(`
      *,
      client:profiles!conversations_client_id_fkey(
        id,
        email,
        first_name,
        last_name,
        client_profiles(company_name)
      ),
      messages(
        id,
        content,
        created_at,
        sender:profiles(first_name, last_name)
      ),
      participants:conversation_participants(
        user_id,
        last_read_at
      )
    `)
    .in("id", conversationIds)
    .order("last_message_at", { ascending: false })
  
  return { conversations: conversations || [] }
}