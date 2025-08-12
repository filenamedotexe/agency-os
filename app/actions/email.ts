"use server"

import { Resend } from 'resend'
import { createClient } from '@/shared/lib/supabase/server'
import { WelcomeEmail } from '@/emails/templates/welcome'
import { MilestoneCompleteEmail } from '@/emails/templates/milestone-complete'
import { TaskAssignedEmail } from '@/emails/templates/task-assigned'
// Add this import at the top
import { sendSystemMessage } from './chat'

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }
  return new Resend(apiKey)
}

// Generic email sender with logging
async function sendEmail({
  to,
  subject,
  react,
  type,
  recipientId,
  metadata = {}
}: {
  to: string
  subject: string
  react: React.ReactElement
  type: string
  recipientId: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  
  try {
    // Send via Resend
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to,
      subject,
      react
    })
    
    // Log to database
    await supabase.from('email_logs').insert({
      recipient_id: recipientId,
      recipient_email: to,
      type,
      subject,
      status: error ? 'failed' : 'sent',
      error: error?.message,
      metadata: {
        ...metadata,
        resend_id: data?.id
      }
    })
    
    // Add to chat thread
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('client_id', recipientId)
      .single()
    
    if (conversation) {
      await sendSystemMessage({
        conversationId: conversation.id,
        content: `📧 Email sent: ${subject}`,
        metadata: {
          type: 'email_sent',
          email_type: type,
          subject,
          ...metadata
        }
      })
    }
    
    return { success: !error, data, error }
  } catch (err) {
    // Log failure
    await supabase.from('email_logs').insert({
      recipient_id: recipientId,
      recipient_email: to,
      type,
      subject,
      status: 'failed',
      error: err instanceof Error ? err.message : 'Unknown error',
      metadata
    })
    
    return { success: false, error: err }
  }
}

// Specific email functions
export async function sendClientWelcome(clientId: string) {
  const supabase = await createClient()
  
  // Get client data
  const { data: client } = await supabase
    .from('profiles')
    .select('*, client_profiles(*)')
    .eq('id', clientId)
    .single()
  
  if (!client) return { success: false, error: 'Client not found' }
  
  return sendEmail({
    to: client.email,
    subject: `Welcome to AgencyOS, ${client.first_name}!`,
    react: WelcomeEmail({
      firstName: client.first_name,
      companyName: client.client_profiles?.company_name,
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`
    }),
    type: 'welcome',
    recipientId: clientId,
    metadata: { client_name: client.first_name }
  })
}

export async function sendMilestoneComplete(milestoneId: string) {
  const supabase = await createClient()
  
  // Get milestone with service and client data
  const { data: milestone } = await supabase
    .from('milestones')
    .select(`
      *,
      service:services(
        *,
        client:profiles(*, client_profiles(*))
      )
    `)
    .eq('id', milestoneId)
    .single()
  
  if (!milestone?.service?.client) return { success: false, error: 'Data not found' }
  
  const client = milestone.service.client
  
  return sendEmail({
    to: client.email,
    subject: `Milestone Completed: ${milestone.title}`,
    react: MilestoneCompleteEmail({
      clientName: client.first_name,
      milestoneName: milestone.title,
      serviceName: milestone.service.name,
      nextSteps: milestone.description,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    }),
    type: 'milestone_complete',
    recipientId: client.id,
    metadata: { 
      milestone_id: milestoneId,
      service_id: milestone.service.id 
    }
  })
}

export async function sendTaskAssigned(taskId: string) {
  const supabase = await createClient()
  
  // Get task with assignee data
  const { data: task } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:profiles(*),
      milestone:milestones(
        *,
        service:services(*)
      )
    `)
    .eq('id', taskId)
    .single()
  
  if (!task?.assignee) return { success: false, error: 'Assignee not found' }
  
  return sendEmail({
    to: task.assignee.email,
    subject: `New Task: ${task.title}`,
    react: TaskAssignedEmail({
      assigneeName: task.assignee.first_name,
      taskTitle: task.title,
      taskDescription: task.description,
      dueDate: task.due_date,
      priority: task.priority,
      serviceName: task.milestone?.service?.name,
      taskUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tasks/${taskId}`
    }),
    type: 'task_assigned',
    recipientId: task.assignee.id,
    metadata: { 
      task_id: taskId,
      milestone_id: task.milestone_id 
    }
  })
}

// Database Template Management Functions

export interface EmailTemplate {
  id: string
  name: string
  slug: string
  subject: string
  description: string | null
  html_content: string
  text_content: string | null
  variables: Array<{ key: string; description: string }>
  is_active: boolean
  trigger_event: string | null
  created_at: string
  updated_at: string
}

// Fetch all email templates from database
export async function getEmailTemplates() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }
  
  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  
  if (profile?.role !== "admin") {
    return { error: "Unauthorized" }
  }
  
  const { data: templates, error } = await supabase
    .from("email_templates")
    .select("*")
    .order("created_at", { ascending: false })
  
  if (error) {
    console.error("Error fetching templates:", error)
    return { error: error.message }
  }
  
  return { templates }
}

// Toggle template active status
export async function toggleTemplateStatus(templateId: string, isActive: boolean) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }
  
  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  
  if (profile?.role !== "admin") {
    return { error: "Unauthorized" }
  }
  
  const { error } = await supabase
    .from("email_templates")
    .update({ 
      is_active: isActive,
      updated_at: new Date().toISOString(),
      updated_by: user.id
    })
    .eq("id", templateId)
  
  if (error) {
    console.error("Error updating template status:", error)
    return { error: error.message }
  }
  
  return { success: true }
}

// Update email template
export async function updateEmailTemplate(
  templateId: string,
  updates: Partial<EmailTemplate>
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }
  
  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  
  if (profile?.role !== "admin") {
    return { error: "Unauthorized" }
  }
  
  const { data: template, error } = await supabase
    .from("email_templates")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: user.id
    })
    .eq("id", templateId)
    .select()
    .single()
  
  if (error) {
    console.error("Error updating template:", error)
    return { error: error.message }
  }
  
  return { template }
}

// Test email function for admin
export async function sendTestEmail(template: string, recipientEmail: string) {
  const supabase = await createClient()
  
  // Get current user (must be admin)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
    
  if (profile?.role !== 'admin') {
    return { success: false, error: 'Admin only' }
  }
  
  // Send based on template type
  const templates = {
    welcome: WelcomeEmail({
      firstName: 'Test User',
      companyName: 'Test Company',
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`
    }),
    milestone: MilestoneCompleteEmail({
      clientName: 'Test User',
      milestoneName: 'Design Phase Complete',
      serviceName: 'Website Redesign',
      nextSteps: 'Development phase begins next week',
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    }),
    task: TaskAssignedEmail({
      assigneeName: 'Test User',
      taskTitle: 'Review mockups',
      taskDescription: 'Please review the latest mockups and provide feedback',
      dueDate: new Date().toISOString(),
      priority: 'high',
      serviceName: 'Website Redesign',
      taskUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tasks/test`
    })
  }
  
  const selectedTemplate = templates[template as keyof typeof templates]
  if (!selectedTemplate) return { success: false, error: 'Invalid template' }
  
  return sendEmail({
    to: recipientEmail,
    subject: `[TEST] ${template} email template`,
    react: selectedTemplate,
    type: `test_${template}`,
    recipientId: user.id,
    metadata: { test: true, template }
  })
}