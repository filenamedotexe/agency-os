"use client"

import { useState, useRef } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Send, Paperclip, X } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { uploadAttachment } from '@/app/actions/chat'
import { cn } from '@/shared/lib/utils'

interface ChatInputProps {
  onSendMessage: (content: string, attachments: any[]) => void
  disabled?: boolean
  placeholder?: string
  conversationId?: string
}

export function ChatInput({ 
  onSendMessage, 
  disabled, 
  placeholder,
  conversationId = 'temp-conversation-id' 
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      setUploading(true)
      
      for (const file of acceptedFiles) {
        const { attachment, error } = await uploadAttachment(
          file,
          conversationId
        )
        
        if (attachment) {
          setAttachments(prev => [...prev, attachment])
        }
      }
      
      setUploading(false)
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    noClick: true,
    noKeyboard: true
  })
  
  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message.trim(), attachments)
      setMessage('')
      setAttachments([])
      textareaRef.current?.focus()
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }
  
  return (
    <div className="border-t">
      {attachments.length > 0 && (
        <div className="flex gap-2 p-2 border-b flex-wrap">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
            >
              <Paperclip className="h-3 w-3" />
              <span className="max-w-[150px] truncate">{attachment.name}</span>
              <button
                onClick={() => removeAttachment(index)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div {...getRootProps()} className={cn(
        "flex gap-2 p-3 relative",
        isDragActive && "bg-muted/50"
      )}>
        <input {...getInputProps()} />
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          disabled={uploading}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || uploading}
          className="min-h-[40px] max-h-[120px] resize-none"
          rows={1}
        />
        
        <Button
          onClick={handleSend}
          disabled={disabled || uploading || (!message.trim() && attachments.length === 0)}
          size="icon"
          className="flex-shrink-0"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
        
        {isDragActive && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="text-lg font-medium">Drop files here</div>
          </div>
        )}
      </div>
    </div>
  )
}