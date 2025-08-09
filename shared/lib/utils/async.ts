import { toast } from "@/shared/hooks/use-toast"
import * as Sentry from "@sentry/nextjs"

interface AsyncHandlerOptions {
  loadingMessage?: string
  successMessage?: string
  errorMessage?: string
  onSuccess?: () => void
  onError?: (error: Error) => void
  captureError?: boolean
}

/**
 * Wrapper for async operations with consistent error handling and notifications
 */
export async function asyncHandler<T>(
  fn: () => Promise<T>,
  options: AsyncHandlerOptions = {}
): Promise<{ data: T | null; error: Error | null }> {
  const {
    loadingMessage,
    successMessage,
    errorMessage = "An error occurred",
    onSuccess,
    onError,
    captureError = true,
  } = options

  try {
    if (loadingMessage) {
      toast({
        title: loadingMessage,
        duration: 0, // Keep showing until dismissed
      })
    }

    const data = await fn()

    if (successMessage) {
      toast({
        title: successMessage,
        variant: "default",
      })
    }

    onSuccess?.()
    return { data, error: null }
  } catch (error) {
    const err = error as Error
    
    if (captureError) {
      Sentry.captureException(err)
    }

    toast({
      title: errorMessage,
      description: err.message,
      variant: "destructive",
    })

    onError?.(err)
    return { data: null, error: err }
  }
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError || new Error("Max retries exceeded")
}

/**
 * Run multiple async operations in parallel with proper error handling
 */
export async function parallelAsync<T extends readonly unknown[]>(
  ...fns: { [K in keyof T]: () => Promise<T[K]> }
): Promise<{ [K in keyof T]: T[K] | null }> {
  const results = await Promise.allSettled(fns.map(fn => fn()))
  
  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value
    } else {
      Sentry.captureException(result.reason)
      console.error(`Operation ${index} failed:`, result.reason)
      return null
    }
  }) as { [K in keyof T]: T[K] | null }
}

/**
 * Debounce an async function
 */
export function debounceAsync<TArgs extends unknown[]>(
  fn: (...args: TArgs) => Promise<unknown>,
  delay: number
): (...args: TArgs) => void {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (...args: TArgs) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}