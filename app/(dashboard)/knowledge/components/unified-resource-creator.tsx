"use client"

import { useState } from 'react'
import { createResource } from '@/app/actions/knowledge'

// Utility function to format file sizes
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { RichTextEditor } from '@/shared/components/ui/rich-text-editor'
import { DragDropZone } from '@/shared/components/ui/drag-drop-zone'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { Plus, Loader2, Send } from 'lucide-react'
import { useToast } from '@/shared/hooks/use-toast'

interface UnifiedResourceCreatorProps {
  collectionId: string
  userRole?: 'admin' | 'team_member' | 'client'
}

export function UnifiedResourceCreator({ collectionId, userRole = 'client' }: UnifiedResourceCreatorProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState<string>('')
  const [uploadedBytes, setUploadedBytes] = useState(0)
  const [totalBytes, setTotalBytes] = useState(0)
  const [title, setTitle] = useState('')
  const [richContent, setRichContent] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation - need either content or files
    if (!title.trim() && !richContent.trim() && attachedFiles.length === 0) {
      toast({
        title: "Content Required",
        description: "Please add a title, content, or attach files",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setUploadProgress(10)

    // Calculate total bytes for all files
    const totalFileBytes = attachedFiles.reduce((sum, file) => sum + file.size, 0)
    setTotalBytes(totalFileBytes)
    setUploadedBytes(0)

    try {
      const resources = []
      
      // Handle file uploads first
      if (attachedFiles.length > 0) {
        for (const [index, file] of attachedFiles.entries()) {
          setCurrentFile(file.name)
          const baseProgress = 20 + (index / attachedFiles.length) * 50
          setUploadProgress(baseProgress)
          
          const formData = new FormData()
          formData.append('file', file)
          formData.append('collectionId', collectionId)
          
          const uploadResponse = await fetch('/api/knowledge/upload', {
            method: 'POST',
            body: formData
          })
          
          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload ${file.name}`)
          }
          
          const uploadResult = await uploadResponse.json()
          
          // Detect file type
          let fileType: 'document' | 'video' | 'file' = 'file'
          if (file.type.startsWith('video/')) {
            fileType = 'video'
          } else if (file.type.includes('pdf') || file.type.includes('document')) {
            fileType = 'document'
          }
          
          // Create file resource
          const fileResource = await createResource({
            collection_id: collectionId,
            title: file.name.replace(/\.[^/.]+$/, ''),
            description: `Attached file: ${file.name}`,
            rich_description: richContent || undefined,
            type: fileType,
            content_url: uploadResult.url,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type
          })
          
          if (fileResource.error) {
            throw new Error(`Failed to create resource for ${file.name}`)
          }
          
          resources.push(fileResource.resource)
        }
      }
      
      // Create text-based resource if we have content but no title was used for files
      if ((title.trim() || richContent.trim()) && (attachedFiles.length === 0 || title.trim())) {
        setUploadProgress(80)
        
        const textResource = await createResource({
          collection_id: collectionId,
          title: title.trim() || 'Untitled Note',
          description: undefined,
          rich_description: richContent || undefined,
          type: 'note',
          content_url: null,
          file_name: null,
          file_size: null,
          mime_type: null
        })
        
        if (textResource.error) {
          throw new Error('Failed to create text resource')
        }
        
        resources.push(textResource.resource)
      }
      
      setUploadProgress(100)
      
      toast({
        title: "Success",
        description: `Created ${resources.length} resource${resources.length === 1 ? '' : 's'} successfully`
      })
      
      // Reset form
      setTitle('')
      setRichContent('')
      setAttachedFiles([])
      setOpen(false)
      
    } catch (error) {
      console.error('Creation error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create resource',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setUploadProgress(0)
      setCurrentFile('')
      setUploadedBytes(0)
      setTotalBytes(0)
    }
  }

  const handleFilesChange = (files: File[]) => {
    setAttachedFiles(files)
  }

  const hasContent = title.trim() || richContent.trim() || attachedFiles.length > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Resource</DialogTitle>
          <DialogDescription>
            Write content, attach files, or both - it&apos;s all in one place
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Title Input */}
          <div>
            <label className="text-sm font-medium block mb-2">
              Title {attachedFiles.length === 0 ? '(optional)' : ''}
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your resource a title..."
              disabled={loading}
              className="text-base"
            />
          </div>

          {/* Rich Text Editor */}
          <div>
            <label className="text-sm font-medium block mb-2">Content</label>
            <RichTextEditor
              content={richContent}
              onChange={setRichContent}
              placeholder="Start writing or drag files here..."
              editable={!loading}
              minimal={false}
              userRole={userRole}
              className="min-h-[200px] sm:min-h-[300px]"
            />
          </div>

          {/* File Attachments */}
          <div>
            <label className="text-sm font-medium block mb-2">Attachments</label>
            <DragDropZone
              onFilesChange={handleFilesChange}
              maxFiles={10}
              disabled={loading}
            />
          </div>

          {/* Enhanced Progress Bar */}
          {loading && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">
                    {uploadProgress < 50 ? 'Uploading files...' : 'Creating resources...'}
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div 
                    className="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
              
              {currentFile && (
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="truncate max-w-[200px] font-medium">
                      📄 {currentFile}
                    </span>
                    {totalBytes > 0 && (
                      <span className="text-muted-foreground">
                        {formatFileSize(uploadedBytes)} / {formatFileSize(totalBytes)}
                      </span>
                    )}
                  </div>
                  {attachedFiles.length > 1 && (
                    <div className="text-muted-foreground">
                      Processing {attachedFiles.findIndex(f => f.name === currentFile) + 1} of {attachedFiles.length} files
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              disabled={!hasContent || loading}
              className="min-w-32"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create Resource
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}