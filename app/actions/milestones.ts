"use server"

import { requireAuth, isAuthError, isAdminOrTeam, errorResponse, successResponse } from '@/shared/lib/auth-utils'
import { revalidatePath } from 'next/cache'

// =====================================================
// GET MILESTONES FOR A SERVICE
// =====================================================
export async function getMilestones(serviceId: string) {
  if (!serviceId) return errorResponse('Service ID is required')
  
  const auth = await requireAuth()
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase, user } = auth
  
  // First check if user has access to this service
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, client_id')
    .eq('id', serviceId)
    .single()
  
  if (serviceError || !service) {
    return errorResponse('Service not found')
  }
  
  // Check access for clients
  if (user.role === 'client' && service.client_id !== user.id) {
    return errorResponse('You do not have access to this service', 'FORBIDDEN')
  }
  
  // Get milestones with tasks
  const { data, error } = await supabase
    .from('milestones')
    .select(`
      *,
      tasks(
        id,
        title,
        status,
        priority,
        position,
        assigned_to:profiles!assigned_to(
          id,
          full_name,
          avatar_url
        )
      )
    `)
    .eq('service_id', serviceId)
    .order('position', { ascending: true })
  
  if (error) return errorResponse(error.message)
  
  // Calculate progress for each milestone
  const milestonesWithProgress = data?.map(milestone => {
    const totalTasks = milestone.tasks?.length || 0
    const completedTasks = milestone.tasks?.filter(
      (t: any) => t.status === 'done'
    ).length || 0
    
    return {
      ...milestone,
      progress: totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0,
      totalTasks,
      completedTasks
    }
  }) || []
  
  return successResponse(milestonesWithProgress, 'Milestones retrieved successfully')
}

// =====================================================
// CREATE NEW MILESTONE
// =====================================================
export async function createMilestone(data: {
  service_id: string
  name: string
  description?: string
  due_date?: string
  position?: number
}) {
  if (!data.service_id || !data.name) {
    return errorResponse('Service ID and milestone name are required')
  }
  
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { serviceClient } = auth
  
  // If position not provided, get the next position
  if (data.position === undefined) {
    const { data: existingMilestones } = await serviceClient
      .from('milestones')
      .select('position')
      .eq('service_id', data.service_id)
      .order('position', { ascending: false })
      .limit(1)
    
    data.position = existingMilestones?.[0]?.position 
      ? existingMilestones[0].position + 1 
      : 0
  } else {
    // Shift existing milestones if inserting at specific position
    try {
      await serviceClient
        .rpc('shift_milestone_positions', {
          p_service_id: data.service_id,
          p_position: data.position,
          p_shift: 1
        })
    } catch {
      // If RPC doesn't exist, do it manually
      const { data: existingMilestones } = await serviceClient
        .from('milestones')
        .select('id, position')
        .eq('service_id', data.service_id)
        .gte('position', data.position)
        .order('position', { ascending: false })
      
      for (const milestone of existingMilestones || []) {
        await serviceClient
          .from('milestones')
          .update({ position: milestone.position + 1 })
          .eq('id', milestone.id)
      }
    }
  }
  
  // Create the milestone
  const { data: milestone, error } = await serviceClient
    .from('milestones')
    .insert({
      service_id: data.service_id,
      name: data.name,
      description: data.description,
      due_date: data.due_date,
      position: data.position,
      status: 'upcoming'
    })
    .select()
    .single()
  
  if (error) return errorResponse(error.message)
  
  revalidatePath(`/services/${data.service_id}`)
  
  return successResponse(milestone, 'Milestone created successfully')
}

// =====================================================
// UPDATE MILESTONE
// =====================================================
export async function updateMilestone(
  milestoneId: string,
  updates: {
    name?: string
    description?: string
    status?: 'upcoming' | 'in_progress' | 'completed' | 'delayed'
    due_date?: string
    position?: number
  }
) {
  if (!milestoneId) return errorResponse('Milestone ID is required')
  
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase, serviceClient } = auth
  
  // Get current milestone to find service_id
  const { data: currentMilestone, error: fetchError } = await supabase
    .from('milestones')
    .select('service_id, position')
    .eq('id', milestoneId)
    .single()
  
  if (fetchError || !currentMilestone) {
    return errorResponse('Milestone not found')
  }
  
  // Handle position change if needed
  if (updates.position !== undefined && updates.position !== currentMilestone.position) {
    // Reorder other milestones
    if (updates.position > currentMilestone.position) {
      // Moving down - shift others up
      const { data: milestonesToShift } = await serviceClient
        .from('milestones')
        .select('id, position')
        .eq('service_id', currentMilestone.service_id)
        .gt('position', currentMilestone.position)
        .lte('position', updates.position)
      
      for (const m of milestonesToShift || []) {
        await serviceClient
          .from('milestones')
          .update({ position: m.position - 1 })
          .eq('id', m.id)
      }
    } else {
      // Moving up - shift others down
      const { data: milestonesToShift } = await serviceClient
        .from('milestones')
        .select('id, position')
        .eq('service_id', currentMilestone.service_id)
        .gte('position', updates.position)
        .lt('position', currentMilestone.position)
      
      for (const m of milestonesToShift || []) {
        await serviceClient
          .from('milestones')
          .update({ position: m.position + 1 })
          .eq('id', m.id)
      }
    }
  }
  
  // Filter out undefined values
  const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
    if (value !== undefined) acc[key] = value
    return acc
  }, {} as any)
  
  // Add completed_at if status is changing to completed
  if (updates.status === 'completed') {
    cleanUpdates.completed_at = new Date().toISOString()
  } else if (updates.status) {
    cleanUpdates.completed_at = null
  }
  
  // Update the milestone
  const { data, error } = await supabase
    .from('milestones')
    .update({
      ...cleanUpdates,
      updated_at: new Date().toISOString()
    })
    .eq('id', milestoneId)
    .select()
    .single()
  
  if (error) return errorResponse(error.message)
  
  revalidatePath(`/services/${currentMilestone.service_id}`)
  
  return successResponse(data, 'Milestone updated successfully')
}

// =====================================================
// UPDATE MILESTONE STATUS
// =====================================================
export async function updateMilestoneStatus(
  milestoneId: string,
  status: 'upcoming' | 'in_progress' | 'completed' | 'delayed'
) {
  return updateMilestone(milestoneId, { status })
}

// =====================================================
// DELETE MILESTONE
// =====================================================
export async function deleteMilestone(milestoneId: string) {
  if (!milestoneId) return errorResponse('Milestone ID is required')
  
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase, serviceClient } = auth
  
  // Get milestone details
  const { data: milestone, error: fetchError } = await supabase
    .from('milestones')
    .select('service_id, position, name')
    .eq('id', milestoneId)
    .single()
  
  if (fetchError || !milestone) {
    return errorResponse('Milestone not found')
  }
  
  // Delete the milestone (tasks will cascade delete)
  const { error } = await supabase
    .from('milestones')
    .delete()
    .eq('id', milestoneId)
  
  if (error) return errorResponse(error.message)
  
  // Reorder remaining milestones
  const { data: remainingMilestones } = await serviceClient
    .from('milestones')
    .select('id, position')
    .eq('service_id', milestone.service_id)
    .gt('position', milestone.position)
    .order('position', { ascending: true })
  
  for (const m of remainingMilestones || []) {
    await serviceClient
      .from('milestones')
      .update({ position: m.position - 1 })
      .eq('id', m.id)
  }
  
  revalidatePath(`/services/${milestone.service_id}`)
  
  return successResponse(
    { id: milestoneId }, 
    `Milestone "${milestone.name}" deleted successfully`
  )
}

// =====================================================
// REORDER MILESTONES (for drag & drop)
// =====================================================
export async function reorderMilestones(
  serviceId: string,
  milestoneIds: string[]
) {
  if (!serviceId || !milestoneIds?.length) {
    return errorResponse('Service ID and milestone IDs are required')
  }
  
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { serviceClient } = auth
  
  // Update positions for all milestones
  const updates = milestoneIds.map((id, index) => 
    serviceClient
      .from('milestones')
      .update({ 
        position: index,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('service_id', serviceId)
  )
  
  const results = await Promise.all(updates)
  
  // Check for errors
  const errors = results.filter(r => r.error)
  if (errors.length > 0) {
    return errorResponse('Failed to reorder some milestones')
  }
  
  revalidatePath(`/services/${serviceId}`)
  
  return successResponse(
    { serviceId, order: milestoneIds }, 
    'Milestones reordered successfully'
  )
}

// =====================================================
// BULK UPDATE MILESTONE STATUSES
// =====================================================
export async function bulkUpdateMilestoneStatuses(
  serviceId: string,
  updates: Array<{ id: string; status: 'upcoming' | 'in_progress' | 'completed' | 'delayed' }>
) {
  if (!serviceId || !updates?.length) {
    return errorResponse('Service ID and updates are required')
  }
  
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase } = auth
  
  // Process each update
  const results = await Promise.all(
    updates.map(update => 
      supabase
        .from('milestones')
        .update({
          status: update.status,
          completed_at: update.status === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id)
        .eq('service_id', serviceId)
    )
  )
  
  // Check for errors
  const errors = results.filter(r => r.error)
  if (errors.length > 0) {
    return errorResponse('Failed to update some milestones')
  }
  
  revalidatePath(`/services/${serviceId}`)
  
  return successResponse(
    { updated: updates.length }, 
    `${updates.length} milestones updated successfully`
  )
}

// =====================================================
// GET MILESTONE STATS
// =====================================================
export async function getMilestoneStats(serviceId?: string) {
  const auth = await requireAuth()
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase, user } = auth
  
  let query = supabase
    .from('milestones')
    .select('status, service_id')
  
  if (serviceId) {
    query = query.eq('service_id', serviceId)
  } else if (user.role === 'client') {
    // For clients, only count milestones from their services
    const { data: services } = await supabase
      .from('services')
      .select('id')
      .eq('client_id', user.id)
    
    if (services?.length) {
      query = query.in('service_id', services.map(s => s.id))
    }
  }
  
  const { data, error } = await query
  
  if (error) return errorResponse(error.message)
  
  const stats = {
    total: data?.length || 0,
    upcoming: data?.filter(m => m.status === 'upcoming').length || 0,
    in_progress: data?.filter(m => m.status === 'in_progress').length || 0,
    completed: data?.filter(m => m.status === 'completed').length || 0,
    delayed: data?.filter(m => m.status === 'delayed').length || 0
  }
  
  return successResponse(stats, 'Milestone stats retrieved')
}