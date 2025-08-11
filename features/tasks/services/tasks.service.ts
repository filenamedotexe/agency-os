import { createClient } from '@/shared/lib/supabase/client'
import { createClient as createServerClient } from '@/shared/lib/supabase/server'
import { sendTaskAssigned } from '@/app/actions/email'

export interface CreateTaskData {
  milestone_id: string
  title: string
  description?: string
  assignee_id: string
  status?: string
  priority?: string
  due_date?: string
  estimated_hours?: number
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  id: string
}

export class TasksService {
  static async createTask(data: CreateTaskData) {
    const supabase = createClient()
    
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        milestone_id: data.milestone_id,
        title: data.title,
        description: data.description,
        assignee_id: data.assignee_id,
        status: data.status || 'todo',
        priority: data.priority || 'medium',
        due_date: data.due_date,
        estimated_hours: data.estimated_hours,
      })
      .select()
      .single()
    
    // Send assignment email
    if (!error && task) {
      sendTaskAssigned(task.id).catch(error => {
        console.error('Failed to send task assignment email:', error)
      })
    }
    
    return { data: task, error }
  }
  
  static async assignTask(taskId: string, assigneeId: string) {
    const supabase = createClient()
    
    // Get current assignee to check if it's changing
    const { data: currentTask } = await supabase
      .from('tasks')
      .select('assignee_id')
      .eq('id', taskId)
      .single()
    
    // Update assignee
    const { data: task, error } = await supabase
      .from('tasks')
      .update({ assignee_id: assigneeId })
      .eq('id', taskId)
      .select()
      .single()
    
    // Send email if assignee changed
    if (!error && currentTask?.assignee_id !== assigneeId) {
      sendTaskAssigned(taskId).catch(error => {
        console.error('Failed to send task assignment email:', error)
      })
    }
    
    return { data: task, error }
  }
  
  static async updateTask(data: UpdateTaskData) {
    const supabase = createClient()
    
    // Get current task to check for assignee changes
    const { data: currentTask } = await supabase
      .from('tasks')
      .select('assignee_id')
      .eq('id', data.id)
      .single()
    
    const { data: task, error } = await supabase
      .from('tasks')
      .update({
        milestone_id: data.milestone_id,
        title: data.title,
        description: data.description,
        assignee_id: data.assignee_id,
        status: data.status,
        priority: data.priority,
        due_date: data.due_date,
        estimated_hours: data.estimated_hours,
      })
      .eq('id', data.id)
      .select()
      .single()
    
    // Send email if assignee changed
    if (!error && data.assignee_id && currentTask?.assignee_id !== data.assignee_id) {
      sendTaskAssigned(data.id).catch(error => {
        console.error('Failed to send task assignment email:', error)
      })
    }
    
    return { data: task, error }
  }
}