"use client"

import { User, UserPlus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip'
import { Badge } from '@/shared/components/ui/badge'
import type { Profile } from '@/shared/types'

interface AssigneeAvatarProps {
  user: Profile | null | undefined
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  onClick?: () => void
  editable?: boolean
  className?: string
  showTooltip?: boolean
  showRole?: boolean
}

export function AssigneeAvatar({
  user,
  size = 'md',
  showName = false,
  onClick,
  editable = false,
  className,
  showTooltip = true,
  showRole = false
}: AssigneeAvatarProps) {
  // Size classes
  const sizeClasses = {
    sm: {
      avatar: 'h-6 w-6',
      icon: 'h-3 w-3',
      text: 'text-xs',
      badge: 'text-xs px-1.5 py-0'
    },
    md: {
      avatar: 'h-8 w-8',
      icon: 'h-4 w-4',
      text: 'text-sm',
      badge: 'text-xs'
    },
    lg: {
      avatar: 'h-10 w-10',
      icon: 'h-5 w-5',
      text: 'text-base',
      badge: 'text-sm'
    }
  }

  const currentSize = sizeClasses[size]

  // Get role display
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', variant: 'default' as const }
      case 'team_member':
        return { label: 'Team', variant: 'secondary' as const }
      case 'client':
        return { label: 'Client', variant: 'outline' as const }
      default:
        return { label: role, variant: 'outline' as const }
    }
  }

  // Render empty state
  const renderEmptyState = () => (
    <div
      className={cn(
        currentSize.avatar,
        "rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center",
        editable && "cursor-pointer hover:border-primary hover:bg-muted transition-colors",
        className
      )}
      onClick={editable ? onClick : undefined}
      role={editable ? "button" : undefined}
      tabIndex={editable ? 0 : undefined}
      aria-label={editable ? "Assign user" : "No assignee"}
      onKeyDown={(e) => {
        if (editable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      {editable ? (
        <UserPlus className={cn(currentSize.icon, "text-muted-foreground/50")} />
      ) : (
        <User className={cn(currentSize.icon, "text-muted-foreground/50")} />
      )}
    </div>
  )

  // Render avatar
  const renderAvatar = () => {
    if (!user) {
      return renderEmptyState()
    }

    const initials = user.full_name
      ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : user.email[0].toUpperCase()

    const roleInfo = getRoleDisplay(user.role)

    const avatarContent = (
      <div className={cn("flex items-center gap-2", className)}>
        <Avatar
          className={cn(
            currentSize.avatar,
            editable && "cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all",
          )}
          onClick={editable ? onClick : undefined}
          role={editable ? "button" : undefined}
          tabIndex={editable ? 0 : undefined}
          aria-label={editable ? `Change assignee (${user.full_name || user.email})` : `Assigned to ${user.full_name || user.email}`}
          onKeyDown={(e) => {
            if (editable && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              onClick?.()
            }
          }}
        >
          <AvatarImage 
            src={user.avatar_url || undefined} 
            alt={user.full_name || user.email}
          />
          <AvatarFallback className={currentSize.text}>
            {initials}
          </AvatarFallback>
        </Avatar>
        
        {showName && (
          <div className="flex flex-col">
            <span className={cn(currentSize.text, "font-medium truncate max-w-[150px]")}>
              {user.full_name || user.email}
            </span>
            {showRole && (
              <Badge 
                variant={roleInfo.variant} 
                className={cn(currentSize.badge, "w-fit")}
              >
                {roleInfo.label}
              </Badge>
            )}
          </div>
        )}
      </div>
    )

    if (!showTooltip || showName) {
      return avatarContent
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {avatarContent}
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col gap-1">
              <div className="font-medium">{user.full_name || user.email}</div>
              {user.full_name && (
                <div className="text-xs text-muted-foreground">{user.email}</div>
              )}
              <Badge variant={roleInfo.variant} className="w-fit mt-1">
                {roleInfo.label}
              </Badge>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return renderAvatar()
}

// Compound component for showing multiple assignees
interface AssigneeAvatarGroupProps {
  users: (Profile | null | undefined)[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function AssigneeAvatarGroup({
  users,
  max = 3,
  size = 'sm',
  className
}: AssigneeAvatarGroupProps) {
  const validUsers = users.filter(Boolean) as Profile[]
  const displayUsers = validUsers.slice(0, max)
  const remainingCount = Math.max(0, validUsers.length - max)

  if (validUsers.length === 0) {
    return <AssigneeAvatar user={null} size={size} showTooltip={false} />
  }

  return (
    <div className={cn("flex -space-x-2", className)}>
      {displayUsers.map((user, index) => (
        <div
          key={user.id}
          className="relative"
          style={{ zIndex: displayUsers.length - index }}
        >
          <AssigneeAvatar
            user={user}
            size={size}
            className="ring-2 ring-background"
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full bg-muted ring-2 ring-background",
            size === 'sm' && "h-6 w-6 text-xs",
            size === 'md' && "h-8 w-8 text-sm",
            size === 'lg' && "h-10 w-10 text-base"
          )}
        >
          <span className="font-medium">+{remainingCount}</span>
        </div>
      )}
    </div>
  )
}