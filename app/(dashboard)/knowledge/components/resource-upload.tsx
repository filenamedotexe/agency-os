"use client"

import { useState } from 'react'
import { createResource } from '@/app/actions/knowledge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { Plus, Upload, Loader2 } from 'lucide-react'
import { useToast } from '@/shared/hooks/use-toast'

interface ResourceUploadProps {
  collectionId: string
}

export function ResourceUpload({ collectionId }: ResourceUploadProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setUploadProgress(10)

    try {
      // Upload file to storage
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
      
      const uploadResult = await uploadResponse.json()
      setUploadProgress(90)
      
      // Detect file type
      let fileType: 'document' | 'video' | 'file' = 'file'
      if (file.type.startsWith('video/')) {
        fileType = 'video'
      } else if (file.type.includes('pdf') || file.type.includes('document')) {
        fileType = 'document'
      }
      
      // Create resource in database
      const result = await createResource({
        collection_id: collectionId,
        title: title || file.name.replace(/\.[^/.]+$/, ''),
        description: description || undefined,
        type: fileType,
        content_url: uploadResult.url,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type
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
      setFile(null)
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
            Upload a file to this collection
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">File</label>
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Title (optional)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave empty to use filename"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the resource"
              disabled={loading}
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
          
          <Button type="submit" disabled={loading || !file} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Resource
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}