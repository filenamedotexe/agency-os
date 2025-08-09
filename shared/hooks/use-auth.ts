"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/shared/lib/supabase/client'
import { AuthService } from '@/features/auth'
import type { User } from '@supabase/supabase-js'
import type { UserRole, Profile } from '@/shared/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  error: Error | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { user } } = await AuthService.getUser()
        
        if (user) {
          const { data: profile } = await AuthService.getProfile(user.id)
          setState({ user, profile, loading: false, error: null })
        } else {
          setState({ user: null, profile: null, loading: false, error: null })
        }
      } catch (error) {
        setState({ user: null, profile: null, loading: false, error: error as Error })
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await AuthService.getProfile(session.user.id)
        setState({ user: session.user, profile, loading: false, error: null })
      } else {
        setState({ user: null, profile: null, loading: false, error: null })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { data, error } = await AuthService.signIn(email, password)
      
      if (error) throw error
      
      if (data.user) {
        const { data: profile } = await AuthService.getProfile(data.user.id)
        setState({ user: data.user, profile, loading: false, error: null })
        
        // Redirect based on role
        const role = profile?.role as UserRole
        if (role === 'admin') router.push('/admin')
        else if (role === 'team_member') router.push('/team')
        else if (role === 'client') router.push('/client')
        else router.push('/dashboard')
      }
      
      return { data, error: null }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error as Error }))
      return { data: null, error: error as Error }
    }
  }

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { error } = await AuthService.signOut()
      
      if (error) throw error
      
      setState({ user: null, profile: null, loading: false, error: null })
      router.push('/login')
      
      return { error: null }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error as Error }))
      return { error: error as Error }
    }
  }

  return {
    user: state.user,
    profile: state.profile,
    loading: state.loading,
    error: state.error,
    signIn,
    signOut,
  }
}