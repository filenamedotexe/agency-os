"use client"

import { useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"

/**
 * Custom hook to get a memoized Supabase client instance
 * Use this in client components to avoid recreating the client on every render
 */
export function useSupabase() {
  const supabase = useMemo(
    () => createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
    []
  )
  
  return supabase
}