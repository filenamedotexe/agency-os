"use client"

import { useState, useEffect, useRef } from 'react'
import { getUserConversations } from '@/app/actions/chat'
import { ChatThread } from './chat-thread'
import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/shared/components/ui/badge'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Button } from '@/shared/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { Plus, User, Paperclip, Menu } from 'lucide-react'
import { NewMessageModal } from './new-message-modal'
import { ClientAttachmentsModal } from './client-attachments-modal'
import { useIsMobile } from '@/shared/hooks/use-mobile'

interface MessagesInboxProps {
  userId: string
  userRole?: string
}

export function MessagesInbox({ userId, userRole }: MessagesInboxProps) {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewMessageModal, setShowNewMessageModal] = useState(false)
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false)
  const [selectedClientForAttachments, setSelectedClientForAttachments] = useState<{id: string, name: string} | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isMobile = useIsMobile()
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
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
  
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    // Close mobile menu when conversation is selected
    setMobileMenuOpen(false)
    
    // Auto-scroll to chat input on mobile
    if (isMobile && chatContainerRef.current) {
      setTimeout(() => {
        const input = chatContainerRef.current?.querySelector('textarea')
        if (input) {
          input.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
      }, 100)
    }
  }
  
  // Conversation list component (reused for desktop and mobile)
  const ConversationList = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <div className={cn(
        "border-b bg-background",
        "p-4"
      )}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Messages</h2>
          <Button 
            size="sm" 
            onClick={() => {
              setShowNewMessageModal(true)
              if (mobile) setMobileMenuOpen(false)
            }}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="text-center text-muted-foreground p-8">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-muted-foreground p-8">
            No conversations yet
          </div>
        ) : (
          <div className="p-2 space-y-1">
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
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback>
                        {client?.first_name?.[0] || client?.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="truncate block text-sm font-medium">
                          {client?.client_profiles?.company_name || 
                           `${client?.first_name} ${client?.last_name}` ||
                           client?.email}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {hasUnread && (
                            <Badge variant="destructive" className="text-xs px-1.5 h-5">
                              {conversation.unread_count}
                            </Badge>
                          )}
                          {conversation.attachment_count > 0 && (
                            <button
                              onClick={(e) => handleAttachmentsClick(client, e)}
                              className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                              title={`${conversation.attachment_count} attachments`}
                            >
                              <div className="relative">
                                <Paperclip className="h-4 w-4" />
                                {conversation.attachment_count > 0 && (
                                  <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 text-[10px] bg-blue-500 hover:bg-blue-600 flex items-center justify-center">
                                    {conversation.attachment_count > 9 ? '9+' : conversation.attachment_count}
                                  </Badge>
                                )}
                              </div>
                            </button>
                          )}
                          <button
                            onClick={(e) => handleProfileClick(client.id, e)}
                            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                            title="View profile"
                          >
                            <User className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="truncate text-sm text-muted-foreground">
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
    </>
  )
  
  return (
    <div className="flex h-full overflow-hidden">
      {/* Desktop Conversation List - Only show on large screens */}
      <div className={cn(
        "hidden lg:flex flex-col border-r bg-background",
        "w-80 xl:w-96 flex-shrink-0"
      )}>
        <ConversationList />
      </div>
      
      {/* Mobile Conversation List (Sheet) - Only on mobile */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-[85vw] max-w-[400px] flex flex-col">
            <SheetHeader className="sr-only">
              <SheetTitle>Conversations</SheetTitle>
            </SheetHeader>
            <ConversationList mobile />
          </SheetContent>
        </Sheet>
      )}
      
      {/* Chat Thread */}
      <div className="flex-1 flex flex-col overflow-hidden" ref={chatContainerRef}>
        {selectedConversation ? (
          <>
            {/* Chat header with mobile menu button */}
            <div className="border-b bg-background">
              <div className="flex items-center gap-2 p-4">
                {/* Mobile menu button - only on mobile */}
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(true)}
                    className="lg:hidden flex-shrink-0"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                )}
                
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <div className="min-w-0">
                    <h3 className="font-medium truncate text-sm">
                      {selectedConversation.client?.client_profiles?.company_name ||
                       `${selectedConversation.client?.first_name} ${selectedConversation.client?.last_name}` ||
                       selectedConversation.client?.email}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.client?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {selectedConversation.attachment_count > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const client = selectedConversation.client
                          const clientName = client?.client_profiles?.company_name || 
                                            `${client?.first_name} ${client?.last_name}` ||
                                            client?.email
                          setSelectedClientForAttachments({ id: client.id, name: clientName })
                          setShowAttachmentsModal(true)
                        }}
                        className="gap-1"
                      >
                        <Paperclip className="h-4 w-4" />
                        <span className="hidden sm:inline">Files</span>
                        <Badge variant="secondary" className="ml-1">
                          {selectedConversation.attachment_count}
                        </Badge>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Chat messages */}
            <ChatThread
              conversationId={selectedConversationId!}
              currentUserId={userId}
              userRole={userRole}
              showSystemMessages={true}
              className="flex-1 overflow-hidden"
            />
          </>
        ) : (
          <div className="h-full flex flex-col">
            {/* Empty state header with mobile menu button */}
            {isMobile && (
              <div className="border-b bg-background p-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            )}
            
            <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
              <div className="text-center">
                <p className="text-lg mb-2">No conversation selected</p>
                <p className="text-sm">
                  {conversations.length === 0 
                    ? "Start a new conversation to begin messaging"
                    : isMobile
                      ? "Tap the menu to select a conversation"
                      : "Select a conversation from the list to view messages"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Modals */}
      <NewMessageModal 
        open={showNewMessageModal}
        onOpenChange={setShowNewMessageModal}
        onConversationCreated={(conversationId) => {
          setSelectedConversationId(conversationId)
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