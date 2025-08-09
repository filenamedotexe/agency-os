import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types'

export class AuthService {
  static async signIn(email: string, password: string) {
    const supabase = createClient()
    return supabase.auth.signInWithPassword({ email, password })
  }

  static async signUp(data: {
    email: string
    password: string
    firstName: string
    lastName: string
    role: UserRole
  }) {
    const supabase = createClient()
    
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          role: data.role,
        },
      },
    })

    if (error || !authData.user) {
      return { data: authData, error }
    }

    // Create profile record
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role,
      })

    // If client role, create extended profile
    if (data.role === "client" && !profileError) {
      await supabase
        .from("client_profiles")
        .insert({
          profile_id: authData.user.id,
        })
    }

    return { data: authData, error: profileError || error }
  }

  static async signOut() {
    const supabase = createClient()
    return supabase.auth.signOut()
  }

  static async getUser() {
    const supabase = createClient()
    return supabase.auth.getUser()
  }

  static async getServerUser() {
    const supabase = await createServerClient()
    return supabase.auth.getUser()
  }

  static async getProfile(userId: string) {
    const supabase = createClient()
    return supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
  }

  static async getServerProfile(userId: string) {
    const supabase = await createServerClient()
    return supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
  }
}