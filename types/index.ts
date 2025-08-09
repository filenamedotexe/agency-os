// User and Profile Types
export type UserRole = "admin" | "team_member" | "client"

export interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
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
  address: any | null
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
}

export type ServiceStatus = "planning" | "in_progress" | "completed" | "on_hold"

export interface Milestone {
  id: string
  service_id: string
  title: string
  description: string | null
  due_date: string | null
  status: MilestoneStatus
  order_index: number | null
  created_at: string
}

export type MilestoneStatus = "pending" | "in_progress" | "completed"

export interface Task {
  id: string
  milestone_id: string
  title: string
  description: string | null
  assignee_id: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  estimated_hours: string | null
  actual_hours: string | null
  created_at: string
}

export type TaskStatus = "todo" | "in_progress" | "completed"
export type TaskPriority = "low" | "medium" | "high" | "urgent"

// Extended Types for Relations
export interface ServiceWithMilestones extends Service {
  milestones?: MilestoneWithTasks[]
}

export interface MilestoneWithTasks extends Milestone {
  tasks?: Task[]
}

export interface ServiceFull extends Service {
  milestones?: MilestoneWithTasks[]
  profiles?: Profile
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