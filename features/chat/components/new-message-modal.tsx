"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Building, Search, MessageCircle } from 'lucide-react'
import { useToast } from '@/shared/hooks/use-toast'
import { getOrCreateConversation } from '@/app/actions/chat'
import { createClient } from '@/shared/lib/supabase/client'
import { designSystem as ds } from "@/shared/lib/design-system"

interface NewMessageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConversationCreated?: (conversationId: string) => void
}

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
  client_profiles?: {
    company_name?: string
    industry?: string
  }[]
}

export function NewMessageModal({ open, onOpenChange, onConversationCreated }: NewMessageModalProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [creatingConversation, setCreatingConversation] = useState(false)
  const { toast } = useToast()

  // Load clients when modal opens
  useEffect(() => {
    if (open) {
      loadClients()
      setSearchQuery('')
    }
  }, [open])

  // Filter clients based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = clients.filter(client => 
        client.first_name.toLowerCase().includes(query) ||
        client.last_name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.client_profiles?.[0]?.company_name?.toLowerCase().includes(query)
      )
      setFilteredClients(filtered)
    }
  }, [searchQuery, clients])

  const loadClients = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          client_profiles (
            company_name,
            industry
          )
        `)
        .eq('role', 'client')
        .order('first_name')

      if (error) {
        console.error('Error loading clients:', error)
        toast({
          title: "Error",
          description: "Failed to load clients",
          variant: "destructive"
        })
        return
      }

      setClients(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error", 
        description: "Something went wrong",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartConversation = async (client: Client) => {
    setCreatingConversation(true)
    
    try {
      console.log('Starting conversation with client:', client.id, client.first_name, client.last_name)
      const result = await getOrCreateConversation(client.id)
      console.log('Conversation result:', result)
      
      if (result.error) {
        console.error('Server error:', result.error)
        toast({
          title: "Error",
          description: typeof result.error === 'string' ? result.error : `Failed to create conversation: ${result.error.message || 'Unknown error'}`,
          variant: "destructive" 
        })
        return
      }

      const conversationId = result.conversation?.id
      
      if (conversationId) {
        console.log('Conversation created successfully:', conversationId)
        toast({
          title: "Success",
          description: `Started conversation with ${client.first_name} ${client.last_name}`,
        })
        
        onConversationCreated?.(conversationId)
        onOpenChange(false)
      } else {
        console.error('No conversation ID returned:', result)
        toast({
          title: "Error",
          description: "No conversation ID returned from server",
          variant: "destructive"
        })
      }

    } catch (error) {
      console.error('Error creating conversation:', error)
      toast({
        title: "Error",
        description: `Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        variant: "destructive"
      })
    } finally {
      setCreatingConversation(false)
    }
  }

  const getClientInitials = (client: Client) => {
    return `${client.first_name?.[0] || ''}${client.last_name?.[0] || ''}`.toUpperCase()
  }

  const getClientDisplayName = (client: Client) => {
    const companyName = client.client_profiles?.[0]?.company_name
    if (companyName) {
      return `${client.first_name} ${client.last_name} - ${companyName}`
    }
    return `${client.first_name} ${client.last_name}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 sm:p-4">
            <MessageCircle className="h-5 w-5" />
            New Message
          </DialogTitle>
          <DialogDescription>
            Select a client to start a new conversation
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search clients by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Client List */}
          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading clients...</div>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Building className="h-8 w-8 text-muted-foreground mb-2" />
                <div className="text-sm text-muted-foreground">
                  {searchQuery ? 'No clients found matching your search' : 'No clients found'}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredClients.map((client) => (
                  <Button
                    key={client.id}
                    variant="ghost"
                    className="w-full justify-start p-3 sm:p-4 h-auto"
                    onClick={() => handleStartConversation(client)}
                    disabled={creatingConversation}
                  >
                    <div className="flex items-center gap-3 sm:p-4 w-full">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {getClientInitials(client)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 text-left">
                        <div className="font-medium">
                          {getClientDisplayName(client)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {client.email}
                        </div>
                        {client.client_profiles?.[0]?.industry && (
                          <div className="text-xs text-muted-foreground">
                            {client.client_profiles[0].industry}
                          </div>
                        )}
                      </div>
                      
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {/* Footer */}
          <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
            <span>
              {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} found
            </span>
            <span>
              Click a client to start messaging
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}