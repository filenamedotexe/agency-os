"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createService } from '@/app/actions/services'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { useToast } from '@/shared/hooks/use-toast'
import { Plus, Loader2, Search } from 'lucide-react'
import { createClient } from '@/shared/lib/supabase/client'

export function CreateServiceButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Array<{id: string, full_name?: string, email: string, company?: string}>>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingClients, setLoadingClients] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  
  // Form state
  const [formData, setFormData] = useState({
    client_id: '',
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    budget: '',
    color: 'blue'
  })
  
  const loadClients = useCallback(async () => {
    setLoadingClients(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return
      
      // Check user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (!profile || profile.role === 'client') {
        // Clients can't create services
        setClients([])
        return
      }
      
      // Get all client profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, company')
        .eq('role', 'client')
        .order('full_name')
      
      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive"
      })
    } finally {
      setLoadingClients(false)
    }
  }, [toast])
  
  // Load clients when dialog opens
  useEffect(() => {
    if (open) {
      loadClients()
    }
  }, [open, loadClients])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.client_id || !formData.name) {
      toast({
        title: "Validation Error",
        description: "Please select a client and enter a service name",
        variant: "destructive"
      })
      return
    }
    
    setLoading(true)
    
    try {
      const result = await createService({
        client_id: formData.client_id,
        name: formData.name,
        description: formData.description || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        color: formData.color
      })
      
      if ('error' in result) {
        throw new Error(result.error)
      }
      
      toast({
        title: "Success",
        description: "Service created successfully",
      })
      
      setOpen(false)
      router.refresh()
      
      // Reset form
      setFormData({
        client_id: '',
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        budget: '',
        color: 'blue'
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create service",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  const filteredClients = clients.filter(client => {
    const search = searchTerm.toLowerCase()
    return (
      client.full_name?.toLowerCase().includes(search) ||
      client.email?.toLowerCase().includes(search) ||
      client.company?.toLowerCase().includes(search)
    )
  })
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Service</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Service</DialogTitle>
            <DialogDescription>
              Start a new project for a client. Default milestones will be created automatically.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Client Selection */}
            <div className="grid gap-2">
              <Label htmlFor="client">Client *</Label>
              {loadingClients ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredClients.length === 0 ? (
                        <div className="py-2 px-3 text-sm text-muted-foreground">
                          No clients found
                        </div>
                      ) : (
                        filteredClients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            <div>
                              <div className="font-medium">{client.full_name || client.email}</div>
                              {client.company && (
                                <div className="text-xs text-muted-foreground">{client.company}</div>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
            
            {/* Service Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Website Redesign"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the service..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            
            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  min={formData.start_date}
                />
              </div>
            </div>
            
            {/* Budget and Color */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="budget">Budget ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="10000"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  min="0"
                  step="100"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">Color Theme</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData({ ...formData, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-500" />
                        Blue
                      </div>
                    </SelectItem>
                    <SelectItem value="green">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-500" />
                        Green
                      </div>
                    </SelectItem>
                    <SelectItem value="purple">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-purple-500" />
                        Purple
                      </div>
                    </SelectItem>
                    <SelectItem value="orange">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-orange-500" />
                        Orange
                      </div>
                    </SelectItem>
                    <SelectItem value="pink">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-pink-500" />
                        Pink
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Service'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}