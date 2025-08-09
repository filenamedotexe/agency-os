/**
 * Centralized validation schemas and utilities
 */

import * as z from "zod"

// Email validation
export const emailSchema = z.string().email("Invalid email address")

// Password validation
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  )

// Simple password for client creation (less strict)
export const simplePasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")

// Phone number validation
export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true
      const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/
      return phoneRegex.test(val)
    },
    { message: "Invalid phone number format" }
  )

// URL validation that allows empty or valid URLs
export const urlSchema = z.string().transform((val) => val.trim()).refine(
  (val) => {
    if (!val) return true
    try {
      const urlToTest = val.match(/^https?:\/\//) ? val : `https://${val}`
      new URL(urlToTest)
      return true
    } catch {
      return false
    }
  },
  { message: "Invalid URL format" }
)

// Social media URL validators
export const linkedinUrlSchema = z.string().transform((val) => val.trim()).refine(
  (val) => {
    if (!val) return true
    return val.includes('linkedin.com/') || val.includes('linkedin.com')
  },
  { message: "Invalid LinkedIn URL" }
)

export const twitterUrlSchema = z.string().transform((val) => val.trim()).refine(
  (val) => {
    if (!val) return true
    return val.includes('twitter.com/') || val.includes('x.com/')
  },
  { message: "Invalid Twitter/X URL" }
)

// Name validation
export const nameSchema = z
  .string()
  .min(1, "This field is required")
  .max(50, "Maximum 50 characters")

// Company validation
export const companyNameSchema = z
  .string()
  .min(1, "Company name is required")
  .max(100, "Maximum 100 characters")

// Industry options
export const INDUSTRY_OPTIONS = [
  { value: "technology", label: "Technology" },
  { value: "finance", label: "Finance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "retail", label: "Retail" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "education", label: "Education" },
  { value: "real-estate", label: "Real Estate" },
  { value: "consulting", label: "Consulting" },
  { value: "other", label: "Other" },
] as const

// Company size options
export const COMPANY_SIZE_OPTIONS = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "500+", label: "500+ employees" },
] as const

// User role options
export const USER_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "team_member", label: "Team Member" },
  { value: "client", label: "Client" },
] as const

/**
 * Format phone number as user types
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-numeric characters except +
  const cleaned = value.replace(/[^\d+]/g, '')
  
  // Format based on length
  if (cleaned.startsWith('+1')) {
    // US/Canada format: +1 (XXX) XXX-XXXX
    const match = cleaned.match(/^(\+1)(\d{0,3})(\d{0,3})(\d{0,4})/)
    if (match) {
      const parts = [match[1]]
      if (match[2]) parts.push(`(${match[2]}`)
      if (match[3]) parts.push(`) ${match[3]}`)
      if (match[4]) parts.push(`-${match[4]}`)
      return parts.join('')
    }
  } else if (cleaned.startsWith('+')) {
    // International format
    return cleaned
  } else if (cleaned.length <= 10) {
    // US format without country code: (XXX) XXX-XXXX
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})/)
    if (match) {
      const parts = []
      if (match[1]) parts.push(`(${match[1]}`)
      if (match[2]) parts.push(`) ${match[2]}`)
      if (match[3]) parts.push(`-${match[3]}`)
      return parts.join('')
    }
  }
  
  return value
}

/**
 * Auto-prepend https:// to URLs if needed
 */
export function formatUrl(value: string): string {
  if (!value) return value
  if (!value.match(/^https?:\/\//)) {
    return `https://${value}`
  }
  return value
}