"use server"

import { requireAuth, isAuthError, errorResponse, successResponse } from '@/shared/lib/auth-utils'
import { revalidatePath } from 'next/cache'
import { 
  ServiceTemplateWithMilestones,
  TemplateSummary,
  CreateServiceTemplateData,
  UpdateServiceTemplateData,
  TemplateColor,
  TemplateMilestone,
  TemplateTask,
  CreateTemplateData,
  ServiceTemplate
} from '@/shared/types'

// =====================================================
// GET ALL SERVICE TEMPLATES
// =====================================================
export async function getServiceTemplates() {
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase } = auth
  
  // Use the template_summary view for optimized queries
  const { data, error } = await supabase
    .from('template_summary')
    .select('*')
    .order('is_default', { ascending: false }) // Default templates first
    .order('created_at', { ascending: false })
  
  if (error) return errorResponse(error.message)
  
  return successResponse(data as TemplateSummary[], 'Templates retrieved successfully')
}

// =====================================================
// GET SINGLE SERVICE TEMPLATE WITH FULL DETAILS
// =====================================================
export async function getServiceTemplate(templateId: string) {
  if (!templateId) return errorResponse('Template ID is required')
  
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase } = auth
  
  // Get template with all milestones and tasks
  const { data, error } = await supabase
    .from('service_templates')
    .select(`
      *,
      created_by_profile:profiles!created_by(
        id,
        full_name,
        email,
        avatar_url
      ),
      milestones:template_milestones(
        *,
        tasks:template_tasks(
          *
        )
      )
    `)
    .eq('id', templateId)
    .single()
  
  if (error) return errorResponse(error.message)
  if (!data) return errorResponse('Template not found', 'NOT_FOUND')
  
  // Sort milestones by position
  if (data.milestones) {
    data.milestones.sort((a: TemplateMilestone, b: TemplateMilestone) => a.position - b.position)
    
    // Sort tasks within each milestone by position
    data.milestones.forEach((milestone: TemplateMilestone) => {
      if (milestone.tasks) {
        milestone.tasks.sort((a: TemplateTask, b: TemplateTask) => a.position - b.position)
      }
    })
  }
  
  return successResponse(data as ServiceTemplateWithMilestones, 'Template retrieved successfully')
}

// =====================================================
// CREATE NEW SERVICE TEMPLATE
// =====================================================
export async function createServiceTemplate(data: CreateServiceTemplateData) {
  // Validate required fields
  if (!data.name || data.name.trim().length === 0) {
    return errorResponse('Template name is required')
  }
  
  if (data.name.length > 255) {
    return errorResponse('Template name must be 255 characters or less')
  }
  
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { serviceClient, user } = auth
  
  // Validate color if provided
  const validColors: TemplateColor[] = ['blue', 'green', 'purple', 'orange', 'pink', 'red', 'yellow', 'indigo', 'gray']
  if (data.color && !validColors.includes(data.color as TemplateColor)) {
    return errorResponse('Invalid color selection')
  }
  
  try {
    // Create the template
    const { data: template, error: templateError } = await serviceClient
      .from('service_templates')
      .insert({
        name: data.name.trim(),
        description: data.description?.trim() || null,
        color: data.color || 'blue',
        created_by: user.id,
        is_default: false
      })
      .select()
      .single()
    
    if (templateError) return errorResponse(templateError.message)
    
    // Create milestones if provided
    if (data.milestones && data.milestones.length > 0) {
      for (const [index, milestoneData] of data.milestones.entries()) {
        if (!milestoneData.name || milestoneData.name.trim().length === 0) {
          return errorResponse(`Milestone ${index + 1} name is required`)
        }
        
        if (milestoneData.name.length > 255) {
          return errorResponse(`Milestone ${index + 1} name must be 255 characters or less`)
        }
        
        // Validate relative dates - convert strings to numbers for comparison
        const startDays = typeof milestoneData.relative_start_days === 'string' 
          ? parseInt(milestoneData.relative_start_days, 10) || 0
          : milestoneData.relative_start_days || 0
        const dueDays = typeof milestoneData.relative_due_days === 'string' 
          ? parseInt(milestoneData.relative_due_days, 10) 
          : milestoneData.relative_due_days
        
        if (startDays < 0) {
          return errorResponse(`Milestone ${index + 1} start days cannot be negative`)
        }
        
        if (dueDays !== undefined && dueDays !== null && dueDays < startDays) {
          return errorResponse(`Milestone ${index + 1} due date must be after start date`)
        }
        
        const { data: milestone, error: milestoneError } = await serviceClient
          .from('template_milestones')
          .insert({
            template_id: template.id,
            name: milestoneData.name.trim(),
            description: milestoneData.description?.trim() || null,
            position: milestoneData.position,
            relative_start_days: startDays,
            relative_due_days: dueDays
          })
          .select()
          .single()
        
        if (milestoneError) return errorResponse(milestoneError.message)
        
        // Create tasks if provided
        if (milestoneData.tasks && milestoneData.tasks.length > 0) {
          for (const [taskIndex, taskData] of milestoneData.tasks.entries()) {
            if (!taskData.title || taskData.title.trim().length === 0) {
              return errorResponse(`Task ${taskIndex + 1} in milestone ${index + 1} title is required`)
            }
            
            if (taskData.title.length > 255) {
              return errorResponse(`Task ${taskIndex + 1} in milestone ${index + 1} title must be 255 characters or less`)
            }
            
            // Validate task priority
            const validPriorities = ['low', 'medium', 'high', 'urgent']
            if (taskData.priority && !validPriorities.includes(taskData.priority)) {
              return errorResponse(`Task ${taskIndex + 1} in milestone ${index + 1} has invalid priority`)
            }
            
            // Validate task visibility
            const validVisibilities = ['internal', 'client']
            if (taskData.visibility && !validVisibilities.includes(taskData.visibility)) {
              return errorResponse(`Task ${taskIndex + 1} in milestone ${index + 1} has invalid visibility`)
            }
            
            // Validate estimated hours
            if (taskData.estimated_hours !== undefined && taskData.estimated_hours !== null && taskData.estimated_hours <= 0) {
              return errorResponse(`Task ${taskIndex + 1} in milestone ${index + 1} estimated hours must be positive`)
            }
            
            // Validate relative due days - convert string to number for comparison
            const taskDueDays = typeof taskData.relative_due_days === 'string' 
              ? parseInt(taskData.relative_due_days, 10) 
              : taskData.relative_due_days
            if (taskDueDays !== undefined && taskDueDays !== null && taskDueDays < 0) {
              return errorResponse(`Task ${taskIndex + 1} in milestone ${index + 1} relative due days cannot be negative`)
            }
            
            const { error: taskError } = await serviceClient
              .from('template_tasks')
              .insert({
                template_milestone_id: milestone.id,
                title: taskData.title.trim(),
                description: taskData.description?.trim() || null,
                priority: taskData.priority || 'medium',
                estimated_hours: taskData.estimated_hours || null,
                position: taskData.position,
                relative_due_days: taskData.relative_due_days || null,
                visibility: taskData.visibility || 'internal'
              })
            
            if (taskError) return errorResponse(taskError.message)
          }
        }
      }
    }
    
    revalidatePath('/services')
    revalidatePath('/services/templates')
    
    return successResponse(template, 'Template created successfully')
    
  } catch (error) {
    console.error('Error creating template:', error)
    return errorResponse('Failed to create template')
  }
}

// =====================================================
// UPDATE SERVICE TEMPLATE
// =====================================================
export async function updateServiceTemplate(
  templateId: string,
  updates: UpdateServiceTemplateData
) {
  if (!templateId) return errorResponse('Template ID is required')
  
  // Validate updates
  if (updates.name !== undefined) {
    if (!updates.name || updates.name.trim().length === 0) {
      return errorResponse('Template name cannot be empty')
    }
    if (updates.name.length > 255) {
      return errorResponse('Template name must be 255 characters or less')
    }
  }
  
  if (updates.color !== undefined) {
    const validColors: TemplateColor[] = ['blue', 'green', 'purple', 'orange', 'pink', 'red', 'yellow', 'indigo', 'gray']
    if (!validColors.includes(updates.color as TemplateColor)) {
      return errorResponse('Invalid color selection')
    }
  }
  
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase, user } = auth
  
  // Check if template exists and user has permission
  const { data: existingTemplate, error: checkError } = await supabase
    .from('service_templates')
    .select('id, created_by')
    .eq('id', templateId)
    .single()
  
  if (checkError || !existingTemplate) {
    return errorResponse('Template not found')
  }
  
  // Check permissions: creator or admin can update
  const isCreator = existingTemplate.created_by === user.id
  const isAdmin = user.role === 'admin'
  
  if (!isCreator && !isAdmin) {
    return errorResponse('You do not have permission to update this template')
  }
  
  // Filter out undefined values
  const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      if (key === 'name' || key === 'description') {
        acc[key] = value?.trim() || null
      } else {
        acc[key] = value
      }
    }
    return acc
  }, {} as Record<string, unknown>)
  
  if (Object.keys(cleanUpdates).length === 0) {
    return errorResponse('No updates provided')
  }
  
  const { data, error } = await supabase
    .from('service_templates')
    .update(cleanUpdates)
    .eq('id', templateId)
    .select()
    .single()
  
  if (error) return errorResponse(error.message)
  if (!data) return errorResponse('Template not found')
  
  revalidatePath('/services/templates')
  revalidatePath(`/services/templates/${templateId}`)
  
  return successResponse(data, 'Template updated successfully')
}

// =====================================================
// DELETE SERVICE TEMPLATE
// =====================================================
export async function deleteServiceTemplate(templateId: string) {
  if (!templateId) return errorResponse('Template ID is required')
  
  const auth = await requireAuth(['admin'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase } = auth
  
  // Check if template exists
  const { data: template, error: checkError } = await supabase
    .from('service_templates')
    .select('id, name, is_default')
    .eq('id', templateId)
    .single()
  
  if (checkError || !template) {
    return errorResponse('Template not found')
  }
  
  // Prevent deletion of default templates
  if (template.is_default) {
    return errorResponse('Cannot delete default templates')
  }
  
  // Delete template (cascade will handle milestones and tasks)
  const { error } = await supabase
    .from('service_templates')
    .delete()
    .eq('id', templateId)
  
  if (error) return errorResponse(error.message)
  
  revalidatePath('/services/templates')
  
  return successResponse({ id: templateId }, `Template "${template.name}" deleted successfully`)
}

// =====================================================
// CREATE TEMPLATE FROM EXISTING SERVICE
// =====================================================
export async function createTemplateFromService(
  serviceId: string,
  templateData: { name: string; description?: string; color?: string }
) {
  if (!serviceId) return errorResponse('Service ID is required')
  if (!templateData.name || templateData.name.trim().length === 0) {
    return errorResponse('Template name is required')
  }
  
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { serviceClient, user } = auth
  
  // Get the service with all milestones and tasks
  const { data: service, error: serviceError } = await serviceClient
    .from('services')
    .select(`
      *,
      milestones(
        *,
        tasks(*)
      )
    `)
    .eq('id', serviceId)
    .single()
  
  if (serviceError || !service) {
    return errorResponse('Service not found')
  }
  
  try {
    // Create the template
    const { data: template, error: templateError } = await serviceClient
      .from('service_templates')
      .insert({
        name: templateData.name.trim(),
        description: templateData.description?.trim() || null,
        color: templateData.color || service.color || 'blue',
        created_by: user.id,
        is_default: false
      })
      .select()
      .single()
    
    if (templateError) return errorResponse(templateError.message)
    
    // Convert service milestones to template milestones
    if (service.milestones && service.milestones.length > 0) {
      const serviceStartDate = service.start_date ? new Date(service.start_date) : new Date()
      
      for (const milestone of service.milestones) {
        // Calculate relative days from service start
        const relativeStartDays = 0
        let relativeDueDays = null
        
        if (milestone.due_date) {
          const dueDate = new Date(milestone.due_date)
          const diffTime = dueDate.getTime() - serviceStartDate.getTime()
          relativeDueDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
        }
        
        const { data: templateMilestone, error: milestoneError } = await serviceClient
          .from('template_milestones')
          .insert({
            template_id: template.id,
            name: milestone.name,
            description: milestone.description,
            position: milestone.position || 0,
            relative_start_days: relativeStartDays,
            relative_due_days: relativeDueDays
          })
          .select()
          .single()
        
        if (milestoneError) return errorResponse(milestoneError.message)
        
        // Convert tasks to template tasks
        if (milestone.tasks && milestone.tasks.length > 0) {
          for (const task of milestone.tasks) {
            // Calculate relative days from milestone start
            let relativeTaskDueDays = null
            
            if (task.due_date && milestone.due_date) {
              const taskDueDate = new Date(task.due_date)
              const milestoneDate = new Date(milestone.due_date)
              const diffTime = taskDueDate.getTime() - milestoneDate.getTime()
              relativeTaskDueDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
            }
            
            const { error: taskError } = await serviceClient
              .from('template_tasks')
              .insert({
                template_milestone_id: templateMilestone.id,
                title: task.title,
                description: task.description,
                priority: task.priority,
                estimated_hours: task.estimated_hours ? parseInt(task.estimated_hours) : null,
                position: task.position,
                relative_due_days: relativeTaskDueDays,
                visibility: task.visibility
              })
            
            if (taskError) return errorResponse(taskError.message)
          }
        }
      }
    }
    
    revalidatePath('/services/templates')
    
    return successResponse(template, 'Template created from service successfully')
    
  } catch (error) {
    console.error('Error creating template from service:', error)
    return errorResponse('Failed to create template from service')
  }
}

// =====================================================
// CREATE SERVICE FROM TEMPLATE
// =====================================================
export async function createServiceFromTemplate(
  templateId: string,
  serviceData: {
    client_id: string
    name: string
    description?: string
    start_date?: string
    end_date?: string
    budget?: number
  }
) {
  if (!templateId) return errorResponse('Template ID is required')
  if (!serviceData.client_id || !serviceData.name) {
    return errorResponse('Client ID and service name are required')
  }
  
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { serviceClient, user } = auth
  
  // Get the template with all milestones and tasks
  const { data: template, error: templateError } = await serviceClient
    .from('service_templates')
    .select(`
      *,
      milestones:template_milestones(
        *,
        tasks:template_tasks(*)
      )
    `)
    .eq('id', templateId)
    .single()
  
  if (templateError || !template) {
    return errorResponse('Template not found')
  }
  
  // Validate client exists
  const { data: client, error: clientError } = await serviceClient
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', serviceData.client_id)
    .single()
  
  if (clientError || !client) {
    return errorResponse('Invalid client ID')
  }
  
  // Import smart date utilities
  const { calculateMilestoneDate, calculateTaskDate, isValidDateString, getCurrentDateString } = 
    await import('@/shared/lib/smart-dates')
  
  try {
    // Create the service
    const { data: service, error: serviceError } = await serviceClient
      .from('services')
      .insert({
        client_id: serviceData.client_id,
        name: serviceData.name.trim(),
        description: serviceData.description?.trim() || template.description,
        start_date: serviceData.start_date || getCurrentDateString(),
        end_date: serviceData.end_date || null,
        budget: serviceData.budget?.toString() || '0',
        color: template.color,
        created_by: user.id,
        status: 'planning'
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
    
    // Create milestones from template with smart dates
    if (template.milestones && template.milestones.length > 0) {
      const serviceStartDate = service.start_date
      
      for (const templateMilestone of template.milestones) {
        // Calculate milestone dates
        const milestoneStartDate = serviceStartDate && templateMilestone.relative_start_days !== null
          ? calculateMilestoneDate(serviceStartDate, templateMilestone.relative_start_days)
          : null
          
        const milestoneDueDate = serviceStartDate && templateMilestone.relative_due_days !== null
          ? calculateMilestoneDate(serviceStartDate, templateMilestone.relative_due_days)
          : null
        
        const { data: milestone, error: milestoneError } = await serviceClient
          .from('milestones')
          .insert({
            service_id: service.id,
            name: templateMilestone.name,
            description: templateMilestone.description,
            position: templateMilestone.position,
            due_date: milestoneDueDate,
            status: 'upcoming',
            assignee_id: null
          })
          .select()
          .single()
        
        if (milestoneError) return errorResponse(milestoneError.message)
        
        // Create tasks from template with smart dates
        if (templateMilestone.tasks && templateMilestone.tasks.length > 0) {
          for (const templateTask of templateMilestone.tasks) {
            // Calculate task due date relative to milestone start
            const taskDueDate = milestoneStartDate && templateTask.relative_due_days !== null
              ? calculateTaskDate(milestoneStartDate, templateTask.relative_due_days)
              : null
            
            const { error: taskError } = await serviceClient
              .from('tasks')
              .insert({
                milestone_id: milestone.id,
                title: templateTask.title,
                description: templateTask.description,
                priority: templateTask.priority,
                estimated_hours: templateTask.estimated_hours?.toString() || null,
                position: templateTask.position,
                due_date: taskDueDate,
                status: 'todo',
                assigned_to: null,
                created_by: user.id,
                visibility: templateTask.visibility
              })
            
            if (taskError) return errorResponse(taskError.message)
          }
        }
      }
    } else {
      // If template has no milestones, create default ones
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
    }
    
    revalidatePath('/services')
    revalidatePath('/dashboard')
    
    return successResponse(service, `Service created from template "${template.name}" successfully`)
    
  } catch (error) {
    console.error('Error creating service from template:', error)
    return errorResponse('Failed to create service from template')
  }
}

// =====================================================
// GET TEMPLATE STATS (for dashboard)
// =====================================================
export async function getTemplateStats() {
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase } = auth
  
  // Get template counts
  const { data: templates, error } = await supabase
    .from('service_templates')
    .select('is_default')
  
  if (error) return errorResponse(error.message)
  
  const stats = {
    total: templates?.length || 0,
    default: templates?.filter(t => t.is_default).length || 0,
    custom: templates?.filter(t => !t.is_default).length || 0
  }
  
  return successResponse(stats, 'Template stats retrieved')
}