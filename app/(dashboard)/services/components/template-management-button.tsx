"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Badge } from '@/shared/components/ui/badge'
import { useToast } from '@/shared/hooks/use-toast'
import { 
  FileText, 
  Plus, 
  Loader2, 
  Settings,
  Eye,
  Edit3,
  Trash2,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { createClient } from '@/shared/lib/supabase/client'
import { CreateTemplateForm } from './create-template-form'
import { EditTemplateForm } from './edit-template-form'
import { TemplatePreview } from './template-preview'
import type { ServiceTemplate } from '@/shared/types'

export function TemplateManagementButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<ServiceTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ServiceTemplate | null>(null)
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'preview'>('list')
  const { toast } = useToast()
  
  // Load templates when dialog opens
  useEffect(() => {
    if (open && mode === 'list') {
      loadTemplates()
    }
  }, [open, mode])
  
  const loadTemplates = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to access templates",
          variant: "destructive"
        })
        return
      }
      
      // Get templates with summary information
      const { data, error } = await supabase
        .from('template_summary')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
      
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
      setLoading(false)
    }
  }
  
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return
    }
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('service_templates')
        .delete()
        .eq('id', templateId)
      
      if (error) throw error
      
      toast({
        title: "Success",
        description: "Template deleted successfully",
      })
      
      // Reload templates
      loadTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
      })
    }
  }
  
  const handleTemplateCreated = () => {
    setMode('list')
    loadTemplates()
    toast({
      title: "Success",
      description: "Template created successfully",
    })
  }
  
  const handleTemplateUpdated = () => {
    setMode('list')
    setSelectedTemplate(null)
    loadTemplates()
    toast({
      title: "Success",
      description: "Template updated successfully",
    })
  }
  
  const renderContent = () => {
    switch (mode) {
      case 'create':
        return (
          <CreateTemplateForm
            onSuccess={handleTemplateCreated}
            onCancel={() => setMode('list')}
          />
        )
      
      case 'edit':
        return selectedTemplate ? (
          <EditTemplateForm
            template={selectedTemplate}
            onSuccess={handleTemplateUpdated}
            onCancel={() => {
              setMode('list')
              setSelectedTemplate(null)
            }}
          />
        ) : null
      
      case 'preview':
        return selectedTemplate ? (
          <TemplatePreview
            template={selectedTemplate}
            onClose={() => {
              setMode('list')
              setSelectedTemplate(null)
            }}
          />
        ) : null
      
      default:
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Service Templates
              </DialogTitle>
              <DialogDescription>
                Manage reusable project templates with predefined milestones and tasks.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Create New Template Button */}
              <Button 
                onClick={() => setMode('create')}
                className="w-full gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                Create New Template
              </Button>
              
              {/* Templates List */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No templates yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create your first template to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{template.name}</h4>
                          {template.is_default && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {template.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{template.milestone_count} milestones</span>
                          <span>{template.task_count} tasks</span>
                          <span>By {template.created_by_name}</span>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Template Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTemplate(template)
                              setMode('preview')
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTemplate(template)
                              setMode('edit')
                            }}
                          >
                            <Edit3 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {!template.is_default && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Templates</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}