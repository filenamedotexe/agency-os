"use client"

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/shared/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeMessages(conversationId: string) {
  const [messages, setMessages] = useState<any[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const supabase = createClient()
  
  const subscribeToMessages = useCallback(() => {
    console.log('🔴 Subscribing to realtime messages for conversation:', conversationId)
    
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          console.log('🟢 Realtime message received:', payload.new.id, 'for conversation:', payload.new.conversation_id)
          
          // Fetch full message with sender details
          const { data: newMessage, error } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles(*)
            `)
            .eq('id', payload.new.id)
            .single()
          
          if (error) {
            console.error('🔴 Error fetching realtime message:', error)
            return
          }
          
          console.log('🟡 Fetched full message:', newMessage?.id, 'from:', newMessage?.sender?.email)
          
          if (newMessage) {
            setMessages(prev => {
              // Avoid duplicates by checking if message already exists
              const exists = prev.some(m => m.id === newMessage.id)
              if (!exists) {
                console.log('🟢 Adding new message to realtime state')
                return [...prev, newMessage]
              }
              console.log('🟠 Message already exists in realtime state, skipping')
              return prev
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status)
      })
    
    setChannel(channel)
    
    return channel
  }, [conversationId, supabase])
  
  useEffect(() => {
    // Reset messages when conversation changes
    setMessages([])
    
    const channel = subscribeToMessages()
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [subscribeToMessages])
  
  return { messages, channel }
}

// Presence hook for "online" indicators
export function usePresence(conversationId: string) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const supabase = createClient()
  
  useEffect(() => {
    const channel = supabase.channel(`presence:${conversationId}`)
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = Object.keys(state).map(key => {
          const presences = state[key]
          return presences.length > 0 ? (presences[0] as any).user_id : null
        }).filter(Boolean)
        setOnlineUsers(users)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await channel.track({ user_id: user.id })
          }
        }
      })
    
    return () => {
      channel.unsubscribe()
    }
  }, [conversationId, supabase])
  
  return { onlineUsers }
}