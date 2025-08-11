"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { 
  Eye, 
  Download, 
  X,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  File,
  ExternalLink,
  Maximize2,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface FilePreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: {
    name: string
    url: string
    type: string
    size: number
    uploadedBy: {
      first_name: string
      last_name: string
    }
    uploadedAt: string
    messageContent: string
  } | null
}

export function FilePreviewModal({ open, onOpenChange, file }: FilePreviewModalProps) {
  const [imageZoom, setImageZoom] = useState(1)
  const [error, setError] = useState(false)

  if (!file) return null

  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')
  const isAudio = file.type.startsWith('audio/')
  const isPDF = file.type === 'application/pdf'
  const isText = file.type.startsWith('text/') || file.type.includes('json')
  const isDoc = file.type.includes('document') || file.type.includes('word') || file.type.includes('sheet') || file.type.includes('presentation')

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-5 w-5" />
    if (isVideo) return <Video className="h-5 w-5" />
    if (isAudio) return <Music className="h-5 w-5" />
    if (isPDF || isDoc) return <FileText className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderPreview = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <File className="h-16 w-16 mb-4 opacity-50" />
          <p className="font-medium">Cannot preview this file</p>
          <p className="text-sm">File type not supported for preview</p>
        </div>
      )
    }

    if (isImage) {
      return (
        <div className="relative flex items-center justify-center bg-black/5 rounded-lg min-h-[400px] overflow-hidden">
          <div className="relative">
            <img 
              src={file.url}
              alt={file.name}
              className="max-w-full max-h-[70vh] object-contain"
              style={{ transform: `scale(${imageZoom})` }}
              onError={() => setError(true)}
            />
          </div>
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.25))}
              disabled={imageZoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setImageZoom(Math.min(3, imageZoom + 0.25))}
              disabled={imageZoom >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(file.url, '_blank')}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )
    }

    if (isVideo) {
      return (
        <div className="relative flex items-center justify-center bg-black rounded-lg min-h-[400px]">
          <video 
            controls 
            className="max-w-full max-h-[70vh]"
            onError={() => setError(true)}
          >
            <source src={file.url} type={file.type} />
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    if (isAudio) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Music className="h-16 w-16 mb-4 text-muted-foreground" />
          <audio 
            controls 
            className="w-full max-w-md"
            onError={() => setError(true)}
          >
            <source src={file.url} type={file.type} />
            Your browser does not support the audio tag.
          </audio>
        </div>
      )
    }

    if (isPDF) {
      return (
        <div className="relative bg-gray-50 rounded-lg min-h-[600px]">
          <iframe
            src={file.url}
            className="w-full h-[600px] rounded-lg"
            title={file.name}
            onError={() => setError(true)}
          />
          <div className="absolute top-2 right-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(file.url, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open PDF
            </Button>
          </div>
        </div>
      )
    }

    if (isText) {
      return (
        <div className="relative">
          <div className="bg-gray-50 rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-auto">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              <TextFilePreview url={file.url} />
            </pre>
          </div>
          <div className="absolute top-2 right-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(file.url, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )
    }

    if (isDoc) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="h-16 w-16 mb-4 text-muted-foreground" />
          <p className="font-medium mb-2">Document Preview</p>
          <p className="text-sm text-muted-foreground mb-4">
            This document type requires external application to view
          </p>
          <Button
            variant="outline"
            onClick={() => window.open(file.url, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <File className="h-16 w-16 mb-4 opacity-50" />
        <p className="font-medium">Preview not available</p>
        <p className="text-sm">File type: {file.type}</p>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw] sm:w-full flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-base sm:text-lg">
            {getFileIcon()}
            <div className="flex-1 min-w-0">
              <span className="truncate block">{file.name}</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
                <span className="text-xs text-muted-foreground">
                  by {file.uploadedBy.first_name} {file.uploadedBy.last_name}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            File preview dialog for {file.name}. Use download button to save the file or view the preview below.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="py-4">
            {renderPreview()}
          </div>
        </ScrollArea>

        {file.messageContent && (
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Message context:</span> {file.messageContent}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Component to fetch and display text file content
function TextFilePreview({ url }: { url: string }) {
  const [content, setContent] = useState<string>('Loading...')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setContent('Loading...')
    
    // Try multiple approaches to fetch text content
    const fetchContent = async () => {
      try {
        // First try direct fetch
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'text/plain, text/*, */*'
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const text = await response.text()
        setContent(text || 'File appears to be empty')
      } catch (error) {
        console.error('Text preview fetch error:', error)
        
        // Fallback: show error with helpful message
        setContent(`Unable to preview text content.

Reason: ${error instanceof Error ? error.message : 'Unknown error'}

Please download the file to view its contents.`)
      } finally {
        setLoading(false)
      }
    }
    
    fetchContent()
  }, [url])

  if (loading) {
    return 'Loading file content...'
  }

  return content
}