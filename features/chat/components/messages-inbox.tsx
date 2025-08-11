"use client"

import { useState, useEffect } from 'react'
import { getUserConversations } from '@/app/actions/chat'
import { ChatThread } from './chat-thread'
import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/shared/components/ui/badge'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Button } from '@/shared/components/ui/button'
import { Plus, User, Paperclip } from 'lucide-react'
import { NewMessageModal } from './new-message-modal'
import { ClientAttachmentsModal } from './client-attachments-modal'

interface MessagesInboxProps {
  userId: string
}

export function MessagesInbox({ userId }: MessagesInboxProps) {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewMessageModal, setShowNewMessageModal] = useState(false)
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false)
  const [selectedClientForAttachments, setSelectedClientForAttachments] = useState<{id: string, name: string} | null>(null)
  
  const loadConversations = async () => {
    const { conversations: data } = await getUserConversations()
    setConversations(data)
    if (data.length > 0 && !selectedConversationId) {
      setSelectedConversationId(data[0].id)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadConversations()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadConversations, 30000)
    return () => clearInterval(interval)
  }, [selectedConversationId])
  
  const selectedConversation = conversations.find(c => c.id === selectedConversationId)

  const handleProfileClick = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(`/clients/${clientId}`, '_blank')
  }

  const handleAttachmentsClick = (client: any, e: React.MouseEvent) => {
    e.stopPropagation()
    const clientName = client?.client_profiles?.company_name || 
                      `${client?.first_name} ${client?.last_name}` ||
                      client?.email
    setSelectedClientForAttachments({ id: client.id, name: clientName })
    setShowAttachmentsModal(true)
  }
  
  return (
    <div className="flex h-full">
      {/* Conversation List */}
      <div className="w-full sm:w-80 lg:w-96 border-r flex flex-col sm:min-w-[320px]">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Messages</h2>
            <Button 
              size="sm" 
              onClick={() => setShowNewMessageModal(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
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
                  <div
                    key={conversation.id}
                    className={cn(
                      "w-full p-3 rounded-lg transition-colors cursor-pointer relative",
                      "hover:bg-accent",
                      selectedConversationId === conversation.id && "bg-accent",
                      hasUnread && "font-medium"
                    )}
                    onClick={() => setSelectedConversationId(conversation.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                        <AvatarFallback>
                          {client?.first_name?.[0] || client?.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm sm:text-base font-medium truncate">
                            {client?.client_profiles?.company_name || 
                             `${client?.first_name} ${client?.last_name}` ||
                             client?.email}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {hasUnread && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unread_count}
                              </Badge>
                            )}
                            {conversation.attachment_count > 0 && (
                              <button
                                onClick={(e) => handleAttachmentsClick(client, e)}
                                className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                title={`${conversation.attachment_count} attachments`}
                              >
                                <div className="relative">
                                  <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                                  {conversation.attachment_count <= 99 && (
                                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-blue-500 hover:bg-blue-600 flex items-center justify-center">
                                      {conversation.attachment_count > 9 ? '9+' : conversation.attachment_count}
                                    </Badge>
                                  )}
                                </div>
                              </button>
                            )}
                            <button
                              onClick={(e) => handleProfileClick(client.id, e)}
                              className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                              title="View profile"
                            >
                              <User className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
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
                  </div>
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
      
      <NewMessageModal 
        open={showNewMessageModal}
        onOpenChange={setShowNewMessageModal}
        onConversationCreated={(conversationId) => {
          setSelectedConversationId(conversationId)
          // Refresh conversations list
          loadConversations()
        }}
      />

      {selectedClientForAttachments && (
        <ClientAttachmentsModal
          open={showAttachmentsModal}
          onOpenChange={setShowAttachmentsModal}
          clientId={selectedClientForAttachments.id}
          clientName={selectedClientForAttachments.name}
        />
      )}
    </div>
  )
}