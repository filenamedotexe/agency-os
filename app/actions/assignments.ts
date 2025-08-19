"use server"

import { requireAuth, isAuthError, errorResponse, successResponse } from '@/shared/lib/auth-utils'
import type { AssignableUser } from '@/shared/types'

// =====================================================
// GET ASSIGNABLE USERS FOR A SERVICE
// =====================================================
export async function getAssignableUsers(serviceId: string, includeClient: boolean = false) {
  if (!serviceId) return errorResponse('Service ID is required')
  
  const auth = await requireAuth()
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase, user } = auth
  
  // Get the service to find the client
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
  
  // Build query for assignable users
  let query = supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role')
  
  if (includeClient && service.client_id) {
    // Include admin, team members, and the specific client
    query = query.or(`role.in.(admin,team_member),id.eq.${service.client_id}`)
  } else {
    // Only admin and team members
    query = query.in('role', ['admin', 'team_member'])
  }
  
  const { data, error } = await query.order('role').order('full_name')
  
  if (error) return errorResponse(error.message)
  
  // Format as AssignableUser type
  const assignableUsers: AssignableUser[] = (data || []).map(user => ({
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    role: user.role
  }))
  
  return successResponse(assignableUsers, 'Assignable users retrieved')
}

// =====================================================
// GET ASSIGNABLE USERS FOR MILESTONES (Admin/Team only)
// =====================================================
export async function getAssignableUsersForMilestone(serviceId: string) {
  if (!serviceId) return errorResponse('Service ID is required')
  
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase } = auth
  
  // Get only admin and team members
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role')
    .in('role', ['admin', 'team_member'])
    .order('role')
    .order('full_name')
  
  if (error) return errorResponse(error.message)
  
  // Format as AssignableUser type
  const assignableUsers: AssignableUser[] = (data || []).map(user => ({
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    role: user.role
  }))
  
  return successResponse(assignableUsers, 'Milestone assignable users retrieved')
}

// =====================================================
// GET ALL TEAM MEMBERS
// =====================================================
export async function getTeamMembers() {
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase } = auth
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role')
    .in('role', ['admin', 'team_member'])
    .order('role')
    .order('full_name')
  
  if (error) return errorResponse(error.message)
  
  return successResponse(data || [], 'Team members retrieved')
}

// =====================================================
// GET ASSIGNMENT SUMMARY FOR A SERVICE
// =====================================================
export async function getServiceAssignmentSummary(serviceId: string) {
  if (!serviceId) return errorResponse('Service ID is required')
  
  const auth = await requireAuth()
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase, user } = auth
  
  // Get service with milestones and tasks
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select(`
      id,
      client_id,
      milestones(
        id,
        name,
        assignee_id,
        assignee:profiles!assignee_id(
          id,
          full_name,
          avatar_url,
          role
        ),
        tasks(
          id,
          assigned_to,
          visibility,
          status,
          assigned_to_profile:profiles!assigned_to(
            id,
            full_name,
            avatar_url,
            role
          )
        )
      )
    `)
    .eq('id', serviceId)
    .single()
  
  if (serviceError || !service) {
    return errorResponse('Service not found')
  }
  
  // Check access for clients
  if (user.role === 'client' && service.client_id !== user.id) {
    return errorResponse('You do not have access to this service', 'FORBIDDEN')
  }
  
  // Process assignment data
  const summary = {
    totalMilestones: service.milestones?.length || 0,
    assignedMilestones: service.milestones?.filter(m => m.assignee_id).length || 0,
    totalTasks: service.milestones?.reduce((sum, m) => sum + (m.tasks?.length || 0), 0) || 0,
    assignedTasks: service.milestones?.reduce(
      (sum, m) => sum + (m.tasks?.filter(t => t.assigned_to).length || 0), 
      0
    ) || 0,
    clientVisibleTasks: service.milestones?.reduce(
      (sum, m) => sum + (m.tasks?.filter(t => t.visibility === 'client').length || 0), 
      0
    ) || 0,
    milestoneAssignees: Array.from(new Set(
      (service.milestones || [])
        .filter(m => m.assignee_id)
        .map(m => ({
          id: m.assignee?.id,
          name: m.assignee?.full_name,
          role: m.assignee?.role
        }))
        .filter(a => a.id) // Filter out null/undefined
    )),
    taskAssignees: Array.from(new Set(
      (service.milestones || [])
        .flatMap(m => m.tasks || [])
        .filter(t => t.assigned_to)
        .map(t => ({
          id: t.assigned_to_profile?.id,
          name: t.assigned_to_profile?.full_name,
          role: t.assigned_to_profile?.role
        }))
        .filter(a => a.id) // Filter out null/undefined
    ))
  }
  
  return successResponse(summary, 'Assignment summary retrieved')
}

// =====================================================
// VALIDATE ASSIGNEE ROLE
// =====================================================
export async function validateAssigneeRole(
  assigneeId: string,
  requiredRoles: string[] = ['admin', 'team_member']
) {
  if (!assigneeId) return errorResponse('Assignee ID is required')
  
  const auth = await requireAuth()
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase } = auth
  
  const { data: assignee, error } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', assigneeId)
    .single()
  
  if (error || !assignee) {
    return errorResponse('Assignee not found')
  }
  
  if (!requiredRoles.includes(assignee.role)) {
    return errorResponse(`User must have one of these roles: ${requiredRoles.join(', ')}`)
  }
  
  return successResponse(assignee, 'Assignee role valid')
}

// =====================================================
// GET USER ASSIGNMENTS (Tasks and Milestones assigned to a user)
// =====================================================
export async function getUserAssignments(userId?: string) {
  const auth = await requireAuth()
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase, user } = auth
  
  const targetUserId = userId || user.id
  
  // Get milestones assigned to user
  const { data: milestones, error: milestoneError } = await supabase
    .from('milestones')
    .select(`
      id,
      name,
      status,
      due_date,
      service:services(
        id,
        name
      )
    `)
    .eq('assignee_id', targetUserId)
    .order('due_date', { ascending: true, nullsFirst: false })
  
  if (milestoneError) return errorResponse(milestoneError.message)
  
  // Get tasks assigned to user
  const { data: tasks, error: taskError } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      status,
      priority,
      due_date,
      visibility,
      milestone:milestones(
        id,
        name,
        service:services(
          id,
          name
        )
      )
    `)
    .eq('assigned_to', targetUserId)
    .order('due_date', { ascending: true, nullsFirst: false })
  
  if (taskError) return errorResponse(taskError.message)
  
  // Filter tasks for clients based on visibility
  let filteredTasks = tasks || []
  if (user.role === 'client') {
    filteredTasks = filteredTasks.filter(t => 
      t.visibility === 'client' || (t.milestone as any)?.service?.client_id === user.id
    )
  }
  
  return successResponse({
    milestones: milestones || [],
    tasks: filteredTasks
  }, 'User assignments retrieved')
}

// =====================================================
// TRANSFER ALL ASSIGNMENTS FROM ONE USER TO ANOTHER
// =====================================================
export async function transferAssignments(
  fromUserId: string,
  toUserId: string,
  includeCompleted: boolean = false
) {
  if (!fromUserId || !toUserId) {
    return errorResponse('Both from and to user IDs are required')
  }
  
  const auth = await requireAuth(['admin'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase } = auth
  
  // Validate both users exist and have appropriate roles
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id, role')
    .in('id', [fromUserId, toUserId])
  
  if (userError || users?.length !== 2) {
    return errorResponse('Invalid user IDs')
  }
  
  // Build milestone update query
  let milestoneQuery = supabase
    .from('milestones')
    .update({ 
      assignee_id: toUserId,
      updated_at: new Date().toISOString()
    })
    .eq('assignee_id', fromUserId)
  
  if (!includeCompleted) {
    milestoneQuery = milestoneQuery.neq('status', 'completed')
  }
  
  const { data: updatedMilestones, error: milestoneError } = await milestoneQuery.select()
  
  if (milestoneError) return errorResponse(milestoneError.message)
  
  // Build task update query
  let taskQuery = supabase
    .from('tasks')
    .update({ 
      assigned_to: toUserId,
      updated_at: new Date().toISOString()
    })
    .eq('assigned_to', fromUserId)
  
  if (!includeCompleted) {
    taskQuery = taskQuery.neq('status', 'done')
  }
  
  const { data: updatedTasks, error: taskError } = await taskQuery.select()
  
  if (taskError) return errorResponse(taskError.message)
  
  return successResponse({
    milestonesTransferred: updatedMilestones?.length || 0,
    tasksTransferred: updatedTasks?.length || 0
  }, 'Assignments transferred successfully')
}