"use client"

import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { format } from 'date-fns'
import { FileIcon, Download } from 'lucide-react'

interface MessageBubbleProps {
  message: {
    id: string
    type: 'user' | 'system'
    content: string
    created_at: string
    sender?: {
      id: string
      first_name?: string
      last_name?: string
      email: string
      role: string
    }
    attachments?: Array<{
      name: string
      url: string
      size: number
      type: string
    }>
    metadata?: Record<string, any>
  }
  isOwn: boolean
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const isSystem = message.type === 'system'
  
  const getUserInitials = () => {
    if (!message.sender) return 'S'
    if (message.sender.first_name && message.sender.last_name) {
      return `${message.sender.first_name[0]}${message.sender.last_name[0]}`.toUpperCase()
    }
    return message.sender.email[0].toUpperCase()
  }
  
  const getSenderName = () => {
    if (!message.sender) return 'System'
    if (message.sender.first_name && message.sender.last_name) {
      return `${message.sender.first_name} ${message.sender.last_name}`
    }
    return message.sender.email.split('@')[0]
  }
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }
  
  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-muted px-4 py-2 rounded-full text-sm text-muted-foreground">
          {message.content}
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isOwn && "flex-row-reverse"
    )}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className={cn(
          isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          {getUserInitials()}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(
        "flex flex-col gap-1 max-w-[70%]",
        isOwn && "items-end"
      )}>
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium">
            {getSenderName()}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.created_at), 'h:mm a')}
          </span>
        </div>
        
        <div className={cn(
          "rounded-lg px-3 py-2",
          isOwn 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted"
        )}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            {message.attachments.map((attachment, index) => (
              <a
                key={index}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:opacity-80 transition-opacity",
                  isOwn 
                    ? "bg-primary/90 text-primary-foreground" 
                    : "bg-muted"
                )}
              >
                <FileIcon className="h-4 w-4" />
                <span className="flex-1 truncate">{attachment.name}</span>
                <span className="text-xs opacity-70">
                  {formatFileSize(attachment.size)}
                </span>
                <Download className="h-3 w-3" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}