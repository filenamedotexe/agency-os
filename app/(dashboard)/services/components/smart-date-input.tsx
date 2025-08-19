"use client"

import { useState, useEffect } from 'react'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Calendar, Clock, Check, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { parseRelativeDateString, generateDateSuggestions } from '@/shared/lib/smart-dates'
import type { DateSuggestion } from '@/shared/types'

interface SmartDateInputProps {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  description?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function SmartDateInput({
  label,
  placeholder = "e.g., 1 week, 2 months, same day",
  value = "",
  onChange,
  description,
  required,
  disabled,
  className
}: SmartDateInputProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [suggestions] = useState<DateSuggestion[]>(generateDateSuggestions())
  
  useEffect(() => {
    setInputValue(value)
  }, [value])
  
  useEffect(() => {
    if (inputValue.trim() === '') {
      setIsValid(null)
      return
    }
    
    const parsed = parseRelativeDateString(inputValue)
    setIsValid(parsed !== null)
  }, [inputValue])
  
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
    onChange?.(newValue)
  }
  
  const handleSuggestionSelect = (suggestion: DateSuggestion) => {
    setInputValue(suggestion.value)
    onChange?.(suggestion.value)
    setOpen(false)
  }
  
  const getValidationIcon = () => {
    if (isValid === null) return null
    
    return isValid ? (
      <Check className="h-4 w-4 text-green-600" />
    ) : (
      <X className="h-4 w-4 text-red-600" />
    )
  }
  
  const getValidationMessage = () => {
    if (isValid === null || isValid) return null
    
    return (
      <p className="text-xs text-red-600 mt-1">
        Invalid format. Try "1 week", "2 months", or "same day"
      </p>
    )
  }
  
  const formatPreview = () => {
    if (!inputValue.trim() || !isValid) return null
    
    const parsed = parseRelativeDateString(inputValue)
    if (!parsed) return null
    
    let preview = ""
    if (parsed.total_days === 0) {
      preview = "Same day"
    } else if (parsed.total_days === 1) {
      preview = "1 day"
    } else {
      preview = `${parsed.total_days} days`
    }
    
    return (
      <Badge variant="outline" className="text-xs">
        <Clock className="h-3 w-3 mr-1" />
        {preview}
      </Badge>
    )
  }
  
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Input
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                className={cn(
                  "pr-20",
                  isValid === false && "border-red-500 focus-visible:ring-red-500",
                  isValid === true && "border-green-500 focus-visible:ring-green-500"
                )}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {getValidationIcon()}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setOpen(!open)}
                  disabled={disabled}
                >
                  <Calendar className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="start">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-2">Quick Suggestions</h4>
                <div className="grid grid-cols-2 gap-2">
                  {suggestions.map((suggestion) => (
                    <Button
                      key={suggestion.value}
                      variant="outline"
                      size="sm"
                      className="justify-start text-left h-auto p-2"
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      <div>
                        <div className="font-medium text-xs">{suggestion.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {suggestion.days === 0 ? 'Same day' : `${suggestion.days} days`}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground">
                  <strong>Examples:</strong> "1 week", "2 months", "3 days later", "same day"
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          {getValidationMessage()}
          {description && !getValidationMessage() && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {formatPreview()}
      </div>
    </div>
  )
}