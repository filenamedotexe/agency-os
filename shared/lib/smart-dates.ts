/**
 * Smart Date Calculation Utility
 * Handles relative date parsing and calculation for service templates
 * Date: 2025-08-19
 */

import { RelativeDateUnit, RelativeDateParse, SmartDateConfig, CalculatedDates } from '@/shared/types'

/**
 * Parse relative date strings like "1 week", "2 months", "3 days"
 * Supports flexible input formats with singular/plural forms
 */
export function parseRelativeDateString(input: string): RelativeDateParse | null {
  if (!input || typeof input !== 'string') {
    return null
  }

  // Normalize input: trim, lowercase, remove extra spaces
  const normalized = input.trim().toLowerCase().replace(/\s+/g, ' ')
  
  // Handle special cases
  if (normalized === 'same day' || normalized === 'today') {
    return { amount: 0, unit: 'days', total_days: 0 }
  }
  
  if (normalized === 'next day' || normalized === 'tomorrow') {
    return { amount: 1, unit: 'day', total_days: 1 }
  }

  // Regular expression to match patterns like:
  // "1 day", "2 weeks", "3 months", "1 week later", "2 days later"
  const regex = /^(\d+)\s+(day|days|week|weeks|month|months)(?:\s+later)?$/
  const match = normalized.match(regex)

  if (!match) {
    return null
  }

  const amount = parseInt(match[1], 10)
  const unit = match[2] as RelativeDateUnit

  if (isNaN(amount) || amount < 0) {
    return null
  }

  // Convert to total days
  const total_days = convertToTotalDays(amount, unit)

  return {
    amount,
    unit,
    total_days
  }
}

/**
 * Convert amount and unit to total days
 */
function convertToTotalDays(amount: number, unit: RelativeDateUnit): number {
  switch (unit) {
    case 'day':
    case 'days':
      return amount
    case 'week':
    case 'weeks':
      return amount * 7
    case 'month':
    case 'months':
      return amount * 30 // Using 30 days as average month
    default:
      return 0
  }
}

/**
 * Add days to a date string (ISO format)
 * Handles timezone preservation and date boundaries
 */
export function addDaysToDate(dateString: string, days: number): string {
  if (!dateString || days < 0) {
    throw new Error('Invalid date string or negative days')
  }

  const date = new Date(dateString)
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format')
  }

  // Add days while preserving timezone
  date.setDate(date.getDate() + days)
  
  // Return ISO string (will be in UTC)
  return date.toISOString()
}

/**
 * Calculate milestone dates based on service start date and relative days
 */
export function calculateMilestoneDate(
  serviceStartDate: string | null, 
  relativeDays: number
): string | null {
  if (!serviceStartDate || relativeDays < 0) {
    return null
  }

  try {
    return addDaysToDate(serviceStartDate, relativeDays)
  } catch (error) {
    console.error('Error calculating milestone date:', error)
    return null
  }
}

/**
 * Calculate task dates based on milestone start date and relative days
 */
export function calculateTaskDate(
  milestoneDate: string | null, 
  relativeDays: number | null
): string | null {
  if (!milestoneDate || relativeDays === null || relativeDays < 0) {
    return null
  }

  try {
    return addDaysToDate(milestoneDate, relativeDays)
  } catch (error) {
    console.error('Error calculating task date:', error)
    return null
  }
}

/**
 * Calculate both start and due dates for a milestone or task
 */
export function calculateDates(
  anchorDate: string | null,
  config: SmartDateConfig
): CalculatedDates {
  if (!anchorDate) {
    return { start_date: null, due_date: null }
  }

  try {
    const start_date = calculateMilestoneDate(anchorDate, config.relative_start_days)
    const due_date = config.relative_due_days !== undefined && config.relative_due_days !== null
      ? calculateMilestoneDate(anchorDate, config.relative_due_days)
      : null

    return { start_date, due_date }
  } catch (error) {
    console.error('Error calculating dates:', error)
    return { start_date: null, due_date: null }
  }
}

/**
 * Generate common relative date suggestions for UI dropdowns
 */
export function generateDateSuggestions(): Array<{ label: string; value: string; days: number }> {
  return [
    { label: 'Same day', value: 'same day', days: 0 },
    { label: 'Next day', value: 'next day', days: 1 },
    { label: '3 days', value: '3 days', days: 3 },
    { label: '1 week', value: '1 week', days: 7 },
    { label: '2 weeks', value: '2 weeks', days: 14 },
    { label: '3 weeks', value: '3 weeks', days: 21 },
    { label: '1 month', value: '1 month', days: 30 },
    { label: '2 months', value: '2 months', days: 60 },
    { label: '3 months', value: '3 months', days: 90 },
    { label: '6 months', value: '6 months', days: 180 },
  ]
}

/**
 * Validate that due date is after start date
 */
export function validateDateSequence(
  startDays: number, 
  dueDays: number | null
): boolean {
  if (dueDays === null || dueDays === undefined) {
    return true // Due date is optional
  }

  return dueDays >= startDays
}

/**
 * Format relative days back to human readable string
 */
export function formatRelativeDays(days: number): string {
  if (days === 0) {
    return 'Same day'
  }
  
  if (days === 1) {
    return 'Next day'
  }

  // Convert back to most appropriate unit
  if (days % 30 === 0 && days >= 30) {
    const months = days / 30
    return `${months} ${months === 1 ? 'month' : 'months'}`
  }
  
  if (days % 7 === 0 && days >= 7) {
    const weeks = days / 7
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
  }

  return `${days} ${days === 1 ? 'day' : 'days'}`
}

/**
 * Convert a date string to just the date part (YYYY-MM-DD)
 * Useful for form inputs that expect date-only values
 */
export function toDateString(dateString: string | null): string | null {
  if (!dateString) {
    return null
  }

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return null
    }

    // Format as YYYY-MM-DD
    return date.toISOString().split('T')[0]
  } catch (error) {
    console.error('Error converting to date string:', error)
    return null
  }
}

/**
 * Check if a date string is valid
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false
  }

  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

/**
 * Get the current date as ISO string for default values
 */
export function getCurrentDate(): string {
  return new Date().toISOString()
}

/**
 * Get the current date as date-only string (YYYY-MM-DD)
 */
export function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Calculate the difference in days between two dates
 */
export function getDaysDifference(date1: string, date2: string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    throw new Error('Invalid date format')
  }

  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Preview what dates will be generated for a template
 * Useful for UI preview before creating service
 */
export function previewTemplateDates(
  serviceStartDate: string,
  milestones: Array<{
    name: string
    relative_start_days: number
    relative_due_days: number | null
    tasks?: Array<{
      title: string
      relative_due_days: number | null
    }>
  }>
): Array<{
  name: string
  start_date: string | null
  due_date: string | null
  tasks: Array<{
    title: string
    due_date: string | null
  }>
}> {
  if (!isValidDateString(serviceStartDate)) {
    throw new Error('Invalid service start date')
  }

  return milestones.map(milestone => {
    const milestoneStartDate = calculateMilestoneDate(
      serviceStartDate, 
      milestone.relative_start_days
    )
    const milestoneDueDate = milestone.relative_due_days !== null
      ? calculateMilestoneDate(serviceStartDate, milestone.relative_due_days)
      : null

    const tasks = (milestone.tasks || []).map(task => ({
      title: task.title,
      due_date: task.relative_due_days !== null && milestoneStartDate
        ? calculateTaskDate(milestoneStartDate, task.relative_due_days)
        : null
    }))

    return {
      name: milestone.name,
      start_date: milestoneStartDate,
      due_date: milestoneDueDate,
      tasks
    }
  })
}

/**
 * Utility type guards for date calculations
 */
export const SmartDateUtils = {
  isValidRelativeDays: (days: number): boolean => {
    return Number.isInteger(days) && days >= 0
  },
  
  isValidDateSequence: validateDateSequence,
  
  isDueDateAfterStart: (startDays: number, dueDays: number): boolean => {
    return dueDays > startDays
  }
} as const