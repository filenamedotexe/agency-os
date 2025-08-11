"use client"

import { useState, useEffect } from 'react'
import { getUserConversations } from '@/app/actions/chat'
import { ChatThread } from './chat-thread'
import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/shared/components/ui/badge'
import { ScrollArea } from '@/shared/components/ui/scroll-area'

interface MessagesInboxProps {
  userId: string
}

export function MessagesInbox({ userId }: MessagesInboxProps) {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function loadConversations() {
      const { conversations: data } = await getUserConversations()
      setConversations(data)
      if (data.length > 0 && !selectedConversationId) {
        setSelectedConversationId(data[0].id)
      }
      setLoading(false)
    }
    loadConversations()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadConversations, 30000)
    return () => clearInterval(interval)
  }, [selectedConversationId])
  
  const selectedConversation = conversations.find(c => c.id === selectedConversationId)
  
  return (
    <div className="flex h-full">
      {/* Conversation List */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">Messages</h2>
        </div>
        
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            <div className="p-2">
              {conversations.map((conversation) => {
                const client = conversation.client
                const hasUnread = conversation.unread_count > 0
                const lastMessage = conversation.last_message_preview
                
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={cn(
                      "w-full p-3 rounded-lg text-left transition-colors",
                      "hover:bg-accent",
                      selectedConversationId === conversation.id && "bg-accent",
                      hasUnread && "font-medium"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {client?.first_name?.[0] || client?.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">
                            {client?.client_profiles?.company_name || 
                             `${client?.first_name} ${client?.last_name}` ||
                             client?.email}
                          </span>
                          {hasUnread && (
                            <Badge variant="destructive" className="ml-2">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground truncate">
                          {lastMessage || 'No messages yet'}
                        </p>
                        
                        {conversation.last_message_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(conversation.last_message_at), {
                              addSuffix: true
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>
      
      {/* Chat Thread */}
      <div className="flex-1">
        {selectedConversation ? (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-medium">
                {selectedConversation.client?.client_profiles?.company_name ||
                 `${selectedConversation.client?.first_name} ${selectedConversation.client?.last_name}` ||
                 selectedConversation.client?.email}
              </h3>
            </div>
            <ChatThread
              conversationId={selectedConversationId!}
              currentUserId={userId}
              showSystemMessages={true}
              className="flex-1"
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  )
}