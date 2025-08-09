/**
 * Error handling utilities for consistent error messages and handling
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = "AppError"
  }
}

export interface ErrorResponse {
  error: string
  code?: string
  details?: unknown
}

/**
 * Format error for display to user
 */
export function formatError(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }
  
  if (error instanceof Error) {
    // Supabase auth errors
    if (error.message.includes("Invalid login credentials")) {
      return "Invalid email or password. Please try again."
    }
    if (error.message.includes("Email not confirmed")) {
      return "Please verify your email before logging in."
    }
    if (error.message.includes("User already registered")) {
      return "An account with this email already exists."
    }
    
    // Database errors
    if (error.message.includes("duplicate key")) {
      return "This record already exists."
    }
    if (error.message.includes("violates foreign key")) {
      return "Cannot perform this action due to related records."
    }
    
    // Network errors
    if (error.message.includes("fetch failed")) {
      return "Network error. Please check your connection and try again."
    }
    
    return error.message
  }
  
  if (typeof error === "string") {
    return error
  }
  
  return "An unexpected error occurred. Please try again."
}

/**
 * Log error for debugging (in development only)
 */
export function logError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV === "development") {
    console.error(`[${context || "Error"}]:`, error)
  }
  
  // In production, you would send this to an error tracking service
  // like Sentry, LogRocket, etc.
}

/**
 * Handle API errors consistently
 */
export async function handleApiError(
  error: unknown,
  context?: string
): Promise<ErrorResponse> {
  logError(error, context)
  
  const message = formatError(error)
  const code = error instanceof AppError ? error.code : undefined
  
  return {
    error: message,
    code,
    details: process.env.NODE_ENV === "development" ? error : undefined
  }
}