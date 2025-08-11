import { createClient } from '@/shared/lib/supabase/client'
import { createClient as createServerClient } from '@/shared/lib/supabase/server'
import { sendMilestoneComplete } from '@/app/actions/email'

export interface UpdateMilestoneData {
  id: string
  title?: string
  description?: string
  status?: string
  due_date?: string
  order_index?: number
}

export class ServicesService {
  static async updateMilestone(data: UpdateMilestoneData) {
    const supabase = createClient()
    
    // Get the current milestone to check status change
    const { data: currentMilestone } = await supabase
      .from('milestones')
      .select('status')
      .eq('id', data.id)
      .single()
    
    // Update milestone
    const { data: milestone, error } = await supabase
      .from('milestones')
      .update({
        title: data.title,
        description: data.description,
        status: data.status,
        due_date: data.due_date,
        order_index: data.order_index,
      })
      .eq('id', data.id)
      .select()
      .single()
    
    // Send email if status changed to complete
    if (!error && data.status === 'complete' && currentMilestone?.status !== 'complete') {
      sendMilestoneComplete(data.id).catch(error => {
        console.error('Failed to send milestone complete email:', error)
      })
    }
    
    return { data: milestone, error }
  }
}