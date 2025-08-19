"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { useToast } from '@/shared/hooks/use-toast'
import { Loader2, ChevronLeft, Save } from 'lucide-react'
import { updateServiceTemplate } from '@/app/actions/service-templates'
import type { ServiceTemplate } from '@/shared/types'

interface EditTemplateFormProps {
  template: ServiceTemplate
  onSuccess: () => void
  onCancel: () => void
}

export function EditTemplateForm({ template, onSuccess, onCancel }: EditTemplateFormProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    name: template.name,
    description: template.description || '',
    color: template.color
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Template name is required",
        variant: "destructive"
      })
      return
    }
    
    setLoading(true)
    
    try {
      const result = await updateServiceTemplate(template.id, {
        name: formData.name,
        description: formData.description || undefined,
        color: formData.color
      })
      
      if ('error' in result) {
        throw new Error(result.error)
      }
      
      onSuccess()
    } catch (error) {
      console.error('Error updating template:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update template",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="p-1"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update template basic information
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Template Name *</Label>
          <Input
            id="name"
            placeholder="e.g., Website Development"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Brief description of this template..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>
        
        <div>
          <Label htmlFor="color">Color Theme</Label>
          <Select
            value={formData.color}
            onValueChange={(value: any) => setFormData({ ...formData, color: value })}
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
        
        {template.is_default && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This is a default template. Changes will affect all users.
            </p>
          </div>
        )}
      </div>
      
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}