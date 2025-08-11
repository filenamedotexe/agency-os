"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { MessageBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import { useRealtimeMessages, usePresence } from '@/shared/hooks/use-realtime-messages'
import { getMessages, sendMessage, markAsRead } from '@/app/actions/chat'
import { Loader2 } from 'lucide-react'
import { useInView } from 'react-intersection-observer'
import { cn } from '@/shared/lib/utils'

interface ChatThreadProps {
  conversationId: string
  currentUserId: string
  showSystemMessages?: boolean
  className?: string
}

export function ChatThread({ 
  conversationId, 
  currentUserId,
  showSystemMessages = true,
  className 
}: ChatThreadProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { ref: bottomRef, inView } = useInView()
  const { messages: realtimeMessages } = useRealtimeMessages(conversationId)
  const { onlineUsers } = usePresence(conversationId)
  
  // Load initial messages
  useEffect(() => {
    async function loadMessages() {
      const { messages: data, error } = await getMessages(conversationId)
      if (!error && data) {
        setMessages(data)
      }
      setLoading(false)
    }
    loadMessages()
  }, [conversationId])
  
  // Add realtime messages
  useEffect(() => {
    if (realtimeMessages.length > 0) {
      const lastRealtime = realtimeMessages[realtimeMessages.length - 1]
      const exists = messages.some(m => m.id === lastRealtime.id)
      if (!exists) {
        setMessages(prev => [...prev, lastRealtime])
      }
    }
  }, [realtimeMessages, messages])
  
  // Mark as read when viewing
  useEffect(() => {
    if (inView && messages.length > 0) {
      markAsRead(conversationId)
    }
  }, [inView, conversationId, messages.length])
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])
  
  const handleSendMessage = async (content: string, attachments: any[]) => {
    setSending(true)
    
    const { message, error } = await sendMessage({
      conversationId,
      content,
      attachments
    })
    
    if (!error && message) {
      // Message will appear via realtime
    }
    
    setSending(false)
  }
  
  const filteredMessages = showSystemMessages 
    ? messages 
    : messages.filter(m => m.type === 'user')
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }
  
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {onlineUsers.length > 0 && (
        <div className="px-4 py-2 border-b">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">
              {onlineUsers.length} online
            </span>
          </div>
        </div>
      )}
      
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {filteredMessages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <>
            {filteredMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender?.id === currentUserId}
              />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </ScrollArea>
      
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={sending}
        placeholder="Type a message..."
        conversationId={conversationId}
      />
    </div>
  )
}