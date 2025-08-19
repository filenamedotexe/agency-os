"use client"

import { useState, useMemo } from 'react'
import { Check, ChevronsUpDown, X, Search, User } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import type { Profile, AssignableUser } from '@/shared/types'

interface AssigneeSelectorProps {
  value: string | null | undefined
  onChange: (userId: string | null) => void
  users: AssignableUser[]
  allowClient?: boolean
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  className?: string
}

export function AssigneeSelector({
  value,
  onChange,
  users,
  allowClient = false,
  placeholder = "Select assignee...",
  disabled = false,
  loading = false,
  className
}: AssigneeSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  // Filter users based on allowClient setting
  const availableUsers = useMemo(() => {
    if (allowClient) {
      return users
    }
    return users.filter(user => user.role !== 'client')
  }, [users, allowClient])

  // Filter by search
  const filteredUsers = useMemo(() => {
    if (!search) return availableUsers
    
    const searchLower = search.toLowerCase()
    return availableUsers.filter(user => 
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    )
  }, [availableUsers, search])

  // Get selected user
  const selectedUser = users.find(user => user.id === value)

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default'
      case 'team_member':
        return 'secondary'
      case 'client':
        return 'outline'
      default:
        return 'outline'
    }
  }

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'team_member':
        return 'Team'
      case 'client':
        return 'Client'
      default:
        return role
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select assignee"
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled || loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading...
            </span>
          ) : selectedUser ? (
            <span className="flex items-center gap-2 truncate">
              <Avatar className="h-5 w-5">
                <AvatarImage src={selectedUser.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {selectedUser.full_name?.[0] || selectedUser.email[0]}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedUser.full_name || selectedUser.email}</span>
              <Badge variant={getRoleBadgeVariant(selectedUser.role)} className="ml-auto">
                {getRoleDisplayName(selectedUser.role)}
              </Badge>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {placeholder}
            </span>
          )}
          <div className="ml-2 flex items-center gap-1">
            {value && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(null)
                }}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  onSelect={() => {
                    onChange(null)
                    setOpen(false)
                  }}
                  className="text-muted-foreground"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear selection
                </CommandItem>
              )}
              {filteredUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? null : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === user.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Avatar className="mr-2 h-6 w-6">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {user.full_name?.[0] || user.email[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 truncate">
                    <div className="font-medium truncate">
                      {user.full_name || user.email}
                    </div>
                    {user.full_name && (
                      <div className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </div>
                    )}
                  </div>
                  <Badge variant={getRoleBadgeVariant(user.role)} className="ml-2">
                    {getRoleDisplayName(user.role)}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}