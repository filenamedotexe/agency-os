"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { getOrCreateConversation } from '@/app/actions/chat'
import { useToast } from '@/shared/hooks/use-toast'

interface MessageClientButtonProps {
  clientId: string
  clientName: string
}

export function MessageClientButton({ clientId, clientName }: MessageClientButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleMessageClick = async () => {
    setLoading(true)
    
    try {
      const result = await getOrCreateConversation(clientId)
      
      if (result.error) {
        toast({
          title: "Error",
          description: "Failed to start conversation",
          variant: "destructive"
        })
        return
      }
      
      // Redirect to messages page with conversation ID as query param
      if (result.conversation) {
        router.push(`/messages?conversation=${result.conversation.id}`)
        
        toast({
          title: "Success", 
          description: `Opening conversation with ${clientName}`
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to create conversation",
          variant: "destructive"
        })
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleMessageClick}
      disabled={loading}
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      {loading ? "Starting..." : "Message"}
    </Button>
  )
}