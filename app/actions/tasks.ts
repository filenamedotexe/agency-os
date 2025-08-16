"use server"

import { requireAuth, isAuthError, errorResponse, successResponse } from '@/shared/lib/auth-utils'
import { revalidatePath } from 'next/cache'

// =====================================================
// GET TASKS FOR A MILESTONE
// =====================================================
export async function getTasks(milestoneId: string) {
  if (!milestoneId) return errorResponse('Milestone ID is required')
  
  const auth = await requireAuth()
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase, user } = auth
  
  // Check access via milestone -> service
  const { data: milestone, error: milestoneError } = await supabase
    .from('milestones')
    .select(`
      id,
      service:services!inner(
        id,
        client_id
      )
    `)
    .eq('id', milestoneId)
    .single()
  
  if (milestoneError || !milestone) {
    return errorResponse('Milestone not found')
  }
  
  // Check client access
  if (user.role === 'client' && milestone.service?.client_id !== user.id) {
    return errorResponse('You do not have access to this milestone', 'FORBIDDEN')
  }
  
  // Get tasks with details
  const { data, error } = await supabase
    .from('tasks')
    .select(`
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
        id,
        content,
        created_at,
        user:profiles!user_id(
          id,
          full_name,
          avatar_url
        )
      )
    `)
    .eq('milestone_id', milestoneId)
    .order('status', { ascending: true })
    .order('position', { ascending: true })
  
  if (error) return errorResponse(error.message)
  
  // Group tasks by status
  const tasksByStatus = {
    todo: [] as unknown[],
    in_progress: [] as unknown[],
    review: [] as unknown[],
    done: [] as unknown[],
    blocked: [] as unknown[]
  }
  
  data?.forEach(task => {
    if (tasksByStatus[task.status as keyof typeof tasksByStatus]) {
      tasksByStatus[task.status as keyof typeof tasksByStatus].push(task)
    }
  })
  
  return successResponse({
    tasks: data || [],
    tasksByStatus,
    total: data?.length || 0
  }, 'Tasks retrieved successfully')
}

// =====================================================
// CREATE NEW TASK
// =====================================================
export async function createTask(data: {
  milestone_id: string
  title: string
  description?: string
  assigned_to?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  status?: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
}) {
  if (!data.milestone_id || !data.title) {
    return errorResponse('Milestone ID and task title are required')
  }
  
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { serviceClient, user } = auth
  
  // Get next position for the status column
  const targetStatus = data.status || 'todo'
  const { data: existingTasks } = await serviceClient
    .from('tasks')
    .select('position')
    .eq('milestone_id', data.milestone_id)
    .eq('status', targetStatus)
    .order('position', { ascending: false })
    .limit(1)
  
  const nextPosition = existingTasks?.[0]?.position !== undefined
    ? existingTasks[0].position + 1
    : 0
  
  // Create the task
  const { data: task, error } = await serviceClient
    .from('tasks')
    .insert({
      milestone_id: data.milestone_id,
      title: data.title,
      description: data.description,
      assigned_to: data.assigned_to,
      priority: data.priority || 'medium',
      due_date: data.due_date,
      status: targetStatus,
      position: nextPosition,
      created_by: user.id
    })
    .select(`
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
      )
    `)
    .single()
  
  if (error) return errorResponse(error.message)
  
  // Get service_id for revalidation
  const { data: milestone } = await serviceClient
    .from('milestones')
    .select('service_id')
    .eq('id', data.milestone_id)
    .single()
  
  if (milestone?.service_id) {
    revalidatePath(`/services/${milestone.service_id}`)
  }
  
  return successResponse(task, 'Task created successfully')
}

// =====================================================
// UPDATE TASK
// =====================================================
export async function updateTask(
  taskId: string,
  updates: {
    title?: string
    description?: string
    assigned_to?: string | null
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    due_date?: string | null
    status?: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
  }
) {
  if (!taskId) return errorResponse('Task ID is required')
  
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase } = auth
  
  // Get current task for service_id
  const { data: currentTask, error: fetchError } = await supabase
    .from('tasks')
    .select(`
      id,
      status,
      position,
      milestone_id,
      milestone:milestones!inner(
        id,
        service_id
      )
    `)
    .eq('id', taskId)
    .single()
  
  if (fetchError || !currentTask) {
    return errorResponse('Task not found')
  }
  
  // Filter out undefined values
  const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
    if (value !== undefined) acc[key] = value
    return acc
  }, {} as Record<string, unknown>)
  
  // Handle status change - need to update positions
  if (updates.status && updates.status !== currentTask.status) {
    // Get next position in new status column
    const { data: tasksInNewStatus } = await supabase
      .from('tasks')
      .select('position')
      .eq('milestone_id', currentTask.milestone_id)
      .eq('status', updates.status)
      .order('position', { ascending: false })
      .limit(1)
    
    cleanUpdates.position = tasksInNewStatus?.[0]?.position !== undefined
      ? tasksInNewStatus[0].position + 1
      : 0
  }
  
  // Add completed_at if marking as done
  if (updates.status === 'done') {
    cleanUpdates.completed_at = new Date().toISOString()
  } else if (updates.status) {
    cleanUpdates.completed_at = null
  }
  
  // Update the task
  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...cleanUpdates,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select(`
      *,
      assigned_to:profiles!assigned_to(
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .single()
  
  if (error) return errorResponse(error.message)
  
  revalidatePath(`/services/${currentTask.milestone?.service_id}`)
  
  return successResponse(data, 'Task updated successfully')
}

// =====================================================
// UPDATE TASK STATUS
// =====================================================
export async function updateTaskStatus(
  taskId: string,
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
) {
  return updateTask(taskId, { status })
}

// =====================================================
// UPDATE TASK POSITION (DRAG & DROP)
// =====================================================
export async function updateTaskPosition(
  taskId: string,
  newStatus: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked',
  newPosition: number,
  targetMilestoneId?: string
) {
  if (!taskId || newStatus === undefined || newPosition === undefined) {
    return errorResponse('Task ID, status, and position are required')
  }
  
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase, serviceClient } = auth
  
  // Get current task info
  const { data: currentTask, error: fetchError } = await supabase
    .from('tasks')
    .select(`
      *,
      milestone:milestones!inner(
        id,
        service_id
      )
    `)
    .eq('id', taskId)
    .single()
  
  if (fetchError || !currentTask) {
    return errorResponse('Task not found')
  }
  
  const milestoneId = targetMilestoneId || currentTask.milestone_id
  const oldStatus = currentTask.status
  const oldPosition = currentTask.position
  
  // If moving within same column and position
  if (milestoneId === currentTask.milestone_id && 
      newStatus === oldStatus && 
      newPosition === oldPosition) {
    return successResponse(currentTask, 'Task already in position')
  }
  
  // If changing milestone or status, update positions in old location
  if (milestoneId !== currentTask.milestone_id || newStatus !== oldStatus) {
    // Shift tasks up in old column
    const { data: tasksToShiftUp } = await serviceClient
      .from('tasks')
      .select('id, position')
      .eq('milestone_id', currentTask.milestone_id)
      .eq('status', oldStatus)
      .gt('position', oldPosition)
    
    for (const task of tasksToShiftUp || []) {
      await serviceClient
        .from('tasks')
        .update({ position: task.position - 1 })
        .eq('id', task.id)
    }
  }
  
  // Shift tasks down in new location to make space
  const { data: tasksToShiftDown } = await serviceClient
    .from('tasks')
    .select('id, position')
    .eq('milestone_id', milestoneId)
    .eq('status', newStatus)
    .gte('position', newPosition)
    .neq('id', taskId)
  
  for (const task of tasksToShiftDown || []) {
    await serviceClient
      .from('tasks')
      .update({ position: task.position + 1 })
      .eq('id', task.id)
  }
  
  // Update the task itself
  const { data, error } = await supabase
    .from('tasks')
    .update({
      milestone_id: milestoneId,
      status: newStatus,
      position: newPosition,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select(`
      *,
      assigned_to:profiles!assigned_to(
        id,
        full_name,
        avatar_url
      )
    `)
    .single()
  
  if (error) return errorResponse(error.message)
  
  // Revalidate both old and new service pages if different
  revalidatePath(`/services/${currentTask.milestone?.service_id}`)
  if (targetMilestoneId) {
    const { data: newMilestone } = await supabase
      .from('milestones')
      .select('service_id')
      .eq('id', targetMilestoneId)
      .single()
    
    if (newMilestone?.service_id && newMilestone.service_id !== currentTask.milestone?.service_id) {
      revalidatePath(`/services/${newMilestone.service_id}`)
    }
  }
  
  return successResponse(data, 'Task moved successfully')
}

// =====================================================
// DELETE TASK
// =====================================================
export async function deleteTask(taskId: string) {
  if (!taskId) return errorResponse('Task ID is required')
  
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase, serviceClient } = auth
  
  // Get task details for reordering
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      milestone_id,
      status,
      position,
      milestone:milestones!inner(
        service_id
      )
    `)
    .eq('id', taskId)
    .single()
  
  if (fetchError || !task) {
    return errorResponse('Task not found')
  }
  
  // Delete the task
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
  
  if (error) return errorResponse(error.message)
  
  // Reorder remaining tasks in the column
  const { data: remainingTasks } = await serviceClient
    .from('tasks')
    .select('id, position')
    .eq('milestone_id', task.milestone_id)
    .eq('status', task.status)
    .gt('position', task.position)
  
  for (const t of remainingTasks || []) {
    await serviceClient
      .from('tasks')
      .update({ position: t.position - 1 })
      .eq('id', t.id)
  }
  
  revalidatePath(`/services/${task.milestone?.service_id}`)
  
  return successResponse({ id: taskId }, `Task "${task.title}" deleted successfully`)
}

// =====================================================
// BULK UPDATE TASKS
// =====================================================
export async function bulkUpdateTasks(
  updates: Array<{
    id: string
    status?: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
    assigned_to?: string | null
    priority?: 'low' | 'medium' | 'high' | 'urgent'
  }>
) {
  if (!updates?.length) {
    return errorResponse('Updates array is required')
  }
  
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase } = auth
  
  // Process each update
  const results = await Promise.all(
    updates.map(update => {
      const { id, ...changes } = update
      return supabase
        .from('tasks')
        .update({
          ...changes,
          completed_at: changes.status === 'done' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
    })
  )
  
  // Check for errors
  const errors = results.filter(r => r.error)
  if (errors.length > 0) {
    return errorResponse(`Failed to update ${errors.length} tasks`)
  }
  
  // Get service IDs for revalidation
  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      milestone:milestones!inner(
        service_id
      )
    `)
    .in('id', updates.map(u => u.id))
  
  // Revalidate unique service pages
  const serviceIds = [...new Set(tasks?.map(t => t.milestone?.service_id).filter(Boolean) || [])]
  serviceIds.forEach(id => revalidatePath(`/services/${id}`))
  
  return successResponse(
    { updated: updates.length },
    `${updates.length} tasks updated successfully`
  )
}

// =====================================================
// CREATE TASK COMMENT
// =====================================================
export async function createTaskComment(
  taskId: string,
  content: string
) {
  if (!taskId || !content?.trim()) {
    return errorResponse('Task ID and comment content are required')
  }
  
  const auth = await requireAuth()
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { serviceClient, user } = auth
  
  // Verify task exists and user has access
  const { data: task, error: taskError } = await serviceClient
    .from('tasks')
    .select(`
      id,
      milestone:milestones!inner(
        service_id,
        service:services!inner(
          client_id
        )
      )
    `)
    .eq('id', taskId)
    .single()
  
  if (taskError || !task) {
    return errorResponse('Task not found')
  }
  
  // Check client access
  if (user.role === 'client' && 
      task.milestone?.service?.client_id !== user.id) {
    return errorResponse('You do not have access to this task', 'FORBIDDEN')
  }
  
  // Create comment
  const { data, error } = await serviceClient
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: user.id,
      content: content.trim()
    })
    .select(`
      *,
      user:profiles!user_id(
        id,
        full_name,
        avatar_url
      )
    `)
    .single()
  
  if (error) return errorResponse(error.message)
  
  revalidatePath(`/services/${task.milestone?.service_id}`)
  
  return successResponse(data, 'Comment added successfully')
}

// =====================================================
// UPDATE TASK COMMENT
// =====================================================
export async function updateTaskComment(
  commentId: string,
  content: string
) {
  if (!commentId || !content?.trim()) {
    return errorResponse('Comment ID and content are required')
  }
  
  const auth = await requireAuth()
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase, user } = auth
  
  // Only allow users to edit their own comments (unless admin)
  let query = supabase
    .from('task_comments')
    .update({
      content: content.trim(),
      updated_at: new Date().toISOString()
    })
    .eq('id', commentId)
  
  if (user.role !== 'admin') {
    query = query.eq('user_id', user.id)
  }
  
  const { data, error } = await query
    .select(`
      *,
      user:profiles!user_id(
        id,
        full_name,
        avatar_url
      )
    `)
    .single()
  
  if (error) return errorResponse(error.message)
  if (!data) return errorResponse('Comment not found or you cannot edit it')
  
  // Get service_id for revalidation
  const { data: task } = await supabase
    .from('tasks')
    .select(`
      milestone:milestones!inner(
        service_id
      )
    `)
    .eq('id', data.task_id)
    .single()
  
  if (task?.milestone?.service_id) {
    revalidatePath(`/services/${task.milestone.service_id}`)
  }
  
  return successResponse(data, 'Comment updated successfully')
}

// =====================================================
// DELETE TASK COMMENT
// =====================================================
export async function deleteTaskComment(commentId: string) {
  if (!commentId) return errorResponse('Comment ID is required')
  
  const auth = await requireAuth()
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase, user } = auth
  
  // Get comment to check ownership and get task_id
  const { data: comment, error: fetchError } = await supabase
    .from('task_comments')
    .select(`
      id,
      task_id,
      user_id,
      task:tasks!inner(
        milestone:milestones!inner(
          service_id
        )
      )
    `)
    .eq('id', commentId)
    .single()
  
  if (fetchError || !comment) {
    return errorResponse('Comment not found')
  }
  
  // Only allow users to delete their own comments (unless admin)
  if (user.role !== 'admin' && comment.user_id !== user.id) {
    return errorResponse('You can only delete your own comments', 'FORBIDDEN')
  }
  
  // Delete the comment
  const { error } = await supabase
    .from('task_comments')
    .delete()
    .eq('id', commentId)
  
  if (error) return errorResponse(error.message)
  
  revalidatePath(`/services/${comment.task?.milestone?.service_id}`)
  
  return successResponse({ id: commentId }, 'Comment deleted successfully')
}

// =====================================================
// GET TASK STATS
// =====================================================
export async function getTaskStats(milestoneId?: string) {
  const auth = await requireAuth()
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase, user } = auth
  
  let query = supabase
    .from('tasks')
    .select('status, priority, milestone_id')
  
  if (milestoneId) {
    query = query.eq('milestone_id', milestoneId)
  } else if (user.role === 'client') {
    // For clients, only count tasks from their services
    const { data: services } = await supabase
      .from('services')
      .select('milestones(id)')
      .eq('client_id', user.id)
    
    const milestoneIds = services?.flatMap(s => s.milestones?.map((m: { id: string }) => m.id)) || []
    if (milestoneIds.length) {
      query = query.in('milestone_id', milestoneIds)
    }
  }
  
  const { data, error } = await query
  
  if (error) return errorResponse(error.message)
  
  const stats = {
    total: data?.length || 0,
    byStatus: {
      todo: data?.filter(t => t.status === 'todo').length || 0,
      in_progress: data?.filter(t => t.status === 'in_progress').length || 0,
      review: data?.filter(t => t.status === 'review').length || 0,
      done: data?.filter(t => t.status === 'done').length || 0,
      blocked: data?.filter(t => t.status === 'blocked').length || 0
    },
    byPriority: {
      low: data?.filter(t => t.priority === 'low').length || 0,
      medium: data?.filter(t => t.priority === 'medium').length || 0,
      high: data?.filter(t => t.priority === 'high').length || 0,
      urgent: data?.filter(t => t.priority === 'urgent').length || 0
    }
  }
  
  return successResponse(stats, 'Task stats retrieved')
}