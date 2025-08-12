"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Send, Paperclip, X, Loader2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/shared/lib/utils'
import { createClient } from '@/shared/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import { useToast } from '@/shared/hooks/use-toast'
import { MessageTypeToggle, type MessageType } from './message-type-toggle'

interface ChatInputProps {
  onSendMessage: (content: string, attachments: any[], messageType: MessageType) => void
  disabled?: boolean
  placeholder?: string
  conversationId?: string
  currentUserId: string
  userRole?: string
  lastMessageSourceType?: MessageType
}

export function ChatInput({ 
  onSendMessage, 
  disabled, 
  placeholder,
  conversationId = 'temp-conversation-id',
  currentUserId,
  userRole,
  lastMessageSourceType
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [messageType, setMessageType] = useState<MessageType>('chat')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  
  // Auto-set message type based on last message source (only for admin/team)
  useEffect(() => {
    if (userRole !== 'client' && lastMessageSourceType && lastMessageSourceType !== 'chat') {
      setMessageType(lastMessageSourceType)
    }
  }, [lastMessageSourceType, userRole])

  // Character counter for SMS
  const SMS_LIMIT = 160
  const isOverSmsLimit = messageType === 'sms' && message.length > SMS_LIMIT
  const charsRemaining = SMS_LIMIT - message.length
  
  // Upload file directly from client
  const uploadFile = async (file: File) => {
    const supabase = createClient()
    
    // Generate unique file path
    const fileExt = file.name.split('.').pop()
    const fileName = `${currentUserId}/${conversationId}/${uuidv4()}.${fileExt}`
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      })
      return null
    }
    
    // Get signed URL (valid for 1 hour)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('chat-attachments')
      .createSignedUrl(fileName, 3600) // 1 hour expiry
    
    if (urlError) {
      console.error('Signed URL error:', urlError)
      // Fallback to public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(fileName)
      
      return {
        name: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type
      }
    }
    
    return {
      name: file.name,
      url: signedUrlData.signedUrl,
      size: file.size,
      type: file.type
    }
  }
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      setUploading(true)
      
      try {
        const uploadPromises = acceptedFiles.map(file => uploadFile(file))
        const results = await Promise.all(uploadPromises)
        
        const successful = results.filter(Boolean)
        if (successful.length > 0) {
          setAttachments(prev => [...prev, ...successful])
          
          toast({
            title: "Files uploaded",
            description: `${successful.length} file${successful.length !== 1 ? 's' : ''} uploaded successfully`,
            variant: "default"
          })
          
          if (successful.length !== acceptedFiles.length) {
            toast({
              title: "Some uploads failed",
              description: `${successful.length} of ${acceptedFiles.length} files uploaded`,
              variant: "default"
            })
          }
        }
      } catch (error) {
        console.error('Upload error:', error)
        toast({
          title: "Upload failed",
          description: "Failed to upload files",
          variant: "destructive"
        })
      } finally {
        setUploading(false)
      }
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    },
    noClick: true,
    noKeyboard: true
  })
  
  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message.trim(), attachments, messageType)
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
  
  // File input handler for button click
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    setUploading(true)
    
    try {
      const uploadPromises = files.map(file => uploadFile(file))
      const results = await Promise.all(uploadPromises)
      
      const successful = results.filter(Boolean)
      if (successful.length > 0) {
        setAttachments(prev => [...prev, ...successful])
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: "Failed to upload files",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }
  
  return (
    <div className="w-full">
      {/* Message Type Toggle - Only for admin/team */}
      {userRole !== 'client' && (
        <div className="flex items-center justify-between p-3 pb-2 border-b bg-muted/30">
          <MessageTypeToggle
            value={messageType}
            onChange={setMessageType}
            disabled={disabled}
          />
          
          {/* SMS Character Counter */}
          {messageType === 'sms' && (
            <div className={cn(
              "text-xs",
              isOverSmsLimit ? "text-red-500" : "text-muted-foreground"
            )}>
              {isOverSmsLimit ? (
                <>
                  <span className="font-medium">{Math.abs(charsRemaining)}</span> over limit
                </>
              ) : (
                <>
                  <span className="font-medium">{charsRemaining}</span> remaining
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Over limit warning - Only for admin/team */}
      {userRole !== 'client' && isOverSmsLimit && (
        <div className="text-xs text-amber-600 bg-amber-50 p-2 border-b">
          Message will be truncated to {SMS_LIMIT} characters with a "See full message" link.
        </div>
      )}
      
      {attachments.length > 0 && (
        <div className="flex gap-1 sm:gap-2 p-2 border-b flex-wrap bg-muted/30">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-2 py-1 bg-background border rounded-md text-xs"
            >
              <Paperclip className="h-3 w-3 flex-shrink-0" />
              <span className="max-w-[80px] sm:max-w-[120px] md:max-w-[150px] truncate">{attachment.name}</span>
              <button
                onClick={() => removeAttachment(index)}
                className="ml-1 hover:text-destructive flex-shrink-0"
                disabled={uploading}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div {...getRootProps()} className={cn(
        "flex gap-2 p-3 sm:p-4 relative",
        isDragActive && "bg-muted/50"
      )}>
        <input {...getInputProps()} />
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.txt,.csv"
        />
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
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