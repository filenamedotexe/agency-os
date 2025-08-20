"use client"

import { useState, useEffect } from 'react'
import { updateResource } from '@/app/actions/knowledge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { RichTextEditor } from '@/shared/components/ui/rich-text-editor'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Save, Loader2, Download } from 'lucide-react'
import { useToast } from '@/shared/hooks/use-toast'

interface Resource {
  id: string
  title: string
  description?: string | null
  rich_description?: object | null
  type: string
  content_url?: string | null
  file_name?: string | null
  file_size?: number | null
  mime_type?: string | null
  created_at: string
}

interface EditResourceDialogProps {
  resource: Resource | null
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole?: 'admin' | 'team_member' | 'client'
}

export function EditResourceDialog({ 
  resource, 
  open, 
  onOpenChange, 
  userRole = 'client' 
}: EditResourceDialogProps) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [richDescription, setRichDescription] = useState('')
  const { toast } = useToast()

  // Reset form when resource changes
  useEffect(() => {
    if (resource) {
      setTitle(resource.title || '')
      setDescription(resource.description || '')
      
      // Handle rich description - pass the object directly to TipTap
      if (resource.rich_description) {
        try {
          // If it's already a JSON object, use it directly
          // If it's a string, try to parse it
          if (typeof resource.rich_description === 'string') {
            const parsed = JSON.parse(resource.rich_description)
            setRichDescription(parsed)
          } else {
            setRichDescription(resource.rich_description)
          }
        } catch {
          // If parsing fails, treat as plain text
          setRichDescription(resource.rich_description)
        }
      } else {
        setRichDescription('')
      }
    } else {
      setTitle('')
      setDescription('')
      setRichDescription('')
    }
  }, [resource])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!resource) return
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const result = await updateResource(resource.id, {
        title: title.trim(),
        description: description || undefined,
        rich_description: richDescription || undefined,
      })
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      toast({
        title: "Success",
        description: "Resource updated successfully"
      })
      
      onOpenChange(false)
      
    } catch (error) {
      console.error('Update error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update resource',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!resource) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Resource</DialogTitle>
          <DialogDescription>
            Update the title and content of this resource
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Resource Type Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <span className="capitalize font-medium">{resource.type} Resource</span>
            {resource.file_name && (
              <span>• {resource.file_name}</span>
            )}
            {resource.file_size && (
              <span>• {(resource.file_size / 1024).toFixed(1)} KB</span>
            )}
          </div>

          {/* Title Input */}
          <div>
            <label className="text-sm font-medium block mb-2">
              Title (required)
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resource title..."
              disabled={loading}
              required
            />
          </div>

          {/* Rich Text Editor */}
          <div>
            <label className="text-sm font-medium block mb-2">
              {resource.type === 'note' ? 'Content' : 'Description'}
            </label>
            <RichTextEditor
              content={richDescription}
              onChange={setRichDescription}
              placeholder={resource.type === 'note' ? 'Edit your note content...' : 'Edit the description...'}
              editable={!loading}
              minimal={resource.type !== 'note'}
              userRole={userRole}
              className={resource.type === 'note' ? 'min-h-[300px]' : 'min-h-[150px]'}
            />
          </div>

          {/* File Info for file-based resources */}
          {resource.content_url && resource.type !== 'note' && (
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Attached File:</p>
              <div className="flex items-center gap-2">
                <a 
                  href={resource.content_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {resource.file_name || 'View File'}
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a href={resource.content_url} download={resource.file_name}>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              disabled={!title.trim() || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}