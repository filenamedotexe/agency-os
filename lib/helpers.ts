import { format, formatDistanceToNow, isAfter, isBefore } from "date-fns"

/**
 * Format a date string into a readable format
 */
export function formatDate(date: string | Date, formatStr: string = "MMM d, yyyy"): string {
  if (!date) return ""
  const dateObj = typeof date === "string" ? new Date(date) : date
  return format(dateObj, formatStr)
}

/**
 * Format a date as time ago (e.g., "2 hours ago")
 */
export function formatTimeAgo(date: string | Date): string {
  if (!date) return ""
  const dateObj = typeof date === "string" ? new Date(date) : date
  return formatDistanceToNow(dateObj, { addSuffix: true })
}

/**
 * Check if a task/milestone is overdue
 */
export function isOverdue(dueDate: string | null, status?: string): boolean {
  if (!dueDate || status === "completed") return false
  return isBefore(new Date(dueDate), new Date())
}

/**
 * Get initials from a name
 */
export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.[0]?.toUpperCase() || ""
  const last = lastName?.[0]?.toUpperCase() || ""
  return first + last || "?"
}

/**
 * Get full name from parts
 */
export function getFullName(firstName?: string | null, lastName?: string | null): string {
  const parts = [firstName, lastName].filter(Boolean)
  return parts.join(" ") || "Unknown"
}

/**
 * Format currency
 */
export function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  if (isNaN(num)) return "$0"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num)
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Pluralize a word based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return `${count} ${singular}`
  return `${count} ${plural || singular + "s"}`
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

/**
 * Get status badge variant
 */
export function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    planning: "outline",
    in_progress: "default",
    completed: "secondary",
    on_hold: "destructive",
    pending: "outline",
    todo: "outline",
  }
  return variants[status] || "outline"
}

/**
 * Get priority badge variant
 */
export function getPriorityVariant(priority: string): "default" | "secondary" | "destructive" | "outline" {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    low: "outline",
    medium: "default",
    high: "secondary",
    urgent: "destructive",
  }
  return variants[priority] || "outline"
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

/**
 * Generate a random ID
 */
export function generateId(prefix?: string): string {
  const random = Math.random().toString(36).substring(2, 9)
  const timestamp = Date.now().toString(36)
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`
}