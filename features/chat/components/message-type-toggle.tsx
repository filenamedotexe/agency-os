"use client"

import { MessageCircle, Phone, Mail } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

export type MessageType = 'chat' | 'sms' | 'email'

interface MessageTypeToggleProps {
  value: MessageType
  onChange: (type: MessageType) => void
  disabled?: boolean
  className?: string
}

const messageTypes = [
  { value: 'chat' as const, icon: MessageCircle, label: 'Chat' },
  { value: 'sms' as const, icon: Phone, label: 'SMS' },
  { value: 'email' as const, icon: Mail, label: 'Email' }
]

export function MessageTypeToggle({ 
  value, 
  onChange, 
  disabled = false,
  className 
}: MessageTypeToggleProps) {
  return (
    <div className={cn("flex rounded-lg border p-1", className)}>
      {messageTypes.map(({ value: type, icon: Icon, label }) => (
        <Button
          key={type}
          variant={value === type ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(type)}
          disabled={disabled}
          className={cn(
            "flex items-center gap-1 text-xs h-7 px-2",
            value === type 
              ? "bg-primary text-primary-foreground" 
              : "hover:bg-muted"
          )}
        >
          <Icon className="h-3 w-3" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  )
}