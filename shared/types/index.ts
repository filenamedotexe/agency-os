// User and Profile Types
export type UserRole = "admin" | "team_member" | "client"

export interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name?: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface ClientProfile {
  id: string
  profile_id: string
  company_name: string | null
  phone: string | null
  address: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  } | null
  industry: string | null
  website: string | null
  company_size: string | null
  annual_revenue: string | null
  notes: string | null
  tags: string[] | null
  created_at: string
}

export interface ProfileWithClient extends Profile {
  client_profiles?: ClientProfile | null
}

// Service Types
export interface Service {
  id: string
  name: string
  description: string | null
  client_id: string | null
  status: ServiceStatus
  budget: string
  start_date: string | null
  end_date: string | null
  created_by: string | null
  created_at: string
  color?: string
}

export type ServiceStatus = "planning" | "active" | "paused" | "completed" | "cancelled"

export interface Milestone {
  id: string
  service_id: string
  name: string // Changed from 'title' to match database
  description: string | null
  due_date: string | null
  status: MilestoneStatus
  position: number | null // Changed from 'order_index' to match database
  assignee_id: string | null // NEW: Added for assignee system
  completed_at: string | null // Added to match database
  updated_at: string | null // Added to match database
  created_at: string
}

// Updated to match database constraints
export type MilestoneStatus = "upcoming" | "in_progress" | "completed" | "delayed"

export interface Task {
  id: string
  milestone_id: string
  title: string
  description: string | null
  assigned_to: string | null // Changed from 'assignee_id' to match database
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  estimated_hours: string | null
  actual_hours: string | null
  position: number // Added to match database
  completed_at: string | null // Added to match database
  created_by: string | null // Added to match database
  visibility: TaskVisibility // NEW: Added for client visibility control
  updated_at: string | null // Added to match database
  created_at: string
}

// Updated to match database constraints
export type TaskStatus = "todo" | "in_progress" | "review" | "done" | "blocked"
export type TaskPriority = "low" | "medium" | "high" | "urgent"
export type TaskVisibility = "internal" | "client" // NEW: For controlling client access

// Extended Types for Relations
export interface ServiceWithMilestones extends Service {
  milestones?: MilestoneWithTasks[]
  profiles?: Profile // Client profile
}

export interface MilestoneWithTasks extends Milestone {
  tasks?: TaskWithAssignee[]
  assignee?: Profile // NEW: Assignee profile relation
}

export interface TaskWithAssignee extends Task {
  assigned_to_profile?: Profile // NEW: Assigned user profile
  created_by_profile?: Profile // NEW: Creator profile
  comments?: TaskComment[] // Comments on the task
}

// NEW: Extended types for UI components
export interface MilestoneWithAssignee extends Milestone {
  assignee: Profile | null
  assignee_profile?: Profile | null // For component compatibility
  tasks?: TaskWithAssignee[]
}

export interface TaskWithDetails extends Task {
  milestone?: Milestone
  assigned_to_profile?: Profile
  created_by_profile?: Profile
}

// Task Comments
export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  user?: Profile // User who made the comment
}

export interface ServiceFull extends Service {
  milestones?: MilestoneWithAssignee[]
  profiles?: Profile // Client profile
  client_profiles?: ClientProfile // Extended client info
}

// Knowledge Base Types
export interface KnowledgeCollection {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  visibility: "public" | "team" | "private"
  created_by: string
  created_at: string
  updated_at: string
}

export interface KnowledgeResource {
  id: string
  collection_id: string
  title: string
  description: string | null
  content: string | null
  url: string | null
  file_url: string | null
  file_name: string | null
  file_size: number | null
  file_type: string | null
  resource_type: "link" | "file" | "note"
  tags: string[] | null
  created_by: string
  created_at: string
  updated_at: string
}

// Conversation & Message Types
export interface Conversation {
  id: string
  client_id: string
  subject: string | null
  last_message_at: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  attachments: MessageAttachment[] | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface MessageAttachment {
  id: string
  name: string
  size: number
  type: string
  url: string
}

// Service Events (for activity tracking)
export interface ServiceEvent {
  id: string
  service_id: string
  milestone_id: string | null
  task_id: string | null
  user_id: string
  event_type: string
  description: string
  metadata: Record<string, any> | null
  created_at: string
}

// Navigation Types
export interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

// Form Types
export interface LoginFormData {
  email: string
  password: string
}

export interface SignupFormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  role: UserRole
}

// Assignment Types (NEW)
export interface AssignableUser {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
}

export interface AssignmentUpdate {
  assignee_id?: string | null
  visibility?: TaskVisibility
}

// Service Template Types
export interface ServiceTemplate {
  id: string
  name: string
  description: string | null
  color: string
  created_by: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface TemplateMilestone {
  id: string
  template_id: string
  name: string
  description: string | null
  position: number
  relative_start_days: number
  relative_due_days: number | null
  created_at: string
}

export interface TemplateTask {
  id: string
  template_milestone_id: string
  title: string
  description: string | null
  priority: TaskPriority
  estimated_hours: number | null
  position: number
  relative_due_days: number | null
  visibility: TaskVisibility
  created_at: string
}

// Service Template Base Types
export interface ServiceTemplate {
  id: string
  name: string
  description: string | null
  color: string
  created_by: string
  is_default: boolean
  created_at: string
  updated_at: string
  milestone_count?: number
  task_count?: number
  created_by_name?: string
}

// Extended Template Types for Relations
export interface ServiceTemplateWithMilestones extends ServiceTemplate {
  milestones: TemplateMilestone[]
  created_by_profile?: Profile
}

export interface TemplateMilestoneWithTasks extends TemplateMilestone {
  tasks?: TemplateTask[]
}

// Template Creation and Update Types
export interface CreateServiceTemplateData {
  name: string
  description?: string
  color?: string
  milestones?: CreateTemplateMilestoneData[]
}

export interface CreateTemplateData {
  name: string
  description?: string
  color?: string
  milestones: {
    name: string
    description?: string
    position: number
    relative_start_days: string
    relative_due_days: string
    tasks: {
      title: string
      description?: string
      priority: TaskPriority
      estimated_hours?: number
      position: number
      relative_due_days: string
      visibility: TaskVisibility
    }[]
  }[]
}

export interface CreateTemplateMilestoneData {
  name: string
  description?: string
  position: number
  relative_start_days?: string
  relative_due_days?: string
  tasks?: CreateTemplateTaskData[]
}

export interface CreateTemplateTaskData {
  title: string
  description?: string
  priority?: TaskPriority
  estimated_hours?: number
  position: number
  relative_due_days?: string
  visibility?: TaskVisibility
}

export interface UpdateServiceTemplateData {
  name?: string
  description?: string
  color?: string
}

// Smart Date Types
export interface SmartDateConfig {
  relative_start_days: number
  relative_due_days?: number
}

export interface CalculatedDates {
  start_date: string | null
  due_date: string | null
}

export type RelativeDateUnit = 'day' | 'days' | 'week' | 'weeks' | 'month' | 'months'

export interface RelativeDateParse {
  amount: number
  unit: RelativeDateUnit
  total_days: number
}

export interface DateSuggestion {
  label: string
  value: string
  days: number
}

// Service Template Summary (from database view)
export interface TemplateSummary {
  id: string
  name: string
  description: string | null
  color: string
  created_by: string
  is_default: boolean
  created_at: string
  updated_at: string
  created_by_name: string | null
  milestone_count: number
  task_count: number
}

// Template Color Options
export type TemplateColor = 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'red' | 'yellow' | 'indigo' | 'gray'

// Utility Types
export type ActionResponse<T = any> = 
  | { data: T; error?: never }
  | { data?: never; error: string }

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterParams {
  status?: string[]
  priority?: string[]
  assignee?: string[]
  date_from?: string
  date_to?: string
}