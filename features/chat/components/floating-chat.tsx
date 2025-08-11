"use client"

import { useState, useEffect } from 'react'
import { MessageCircle, X, Minimize2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { ChatThread } from './chat-thread'
import { getOrCreateConversation } from '@/app/actions/chat'
import { cn } from '@/shared/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface FloatingChatProps {
  userId: string
  userRole: string
}

export function FloatingChat({ userId, userRole }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  
  useEffect(() => {
    // Only show for clients
    if (userRole !== 'client') return
    
    async function initConversation() {
      const { conversation } = await getOrCreateConversation(userId)
      if (conversation) {
        setConversationId(conversation.id)
        setUnreadCount(conversation.unread_count || 0)
      }
    }
    initConversation()
  }, [userId, userRole])
  
  if (userRole !== 'client' || !conversationId) return null
  
  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="rounded-full h-14 w-14 shadow-lg relative"
            >
              <MessageCircle className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              "fixed z-50 bg-background border rounded-lg shadow-xl",
              "bottom-4 right-4",
              "w-[380px] h-[600px]",
              "md:w-[400px] md:h-[600px]",
              "flex flex-col"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <span className="font-semibold">Chat with Team</span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Chat Thread */}
            {!isMinimized && (
              <ChatThread
                conversationId={conversationId}
                currentUserId={userId}
                showSystemMessages={true}
                className="flex-1"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}