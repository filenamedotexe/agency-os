"use client"

import { useState } from 'react'
import { createResource } from '@/app/actions/knowledge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { RichTextEditor } from '@/shared/components/ui/rich-text-editor'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { Plus, Upload, Loader2, FileText, File as FileIcon } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { useToast } from '@/shared/hooks/use-toast'

interface ResourceUploadProps {
  collectionId: string
  userRole?: 'admin' | 'team_member' | 'client'
}

export function ResourceUpload({ collectionId, userRole = 'client' }: ResourceUploadProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [richDescription, setRichDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [resourceType, setResourceType] = useState<'file' | 'note'>('note')
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation - either need file OR rich content for note type
    if (resourceType === 'file' && !file) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive"
      })
      return
    }
    
    if (resourceType === 'note' && !title.trim()) {
      toast({
        title: "Error", 
        description: "Please provide a title for the note",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setUploadProgress(10)

    try {
      let uploadResult = null
      let fileType: 'document' | 'video' | 'file' | 'note' = resourceType === 'note' ? 'note' : 'file'
      
      // Only upload file if we have one
      if (file && resourceType === 'file') {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('collectionId', collectionId)
        
        setUploadProgress(30)
        
        const uploadResponse = await fetch('/api/knowledge/upload', {
          method: 'POST',
          body: formData
        })
        
        setUploadProgress(70)
        
        if (!uploadResponse.ok) {
          throw new Error('Upload failed')
        }
        
        uploadResult = await uploadResponse.json()
        
        // Detect file type
        if (file.type.startsWith('video/')) {
          fileType = 'video'
        } else if (file.type.includes('pdf') || file.type.includes('document')) {
          fileType = 'document'
        } else {
          fileType = 'file'
        }
      }
      
      setUploadProgress(90)
      
      // Create resource in database
      const result = await createResource({
        collection_id: collectionId,
        title: title || (file ? file.name.replace(/\.[^/.]+$/, '') : 'Untitled Note'),
        description: description || undefined,
        rich_description: richDescription || undefined,
        type: fileType,
        content_url: uploadResult?.url || null,
        file_name: file?.name || null,
        file_size: file?.size || null,
        mime_type: file?.type || null
      })
      
      setUploadProgress(100)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      toast({
        title: "Success",
        description: "Resource uploaded successfully"
      })
      
      // Reset form
      setTitle('')
      setDescription('')
      setRichDescription('')
      setFile(null)
      setResourceType('note')
      setOpen(false)
      
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Upload failed',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
          <DialogDescription>
            Create a rich text note or upload a file to this collection
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Resource Type</label>
            <Select value={resourceType} onValueChange={(value: 'file' | 'note') => setResourceType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select resource type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="note">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Rich Text Note
                  </div>
                </SelectItem>
                <SelectItem value="file">
                  <div className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4" />
                    File Upload
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {resourceType === 'file' && (
            <div>
              <label className="text-sm font-medium">File</label>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={loading}
                accept="*/*"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supports all file types including videos, documents, images, etc.
              </p>
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium">
              Title {resourceType === 'note' ? '(required)' : '(optional)'}
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={resourceType === 'note' ? 'Enter note title' : 'Leave empty to use filename'}
              disabled={loading}
              required={resourceType === 'note'}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">
              {resourceType === 'note' ? 'Content' : 'Description (optional)'}
            </label>
            <RichTextEditor
              content={richDescription}
              onChange={setRichDescription}
              placeholder={resourceType === 'note' ? 'Start writing your note...' : 'Brief description of the resource'}
              editable={!loading}
              minimal={resourceType === 'file'}
              userRole={userRole}
              className={resourceType === 'note' ? 'min-h-[300px]' : 'min-h-[120px]'}
            />
          </div>
          
          {loading && (
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
          
          <Button 
            type="submit" 
            disabled={loading || (resourceType === 'file' && !file) || (resourceType === 'note' && !title.trim())} 
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {resourceType === 'file' ? 'Uploading...' : 'Creating...'}
              </>
            ) : (
              <>
                {resourceType === 'file' ? (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Resource
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Note
                  </>
                )}
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}