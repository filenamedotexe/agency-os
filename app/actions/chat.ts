"use server"

import { createClient } from '@/shared/lib/supabase/server'

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

// Note: File uploads are now handled client-side in ChatInput component
// This server action has been removed to avoid File object serialization issues

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

// Get all attachments for a specific client
export async function getClientAttachments(clientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  // Get all conversations with this client
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .eq('client_id', clientId)
  
  if (!conversations || conversations.length === 0) {
    return { attachments: [] }
  }
  
  const conversationIds = conversations.map(c => c.id)
  
  // Get all messages with attachments from these conversations
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      attachments,
      created_at,
      conversation_id,
      sender:profiles(
        id,
        first_name,
        last_name,
        role
      )
    `)
    .in('conversation_id', conversationIds)
    .not('attachments', 'is', null)
    .order('created_at', { ascending: false })
  
  if (error) return { error }
  
  // Flatten attachments with metadata and generate signed URLs
  const allAttachments = []
  
  for (const message of messages || []) {
    if (message.attachments && Array.isArray(message.attachments)) {
      for (const attachment of message.attachments) {
        // Generate signed URL for secure access
        let secureUrl = attachment.url
        try {
          // Extract file path from various URL formats
          let filePath = null
          
          // Handle public URL format
          if (attachment.url.includes('/storage/v1/object/public/chat-attachments/')) {
            const urlParts = attachment.url.split('/storage/v1/object/public/chat-attachments/')
            if (urlParts.length > 1) {
              filePath = urlParts[1].split('?')[0] // Remove any query params
            }
          }
          // Handle signed URL format (extract path from already signed URL)
          else if (attachment.url.includes('/storage/v1/object/sign/chat-attachments/')) {
            const urlParts = attachment.url.split('/storage/v1/object/sign/chat-attachments/')
            if (urlParts.length > 1) {
              filePath = urlParts[1].split('?')[0] // Remove token and other params
            }
          }
          // Handle direct file path (if attachment.url is already a path)
          else if (!attachment.url.startsWith('http')) {
            filePath = attachment.url
          }
          
          // Generate fresh signed URL if we have a file path
          if (filePath) {
            const { data: signedData, error: signedError } = await supabase.storage
              .from('chat-attachments')
              .createSignedUrl(filePath, 3600) // 1 hour expiry
            
            if (!signedError && signedData?.signedUrl) {
              secureUrl = signedData.signedUrl
            } else if (signedError) {
              console.error('Signed URL generation error:', signedError.message)
            }
          }
        } catch (error) {
          console.error('Error generating signed URL:', error)
          // Keep original URL as fallback
        }
        
        allAttachments.push({
          ...attachment,
          url: secureUrl, // Use signed URL
          messageId: message.id,
          conversationId: message.conversation_id,
          uploadedAt: message.created_at,
          uploadedBy: message.sender,
          messageContent: message.content
        })
      }
    }
  }
  
  return { attachments: allAttachments }
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
  
  // Then get full conversations data with attachment counts
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
        attachments,
        sender:profiles(first_name, last_name)
      ),
      participants:conversation_participants(
        user_id,
        last_read_at
      )
    `)
    .in("id", conversationIds)
    .order("last_message_at", { ascending: false })
  
  // Add attachment count to each conversation  
  const conversationsWithCounts = (conversations || []).map(conv => {
    const attachmentCount = conv.messages?.reduce((total: number, msg: { attachments?: unknown[] }) => {
      return total + (msg.attachments ? msg.attachments.length : 0)
    }, 0) || 0
    
    return {
      ...conv,
      attachment_count: attachmentCount
    }
  })
  
  return { conversations: conversationsWithCounts }
}