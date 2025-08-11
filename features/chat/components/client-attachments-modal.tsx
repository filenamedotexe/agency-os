"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { 
  Paperclip, 
  Download, 
  Calendar, 
  FileText, 
  Image, 
  File,
  User,
  Clock,
  Grid3X3,
  List,
  Eye
} from 'lucide-react'
import { getClientAttachments } from '@/app/actions/chat'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/shared/lib/utils'
import { FilePreviewModal } from './file-preview-modal'

interface ClientAttachmentsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
}

interface Attachment {
  name: string
  url: string
  size: number
  type: string
  messageId: string
  conversationId: string
  uploadedAt: string
  uploadedBy: {
    id: string
    first_name: string
    last_name: string
    role: string
  }
  messageContent: string
}

export function ClientAttachmentsModal({ 
  open, 
  onOpenChange, 
  clientId, 
  clientName 
}: ClientAttachmentsModalProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<'all' | 'images' | 'documents' | 'other'>('all')
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (open && clientId) {
      loadAttachments()
    }
  }, [open, clientId])

  const loadAttachments = async () => {
    setLoading(true)
    try {
      const result = await getClientAttachments(clientId)
      if (result.attachments) {
        setAttachments(result.attachments)
      }
    } catch (error) {
      console.error('Error loading attachments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const getFileTypeColor = (type: string) => {
    if (type.startsWith('image/')) return 'bg-green-100 text-green-800'
    if (type.includes('pdf')) return 'bg-red-100 text-red-800'
    if (type.includes('document') || type.includes('word')) return 'bg-blue-100 text-blue-800'
    if (type.includes('text')) return 'bg-gray-100 text-gray-800'
    return 'bg-purple-100 text-purple-800'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handlePreview = (attachment: Attachment) => {
    setPreviewFile(attachment)
    setShowPreview(true)
  }

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a')
    link.href = attachment.url
    link.download = attachment.name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredAttachments = attachments.filter(attachment => {
    if (filterType === 'all') return true
    if (filterType === 'images') return attachment.type.startsWith('image/')
    if (filterType === 'documents') return attachment.type.includes('pdf') || attachment.type.includes('document') || attachment.type.includes('text')
    if (filterType === 'other') return !attachment.type.startsWith('image/') && !attachment.type.includes('pdf') && !attachment.type.includes('document') && !attachment.type.includes('text')
    return true
  })

  const groupedAttachments = filteredAttachments.reduce((groups, attachment) => {
    const date = new Date(attachment.uploadedAt).toDateString()
    if (!groups[date]) groups[date] = []
    groups[date].push(attachment)
    return groups
  }, {} as Record<string, Attachment[]>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] w-[95vw] sm:w-full flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Paperclip className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="truncate">{clientName} - Attachments ({attachments.length})</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            View and manage all file attachments for {clientName}. Use filters to organize by file type and view options to switch between grid and list layouts.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 border-b gap-3">
          <Tabs value={filterType} onValueChange={(value) => setFilterType(value as any)} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                All ({attachments.length})
              </TabsTrigger>
              <TabsTrigger value="images" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Images</span>
                <span className="sm:hidden">Img</span> ({attachments.filter(a => a.type.startsWith('image/')).length})
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Documents</span>
                <span className="sm:hidden">Docs</span> ({attachments.filter(a => a.type.includes('pdf') || a.type.includes('document') || a.type.includes('text')).length})
              </TabsTrigger>
              <TabsTrigger value="other" className="text-xs sm:text-sm">Other</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-1 w-full sm:w-auto justify-end">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="flex-1 sm:flex-none"
            >
              <Grid3X3 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Grid</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex-1 sm:flex-none"
            >
              <List className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">List</span>
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin">
                <Paperclip className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-muted-foreground font-medium">Loading attachments...</p>
                <p className="text-xs text-muted-foreground mt-1">Fetching files from database</p>
              </div>
            </div>
          ) : filteredAttachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No attachments found</p>
              <p className="text-xs mt-1">Files will appear here once uploaded</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="space-y-6 p-4">
              {Object.entries(groupedAttachments).map(([date, dateAttachments]) => (
                <div key={date}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {date}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {dateAttachments.map((attachment, index) => (
                      <div
                        key={`${attachment.messageId}-${index}`}
                        className="border rounded-lg p-3 hover:bg-muted/50 transition-colors flex flex-col h-full"
                      >
                        {/* Header with icon and file info */}
                        <div className="flex items-start gap-2 mb-3">
                          {getFileIcon(attachment.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" title={attachment.name}>
                              {attachment.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.size)}
                            </p>
                          </div>
                        </div>
                        
                        {/* File type badge */}
                        <div className="mb-3">
                          <Badge className={cn("text-xs", getFileTypeColor(attachment.type))}>
                            {attachment.type.split('/')[1]?.toUpperCase() || 'FILE'}
                          </Badge>
                        </div>
                        
                        {/* Metadata */}
                        <div className="space-y-1 mb-3 flex-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{attachment.uploadedBy.first_name} {attachment.uploadedBy.last_name}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{formatDistanceToNow(new Date(attachment.uploadedAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                        
                        {/* Action buttons - always at bottom */}
                        <div className="flex gap-2 mt-auto">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs min-w-0"
                            onClick={() => handlePreview(attachment)}
                          >
                            <Eye className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">Preview</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs min-w-0"
                            onClick={() => handleDownload(attachment)}
                          >
                            <Download className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">Download</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6 p-4">
              {Object.entries(groupedAttachments).map(([date, dateAttachments]) => (
                <div key={date}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {date}
                  </h4>
                  <div className="space-y-2">
                    {dateAttachments.map((attachment, index) => (
                      <div
                        key={`${attachment.messageId}-${index}`}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {/* File icon and main info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            {getFileIcon(attachment.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium truncate" title={attachment.name}>
                                {attachment.name}
                              </p>
                              <Badge className={cn("text-xs flex-shrink-0", getFileTypeColor(attachment.type))}>
                                {attachment.type.split('/')[1]?.toUpperCase() || 'FILE'}
                              </Badge>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex-shrink-0">{formatFileSize(attachment.size)}</span>
                              <span className="flex items-center gap-1 min-w-0">
                                <User className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{attachment.uploadedBy.first_name} {attachment.uploadedBy.last_name}</span>
                              </span>
                              <span className="flex items-center gap-1 min-w-0">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{formatDistanceToNow(new Date(attachment.uploadedAt), { addSuffix: true })}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreview(attachment)}
                            title="Preview file"
                            className="px-2 sm:px-3"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Preview {attachment.name}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(attachment)}
                            title="Download file"
                            className="px-2 sm:px-3"
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download {attachment.name}</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>

      <FilePreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        file={previewFile}
      />
    </Dialog>
  )
}