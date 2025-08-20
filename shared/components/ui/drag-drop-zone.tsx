"use client"

import { useState, useRef, DragEvent } from 'react'
import { Button } from './button'
import { Upload, X, FileText, Video, Image as ImageIcon, File } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface AttachedFile {
  file: File
  preview: string | null
  type: 'image' | 'video' | 'document' | 'file'
}

interface DragDropZoneProps {
  onFilesChange: (files: File[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
  className?: string
  disabled?: boolean
}

export function DragDropZone({ 
  onFilesChange, 
  maxFiles = 5, 
  acceptedTypes = [], 
  className,
  disabled = false
}: DragDropZoneProps) {
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileType = (file: File): 'image' | 'video' | 'document' | 'file' => {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) return 'document'
    return 'file'
  }

  const getFileIcon = (type: 'image' | 'video' | 'document' | 'file') => {
    switch (type) {
      case 'image': return <ImageIcon className="h-4 w-4" />
      case 'video': return <Video className="h-4 w-4" />
      case 'document': return <FileText className="h-4 w-4" />
      default: return <File className="h-4 w-4" />
    }
  }

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    if (attachedFiles.length + fileArray.length > maxFiles) {
      return
    }

    const newAttachedFiles: AttachedFile[] = []
    
    for (const file of fileArray) {
      const type = getFileType(file)
      let preview: string | null = null
      
      // Create preview for images and videos
      if (type === 'image' || type === 'video') {
        preview = URL.createObjectURL(file)
      }
      
      newAttachedFiles.push({ file, preview, type })
    }
    
    const updatedFiles = [...attachedFiles, ...newAttachedFiles]
    setAttachedFiles(updatedFiles)
    onFilesChange(updatedFiles.map(af => af.file))
  }

  const removeFile = (index: number) => {
    const updatedFiles = attachedFiles.filter((_, i) => i !== index)
    
    // Clean up preview URLs
    const removed = attachedFiles[index]
    if (removed.preview) {
      URL.revokeObjectURL(removed.preview)
    }
    
    setAttachedFiles(updatedFiles)
    onFilesChange(updatedFiles.map(af => af.file))
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFiles(files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      processFiles(files)
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drag & Drop Zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-all",
          isDragOver 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-2">
          <Upload className={cn(
            "h-8 w-8 transition-colors",
            isDragOver ? "text-primary" : "text-muted-foreground"
          )} />
          
          <div>
            <p className="text-sm sm:text-base font-medium">
              {isDragOver ? 'Drop files here' : 'Drag & drop files or click to browse'}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Supports images, videos, documents, and more
            </p>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            type="button"
          >
            Browse Files
          </Button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept={acceptedTypes.join(',')}
          disabled={disabled}
        />
      </div>

      {/* Attached Files Preview */}
      {attachedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Attached Files ({attachedFiles.length})</h4>
          <div className="grid gap-2">
            {attachedFiles.map((attachedFile, index) => (
              <div
                key={index}
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg bg-muted/30"
              >
                {/* File preview */}
                {attachedFile.type === 'image' && attachedFile.preview ? (
                  <img 
                    src={attachedFile.preview} 
                    alt={attachedFile.file.name}
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : attachedFile.type === 'video' && attachedFile.preview ? (
                  <video 
                    src={attachedFile.preview}
                    className="h-10 w-10 object-cover rounded"
                    muted
                  />
                ) : (
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                    {getFileIcon(attachedFile.type)}
                  </div>
                )}
                
                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachedFile.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachedFile.file.size)} • {attachedFile.type}
                  </p>
                </div>
                
                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={disabled}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}