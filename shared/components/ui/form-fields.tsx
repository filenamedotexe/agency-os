"use client"

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { formatPhoneNumber, formatUrl } from "@/shared/lib/validations"
import { Globe, Mail, Linkedin, Twitter, Facebook, Instagram } from "lucide-react"
import type { Control } from "react-hook-form"
import { designSystem as ds } from "@/shared/lib/design-system"

interface BaseFieldProps {
  control: Control<any>
  name: string
  label: string
  placeholder?: string
  description?: string
  required?: boolean
}

interface TextFieldProps extends BaseFieldProps {
  type?: "text" | "email" | "password"
  icon?: React.ReactNode
}

interface SelectFieldProps extends BaseFieldProps {
  options: { value: string; label: string }[]
}

export function TextField({ control, name, label, placeholder, description, type = "text", icon }: TextFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {icon ? (
              <div className="relative">
                <div className="absolute left-2 top-3 sm:p-4.5 h-4 w-4 text-muted-foreground">
                  {icon}
                </div>
                <Input
                  type={type}
                  placeholder={placeholder}
                  className="pl-8"
                  {...field}
                />
              </div>
            ) : (
              <Input
                type={type}
                placeholder={placeholder}
                {...field}
              />
            )}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function PhoneField({ control, name, label, placeholder = "+1 (555) 123-4567", description = "International format supported" }: BaseFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              {...field}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value)
                field.onChange(formatted)
              }}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function UrlField({ control, name, label, placeholder, description, icon = <Globe /> }: TextFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <div className="absolute left-2 top-3 sm:p-4.5 h-4 w-4 text-muted-foreground">
                {icon}
              </div>
              <Input
                placeholder={placeholder}
                className="pl-8"
                {...field}
                onBlur={(e) => {
                  const value = e.target.value
                  if (value && !value.match(/^https?:\/\//)) {
                    field.onChange(`https://${value}`)
                  }
                }}
              />
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function TextAreaField({ control, name, label, placeholder, description }: BaseFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              className="resize-none"
              {...field}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function SelectField({ control, name, label, placeholder = "Select an option", options, description }: SelectFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Social media specific fields
export function LinkedInField({ control, name = "linkedin_url" }: Omit<BaseFieldProps, "label">) {
  return (
    <UrlField
      control={control}
      name={name}
      label="LinkedIn"
      placeholder="linkedin.com/company/..."
      icon={<Linkedin />}
    />
  )
}

export function TwitterField({ control, name = "twitter_url" }: Omit<BaseFieldProps, "label">) {
  return (
    <UrlField
      control={control}
      name={name}
      label="Twitter/X"
      placeholder="twitter.com/..."
      icon={<Twitter />}
    />
  )
}

export function FacebookField({ control, name = "facebook_url" }: Omit<BaseFieldProps, "label">) {
  return (
    <UrlField
      control={control}
      name={name}
      label="Facebook"
      placeholder="facebook.com/..."
      icon={<Facebook />}
    />
  )
}

export function InstagramField({ control, name = "instagram_url" }: Omit<BaseFieldProps, "label">) {
  return (
    <UrlField
      control={control}
      name={name}
      label="Instagram"
      placeholder="instagram.com/..."
      icon={<Instagram />}
    />
  )
}