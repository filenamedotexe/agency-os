import { cache } from 'react'
import { unstable_cache } from 'next/cache'

/**
 * Enhanced data fetcher with automatic caching for server components
 * Utilizes React 19's improved cache mechanisms
 */

// Cache wrapper for frequently accessed data
export const getCachedData = cache(async <T>(
  fetcher: () => Promise<T>,
  key: string
): Promise<T> => {
  return fetcher()
})

// Stable cache for data that changes less frequently
export const getStableData = unstable_cache(
  async <T>(fetcher: () => Promise<T>) => fetcher(),
  ['stable-data'],
  {
    revalidate: 3600, // 1 hour
    tags: ['stable']
  }
)

// Optimistic update helper for client components
export function createOptimisticUpdate<T>(
  currentData: T,
  action: 'add' | 'update' | 'delete',
  item?: Partial<T>
): T {
  if (Array.isArray(currentData)) {
    switch (action) {
      case 'add':
        return [item, ...currentData] as T
      case 'delete':
        return currentData.filter(d => d !== item) as T
      case 'update':
        return currentData.map(d => 
          d === item ? { ...d, ...item } : d
        ) as T
      default:
        return currentData
    }
  }
  
  if (action === 'update' && item) {
    return { ...currentData, ...item }
  }
  
  return currentData
}

// Error boundary helper
export function withErrorBoundary<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  return fn().catch((error) => {
    console.error('Data fetch error:', error)
    return fallback
  })
}

// Parallel data loader for multiple queries
export async function loadParallelData<T extends Record<string, Promise<any>>>(
  queries: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const keys = Object.keys(queries) as (keyof T)[]
  const promises = keys.map(key => queries[key])
  
  const results = await Promise.allSettled(promises)
  
  const data = {} as { [K in keyof T]: Awaited<T[K]> }
  
  keys.forEach((key, index) => {
    const result = results[index]
    if (result.status === 'fulfilled') {
      data[key] = result.value
    } else {
      console.error(`Failed to load ${String(key)}:`, result.reason)
      data[key] = null as any
    }
  })
  
  return data
}

// Streaming data helper for large datasets
export async function* streamData<T>(
  items: T[],
  chunkSize: number = 10
): AsyncGenerator<T[], void, unknown> {
  for (let i = 0; i < items.length; i += chunkSize) {
    yield items.slice(i, i + chunkSize)
    // Allow other operations to process
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

// Debounced search helper
export function createDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T>,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout
  
  return (query: string): Promise<T> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(async () => {
        const result = await searchFn(query)
        resolve(result)
      }, delay)
    })
  }
}