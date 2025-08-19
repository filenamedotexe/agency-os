"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { Badge } from '@/shared/components/ui/badge'
import { useToast } from '@/shared/hooks/use-toast'
import { 
  FileText, 
  Loader2, 
  Search, 
  Calendar,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { createClient } from '@/shared/lib/supabase/client'
import { createServiceFromTemplate } from '@/app/actions/service-templates'
import { formatDate } from '@/shared/lib/format-date'
import { previewTemplateDates } from '@/shared/lib/smart-dates'
import type { ServiceTemplate } from '@/shared/types'

export function CreateServiceFromTemplate() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Array<{id: string, full_name?: string, email: string, company?: string}>>([])
  const [templates, setTemplates] = useState<ServiceTemplate[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<ServiceTemplate | null>(null)
  const [step, setStep] = useState<'select-template' | 'create-service'>('select-template')
  const [previewDates, setPreviewDates] = useState<Array<{name: string, calculated_due_date: string}>>([])
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
  
  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      loadClients()
      loadTemplates()
    }
  }, [open])
  
  // Update preview when start date or template changes
  useEffect(() => {
    if (selectedTemplate && formData.start_date) {
      updatePreviewDates()
    }
  }, [selectedTemplate, formData.start_date])
  
  const loadClients = async () => {
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
  }
  
  const loadTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('template_summary')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name')
      
      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive"
      })
    } finally {
      setLoadingTemplates(false)
    }
  }
  
  const updatePreviewDates = async () => {
    if (!selectedTemplate || !formData.start_date) return
    
    try {
      const supabase = createClient()
      
      // Get template with milestones
      const { data, error } = await supabase
        .from('service_templates')
        .select(`
          *,
          milestones:template_milestones(*)
        `)
        .eq('id', selectedTemplate.id)
        .single()
      
      if (error) throw error
      
      const serviceStartISO = new Date(formData.start_date + 'T00:00:00.000Z').toISOString()
      const preview = previewTemplateDates(serviceStartISO, data.milestones || [])
      setPreviewDates(preview)
    } catch (error) {
      console.error('Error updating preview dates:', error)
      setPreviewDates([])
    }
  }
  
  const handleTemplateSelect = (template: ServiceTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      ...formData,
      name: `${template.name} Project`,
      color: template.color,
      start_date: new Date().toISOString().split('T')[0]
    })
    setStep('create-service')
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTemplate || !formData.client_id || !formData.name) {
      toast({
        title: "Validation Error",
        description: "Please select a template, client, and enter a service name",
        variant: "destructive"
      })
      return
    }
    
    setLoading(true)
    
    try {
      const result = await createServiceFromTemplate(selectedTemplate.id, {
        client_id: formData.client_id,
        name: formData.name,
        description: formData.description || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined
      })
      
      if ('error' in result) {
        throw new Error(result.error)
      }
      
      toast({
        title: "Success",
        description: `Service created from ${selectedTemplate.name} template`,
      })
      
      setOpen(false)
      router.refresh()
      
      // Reset form
      setStep('select-template')
      setSelectedTemplate(null)
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
  
  const getColorTheme = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500'
      case 'green': return 'bg-green-500'
      case 'purple': return 'bg-purple-500'
      case 'orange': return 'bg-orange-500'
      case 'pink': return 'bg-pink-500'
      default: return 'bg-blue-500'
    }
  }
  
  const renderContent = () => {
    if (step === 'select-template') {
      return (
        <>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Create Service from Template
            </DialogTitle>
            <DialogDescription>
              Choose a template to create a new service with predefined milestones and tasks
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {loadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No templates available</p>
                <p className="text-sm text-muted-foreground">
                  Create templates first to use this feature
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded ${getColorTheme(template.color)}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{template.name}</h4>
                          {template.is_default && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {template.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>{template.milestone_count || 0} milestones</span>
                          <span>{template.task_count || 0} tasks</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </>
      )
    }
    
    // Create service form
    return (
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep('select-template')}
              className="p-1"
            >
              ←
            </Button>
            <div className={`w-4 h-4 rounded ${getColorTheme(selectedTemplate?.color || 'blue')}`} />
            Create from {selectedTemplate?.name}
          </DialogTitle>
          <DialogDescription>
            Configure your new service based on the selected template
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
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
              rows={2}
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
          
          {/* Budget */}
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
          
          {/* Template Preview */}
          {selectedTemplate && (
            <div className="p-3 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Template Preview
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-4">
                  <span>{selectedTemplate.milestone_count || 0} milestones</span>
                  <span>{selectedTemplate.task_count || 0} tasks</span>
                </div>
                
                {previewDates.length > 0 && formData.start_date && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Milestone Schedule:</p>
                    {previewDates.slice(0, 3).map((milestone, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <Calendar className="h-3 w-3" />
                        <span className="font-medium">{milestone.name}</span>
                        <span className="text-muted-foreground">
                          {milestone.calculated_due_date ? formatDate(milestone.calculated_due_date) : 'TBD'}
                        </span>
                      </div>
                    ))}
                    {previewDates.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{previewDates.length - 3} more milestones
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep('select-template')}
            disabled={loading}
          >
            Back
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
    )
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">From Template</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}