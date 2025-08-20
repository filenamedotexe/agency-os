"use server"

import { createClient } from '@/shared/lib/supabase/server'
import { createServiceClient } from '@/shared/lib/supabase/service'
import { revalidatePath } from 'next/cache'

// Get all collections
export async function getCollections() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated', collections: [] }
  
  // Get collections with resource counts
  const { data: collections, error } = await supabase
    .from('collections')
    .select(`
      *,
      resources(count)
    `)
    .order('created_at', { ascending: false })
  
  if (error) return { error: error.message, collections: [] }
  
  return { collections: collections || [] }
}

// Get single collection with resources
export async function getCollection(collectionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  // Get collection
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('*')
    .eq('id', collectionId)
    .single()
  
  if (collectionError) return { error: collectionError.message }
  
  // Get resources - simplified query
  const { data: resources, error: resourcesError } = await supabase
    .from('resources')
    .select('*, rich_description')
    .eq('collection_id', collectionId)
    .order('created_at', { ascending: false })
  
  if (resourcesError) return { error: resourcesError.message }
  
  return { 
    collection: {
      ...collection,
      resources: resources || []
    }
  }
}

// Create collection
export async function createCollection(data: {
  name: string
  description?: string
  visibility?: 'public' | 'clients' | 'team'
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  // Check if admin/team
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['admin', 'team_member'].includes(profile.role)) {
    return { error: 'Unauthorized' }
  }
  
  const { data: collection, error } = await supabase
    .from('collections')
    .insert({
      name: data.name,
      description: data.description,
      visibility: data.visibility || 'clients',
      created_by: user.id
    })
    .select()
    .single()
  
  if (error) return { error: error.message }
  
  revalidatePath('/knowledge')
  return { collection }
}

// Create resource - enhanced to support notes and optional files
export async function createResource(data: {
  collection_id: string
  title: string
  description?: string
  rich_description?: string
  type: 'document' | 'video' | 'file' | 'note'
  content_url?: string | null
  file_name?: string | null
  file_size?: number | null
  mime_type?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  // Check if admin/team
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['admin', 'team_member'].includes(profile.role)) {
    return { error: 'Unauthorized' }
  }
  
  // Parse rich description if provided
  let richDescriptionJson = null
  if (data.rich_description) {
    try {
      richDescriptionJson = JSON.parse(data.rich_description)
    } catch {
      // If parsing fails, treat as plain text and convert
      richDescriptionJson = {
        type: 'doc',
        content: [{
          type: 'paragraph',
          content: [{
            type: 'text',
            text: data.rich_description
          }]
        }]
      }
    }
  }

  // Use service client to bypass RLS for insert
  const serviceClient = createServiceClient()
  const { data: resource, error } = await serviceClient
    .from('resources')
    .insert({
      collection_id: data.collection_id,
      title: data.title,
      description: data.description,
      rich_description: richDescriptionJson,
      type: data.type,
      content_url: data.content_url,
      file_name: data.file_name,
      file_size: data.file_size,
      mime_type: data.mime_type,
      created_by: user.id
    })
    .select()
    .single()
  
  if (error) return { error: error.message }
  
  revalidatePath(`/knowledge/${data.collection_id}`)
  return { resource }
}

// Delete resource
export async function deleteResource(resourceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  // Check if admin/team
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['admin', 'team_member'].includes(profile.role)) {
    return { error: 'Unauthorized' }
  }
  
  // Get resource to find collection for revalidation
  const { data: resource } = await supabase
    .from('resources')
    .select('collection_id')
    .eq('id', resourceId)
    .single()
  
  // Use service client to bypass RLS for delete
  const serviceClient = createServiceClient()
  const { error } = await serviceClient
    .from('resources')
    .delete()
    .eq('id', resourceId)
  
  if (error) return { error: error.message }
  
  if (resource) {
    revalidatePath(`/knowledge/${resource.collection_id}`)
  }
  return { success: true }
}

// Update collection
export async function updateCollection(
  collectionId: string,
  data: {
    name?: string
    description?: string
    visibility?: 'public' | 'clients' | 'team'
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  // Check if admin/team
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['admin', 'team_member'].includes(profile.role)) {
    return { error: 'Unauthorized' }
  }
  
  const { data: collection, error } = await supabase
    .from('collections')
    .update(data)
    .eq('id', collectionId)
    .select()
    .single()
  
  if (error) return { error: error.message }
  
  revalidatePath('/knowledge')
  revalidatePath(`/knowledge/${collectionId}`)
  return { collection }
}

// Delete collection
export async function deleteCollection(collectionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  // Check if admin/team
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['admin', 'team_member'].includes(profile.role)) {
    return { error: 'Unauthorized' }
  }
  
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId)
  
  if (error) return { error: error.message }
  
  revalidatePath('/knowledge')
  return { success: true }
}

// Update resource
export async function updateResource(
  resourceId: string,
  data: {
    title?: string
    description?: string
    rich_description?: string
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  // Check if admin/team
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['admin', 'team_member'].includes(profile.role)) {
    return { error: 'Unauthorized' }
  }
  
  // Parse rich description if provided
  let richDescriptionJson = null
  if (data.rich_description) {
    try {
      richDescriptionJson = JSON.parse(data.rich_description)
    } catch {
      // If parsing fails, treat as plain text and convert
      richDescriptionJson = {
        type: 'doc',
        content: [{
          type: 'paragraph',
          content: [{
            type: 'text',
            text: data.rich_description
          }]
        }]
      }
    }
  }

  // Use service client to bypass RLS for update
  const serviceClient = createServiceClient()
  const { data: resource, error } = await serviceClient
    .from('resources')
    .update({
      title: data.title,
      description: data.description,
      rich_description: richDescriptionJson,
    })
    .eq('id', resourceId)
    .select()
    .single()
  
  if (error) return { error: error.message }
  
  // Get collection_id for revalidation
  const { data: resourceData } = await supabase
    .from('resources')
    .select('collection_id')
    .eq('id', resourceId)
    .single()
  
  if (resourceData) {
    revalidatePath(`/knowledge/${resourceData.collection_id}`)
  }
  
  return { resource }
}

// Track resource access (stub for compatibility)
export async function trackResourceAccess(_resourceId: string, _action: 'view' | 'download') {
  // Simplified - no tracking in the new system
  return { success: true }
}