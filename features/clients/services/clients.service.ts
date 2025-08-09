import { createClient } from '@/shared/lib/supabase/client'
import { createClient as createServerClient } from '@/shared/lib/supabase/server'
import type { Client } from '@/features/clients'

export interface CreateClientData {
  email: string
  password: string
  first_name: string
  last_name: string
  company_name?: string
  phone?: string
  industry?: string
  website?: string
  linkedin_url?: string
  twitter_url?: string
  facebook_url?: string
  instagram_url?: string
  company_size?: string
  annual_revenue?: string
  notes?: string
  tags?: string[]
  duda_site_id?: string
  duda_site_url?: string
}

export interface UpdateClientData extends Omit<CreateClientData, 'password'> {
  id: string
}

export class ClientsService {
  static async getClients() {
    const supabase = await createServerClient()
    return supabase
      .from("profiles")
      .select(`
        *,
        client_profiles (*)
      `)
      .eq("role", "client")
      .order("created_at", { ascending: false })
  }

  static async getClient(id: string) {
    const supabase = await createServerClient()
    return supabase
      .from("profiles")
      .select(`
        *,
        client_profiles (*)
      `)
      .eq("id", id)
      .single()
  }

  static async createClient(data: CreateClientData) {
    const supabase = createClient()
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
          role: 'client',
        },
      },
    })

    if (authError || !authData.user) {
      return { data: null, error: authError }
    }

    // Create profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        role: "client",
      })

    if (profileError) {
      return { data: null, error: profileError }
    }

    // Create client profile
    const { error: clientError } = await supabase
      .from("client_profiles")
      .insert({
        profile_id: authData.user.id,
        company_name: data.company_name,
        phone: data.phone,
        industry: data.industry,
        website: data.website,
        linkedin_url: data.linkedin_url,
        twitter_url: data.twitter_url,
        facebook_url: data.facebook_url,
        instagram_url: data.instagram_url,
        company_size: data.company_size,
        annual_revenue: data.annual_revenue,
        notes: data.notes,
        tags: data.tags,
        duda_site_id: data.duda_site_id,
        duda_site_url: data.duda_site_url,
      })

    return { data: authData, error: clientError }
  }

  static async updateClient(data: UpdateClientData) {
    const supabase = createClient()
    
    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
      })
      .eq('id', data.id)

    if (profileError) {
      return { error: profileError }
    }

    // Update client profile
    const { error: clientError } = await supabase
      .from('client_profiles')
      .update({
        company_name: data.company_name,
        phone: data.phone,
        industry: data.industry,
        website: data.website,
        linkedin_url: data.linkedin_url,
        twitter_url: data.twitter_url,
        facebook_url: data.facebook_url,
        instagram_url: data.instagram_url,
        company_size: data.company_size,
        annual_revenue: data.annual_revenue,
        notes: data.notes,
        tags: data.tags,
        duda_site_id: data.duda_site_id,
        duda_site_url: data.duda_site_url,
      })
      .eq('profile_id', data.id)

    return { error: clientError }
  }

  static async deleteClient(id: string) {
    const supabase = createClient()
    
    // Delete client profile first (due to foreign key constraint)
    await supabase
      .from("client_profiles")
      .delete()
      .eq("profile_id", id)

    // Delete the user profile
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id)

    return { error }
  }
}