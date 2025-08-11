"use client"

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/shared/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeMessages(conversationId: string) {
  const [messages, setMessages] = useState<any[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const supabase = createClient()
  
  const subscribeToMessages = useCallback(() => {
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
          // Fetch full message with sender details
          const { data: newMessage } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles(*)
            `)
            .eq('id', payload.new.id)
            .single()
          
          if (newMessage) {
            setMessages(prev => [...prev, newMessage])
          }
        }
      )
      .subscribe()
    
    setChannel(channel)
    
    return channel
  }, [conversationId, supabase])
  
  useEffect(() => {
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