"use server"

import { requireAuth, isAuthError, isAdminOrTeam, errorResponse, successResponse } from '@/shared/lib/auth-utils'
import { revalidatePath } from 'next/cache'

// =====================================================
// GET ALL SERVICES
// =====================================================
export async function getServices() {
  const auth = await requireAuth()
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase, user } = auth
  
  // Build query based on user role
  let query = supabase
    .from('services')
    .select(`
      *,
      client:profiles!client_id(
        id, 
        full_name, 
        email, 
        company,
        avatar_url
      ),
      milestones(
        id, 
        name, 
        status, 
        due_date,
        position
      ),
      service_members(
        id,
        role,
        user:profiles!user_id(
          id, 
          full_name, 
          email,
          avatar_url
        )
      )
    `)
    .order('created_at', { ascending: false })
  
  // Clients only see their own services
  if (user.role === 'client') {
    query = query.eq('client_id', user.id)
  }
  
  const { data, error } = await query
  
  if (error) return errorResponse(error.message)
  
  // Calculate progress for each service
  const servicesWithProgress = data?.map(service => {
    const totalMilestones = service.milestones?.length || 0
    const completedMilestones = service.milestones?.filter(
      (m: any) => m.status === 'completed'
    ).length || 0
    
    // Calculate next milestone
    const nextMilestone = service.milestones
      ?.filter((m: any) => m.status !== 'completed')
      ?.sort((a: any, b: any) => a.position - b.position)?.[0]
    
    return {
      ...service,
      progress: totalMilestones > 0 
        ? Math.round((completedMilestones / totalMilestones) * 100)
        : 0,
      totalMilestones,
      completedMilestones,
      nextMilestone
    }
  }) || []
  
  return successResponse(servicesWithProgress, 'Services retrieved successfully')
}

// =====================================================
// GET SINGLE SERVICE WITH FULL DETAILS
// =====================================================
export async function getService(serviceId: string) {
  if (!serviceId) return errorResponse('Service ID is required')
  
  const auth = await requireAuth()
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase, user } = auth
  
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      client:profiles!client_id(
        id,
        full_name,
        email,
        company,
        phone,
        avatar_url
      ),
      milestones(
        *,
        tasks(
          *,
          assigned_to:profiles!assigned_to(
            id,
            full_name,
            email,
            avatar_url
          ),
          created_by:profiles!created_by(
            id,
            full_name
          ),
          comments:task_comments(
            *,
            user:profiles!user_id(
              id,
              full_name,
              avatar_url
            )
          )
        )
      ),
      service_members(
        *,
        user:profiles!user_id(
          id,
          full_name,
          email,
          role,
          avatar_url
        )
      ),
      created_by:profiles!created_by(
        id,
        full_name
      )
    `)
    .eq('id', serviceId)
    .single()
  
  if (error) return errorResponse(error.message)
  if (!data) return errorResponse('Service not found', 'NOT_FOUND')
  
  // Check access permissions for clients
  if (user.role === 'client' && data.client_id !== user.id) {
    return errorResponse('You do not have access to this service', 'FORBIDDEN')
  }
  
  // Sort milestones by position
  if (data.milestones) {
    data.milestones.sort((a: any, b: any) => a.position - b.position)
    
    // Sort tasks within each milestone
    data.milestones.forEach((milestone: any) => {
      if (milestone.tasks) {
        milestone.tasks.sort((a: any, b: any) => {
          // First sort by status order
          const statusOrder = ['todo', 'in_progress', 'review', 'done', 'blocked']
          const statusDiff = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
          if (statusDiff !== 0) return statusDiff
          // Then by position within status
          return a.position - b.position
        })
        
        // Sort comments by created_at
        milestone.tasks.forEach((task: any) => {
          if (task.comments) {
            task.comments.sort((a: any, b: any) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          }
        })
      }
    })
  }
  
  // Calculate overall progress
  const totalMilestones = data.milestones?.length || 0
  const completedMilestones = data.milestones?.filter(
    (m: any) => m.status === 'completed'
  ).length || 0
  
  const serviceWithProgress = {
    ...data,
    progress: totalMilestones > 0 
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0,
    totalMilestones,
    completedMilestones
  }
  
  return successResponse(serviceWithProgress, 'Service retrieved successfully')
}

// =====================================================
// CREATE NEW SERVICE
// =====================================================
export async function createService(data: {
  client_id: string
  name: string
  description?: string
  start_date?: string
  end_date?: string
  budget?: number
  color?: string
}) {
  // Validate required fields
  if (!data.client_id || !data.name) {
    return errorResponse('Client ID and service name are required')
  }
  
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { serviceClient, user } = auth
  
  // Validate client exists
  const { data: client, error: clientError } = await serviceClient
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', data.client_id)
    .single()
  
  if (clientError || !client) {
    return errorResponse('Invalid client ID')
  }
  
  // Create the service
  const { data: service, error: serviceError } = await serviceClient
    .from('services')
    .insert({
      ...data,
      created_by: user.id,
      status: 'planning',
      color: data.color || 'blue'
    })
    .select()
    .single()
  
  if (serviceError) return errorResponse(serviceError.message)
  
  // Auto-add creator as service lead
  const { error: memberError } = await serviceClient
    .from('service_members')
    .insert({
      service_id: service.id,
      user_id: user.id,
      role: 'lead'
    })
  
  if (memberError) {
    console.error('Failed to add service lead:', memberError)
  }
  
  // Create default milestones
  const defaultMilestones = [
    { name: 'Discovery & Planning', position: 0 },
    { name: 'Development', position: 1 },
    { name: 'Review & Testing', position: 2 },
    { name: 'Delivery', position: 3 }
  ]
  
  for (const milestone of defaultMilestones) {
    await serviceClient
      .from('milestones')
      .insert({
        service_id: service.id,
        name: milestone.name,
        position: milestone.position,
        status: 'upcoming'
      })
  }
  
  revalidatePath('/services')
  revalidatePath('/dashboard')
  
  return successResponse(service, 'Service created successfully')
}

// =====================================================
// UPDATE SERVICE STATUS
// =====================================================
export async function updateServiceStatus(
  serviceId: string, 
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled'
) {
  if (!serviceId || !status) {
    return errorResponse('Service ID and status are required')
  }
  
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase } = auth
  
  // Validate status value
  const validStatuses = ['planning', 'active', 'paused', 'completed', 'cancelled']
  if (!validStatuses.includes(status)) {
    return errorResponse('Invalid status value')
  }
  
  const { data, error } = await supabase
    .from('services')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', serviceId)
    .select()
    .single()
  
  if (error) return errorResponse(error.message)
  if (!data) return errorResponse('Service not found')
  
  revalidatePath('/services')
  revalidatePath(`/services/${serviceId}`)
  revalidatePath('/dashboard')
  
  return successResponse(data, `Service status updated to ${status}`)
}

// =====================================================
// UPDATE SERVICE DETAILS
// =====================================================
export async function updateService(
  serviceId: string,
  updates: {
    name?: string
    description?: string
    start_date?: string
    end_date?: string
    budget?: number
    color?: string
  }
) {
  if (!serviceId) return errorResponse('Service ID is required')
  
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase } = auth
  
  // Filter out undefined values
  const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
    if (value !== undefined) acc[key] = value
    return acc
  }, {} as any)
  
  if (Object.keys(cleanUpdates).length === 0) {
    return errorResponse('No updates provided')
  }
  
  const { data, error } = await supabase
    .from('services')
    .update({
      ...cleanUpdates,
      updated_at: new Date().toISOString()
    })
    .eq('id', serviceId)
    .select()
    .single()
  
  if (error) return errorResponse(error.message)
  if (!data) return errorResponse('Service not found')
  
  revalidatePath('/services')
  revalidatePath(`/services/${serviceId}`)
  
  return successResponse(data, 'Service updated successfully')
}

// =====================================================
// DELETE SERVICE
// =====================================================
export async function deleteService(serviceId: string) {
  if (!serviceId) return errorResponse('Service ID is required')
  
  const auth = await requireAuth(['admin'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase } = auth
  
  // Check if service exists
  const { data: service, error: checkError } = await supabase
    .from('services')
    .select('id, name')
    .eq('id', serviceId)
    .single()
  
  if (checkError || !service) {
    return errorResponse('Service not found')
  }
  
  // Delete service (cascade will handle related records)
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId)
  
  if (error) return errorResponse(error.message)
  
  revalidatePath('/services')
  revalidatePath('/dashboard')
  
  return successResponse({ id: serviceId }, `Service "${service.name}" deleted successfully`)
}

// =====================================================
// ADD SERVICE MEMBER
// =====================================================
export async function addServiceMember(
  serviceId: string,
  userId: string,
  role: 'lead' | 'member' | 'viewer' = 'member'
) {
  if (!serviceId || !userId) {
    return errorResponse('Service ID and user ID are required')
  }
  
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { serviceClient } = auth
  
  // Check if member already exists
  const { data: existing } = await serviceClient
    .from('service_members')
    .select('id')
    .eq('service_id', serviceId)
    .eq('user_id', userId)
    .single()
  
  if (existing) {
    return errorResponse('User is already a member of this service')
  }
  
  // Add the member
  const { data, error } = await serviceClient
    .from('service_members')
    .insert({
      service_id: serviceId,
      user_id: userId,
      role
    })
    .select(`
      *,
      user:profiles!user_id(
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .single()
  
  if (error) return errorResponse(error.message)
  
  revalidatePath(`/services/${serviceId}`)
  
  return successResponse(data, 'Team member added successfully')
}

// =====================================================
// REMOVE SERVICE MEMBER
// =====================================================
export async function removeServiceMember(
  serviceId: string,
  userId: string
) {
  if (!serviceId || !userId) {
    return errorResponse('Service ID and user ID are required')
  }
  
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase } = auth
  
  const { error } = await supabase
    .from('service_members')
    .delete()
    .eq('service_id', serviceId)
    .eq('user_id', userId)
  
  if (error) return errorResponse(error.message)
  
  revalidatePath(`/services/${serviceId}`)
  
  return successResponse({ serviceId, userId }, 'Team member removed successfully')
}

// =====================================================
// GET SERVICE STATS (for dashboard)
// =====================================================
export async function getServiceStats() {
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase } = auth
  
  // Get counts by status
  const { data: services, error } = await supabase
    .from('services')
    .select('status')
  
  if (error) return errorResponse(error.message)
  
  const stats = {
    total: services?.length || 0,
    planning: services?.filter(s => s.status === 'planning').length || 0,
    active: services?.filter(s => s.status === 'active').length || 0,
    paused: services?.filter(s => s.status === 'paused').length || 0,
    completed: services?.filter(s => s.status === 'completed').length || 0,
    cancelled: services?.filter(s => s.status === 'cancelled').length || 0
  }
  
  return successResponse(stats, 'Service stats retrieved')
}