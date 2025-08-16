# Services Feature Implementation Plan
## AgencyOS Project Management System

### Overview
A simplified, clean project management system for agency work with 3-layer hierarchy:
**Services (Projects) → Milestones (Phases) → Tasks (Actions)**

### Core Principles
- **Low Complexity**: No nested subtasks, dependencies, or complex workflows
- **High Utility**: Focus on what agencies actually need
- **Clean UI/UX**: Linear-inspired simplicity with bento box layouts
- **Real Progress**: Automatic progress calculation, no manual updates
- **Role-Based Views**: Different experiences for clients vs team

---

## Phase 1: Database Schema (2 hours)

### 1.1 Create Core Tables
```sql
-- services table
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id),
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'paused', 'completed', 'cancelled')),
  start_date date,
  end_date date,
  budget decimal(10,2),
  color text DEFAULT 'blue', -- for visual identification
  created_by uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- milestones table  
CREATE TABLE milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'delayed')),
  position integer NOT NULL DEFAULT 0, -- for ordering
  due_date date,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id uuid NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'blocked')),
  position integer NOT NULL DEFAULT 0, -- for kanban ordering
  assigned_to uuid REFERENCES profiles(id),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  created_by uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- service_members table (who's working on what)
CREATE TABLE service_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  role text DEFAULT 'member' CHECK (role IN ('lead', 'member', 'viewer')),
  added_at timestamp with time zone DEFAULT now(),
  UNIQUE(service_id, user_id)
);

-- task_comments table
CREATE TABLE task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### 1.2 Create Indexes
```sql
CREATE INDEX idx_services_client_id ON services(client_id);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_milestones_service_id ON milestones(service_id);
CREATE INDEX idx_tasks_milestone_id ON tasks(milestone_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_service_members_user_id ON service_members(user_id);
```

### 1.3 RLS Policies
```sql
-- Services: Admin/Team can CRUD, Clients can view their own
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and team can manage all services" ON services
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'team_member')
    )
  );

CREATE POLICY "Clients can view their services" ON services
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- Similar patterns for other tables...
```

### 1.4 Testing Checkpoint
- [ ] Run SQL migrations via Supabase dashboard
- [ ] Verify tables created with proper constraints
- [ ] Test RLS policies with different user roles
- [ ] Create demo data script in `/scripts/create-demo-services.js`

---

## Phase 2: Server Actions (3 hours)

### 2.1 File Structure
```
/app/actions/
  services.ts      # Service CRUD operations
  milestones.ts    # Milestone management
  tasks.ts         # Task operations including drag-drop updates
```

### 2.2 Service Actions (`/app/actions/services.ts`)
```typescript
"use server"

import { requireAuth, isAuthError } from '@/shared/lib/auth-utils'
import { revalidatePath } from 'next/cache'

// Get all services for current user
export async function getServices() {
  const auth = await requireAuth()
  if (isAuthError(auth)) return { error: auth.error }
  
  const { supabase, user } = auth
  
  let query = supabase
    .from('services')
    .select(`
      *,
      client:profiles!client_id(
        id, full_name, email, company
      ),
      milestones(
        id, name, status, due_date
      ),
      service_members(
        user:profiles(id, full_name, avatar_url)
      )
    `)
    .order('created_at', { ascending: false })
  
  // Filter based on role
  if (user.role === 'client') {
    query = query.eq('client_id', user.id)
  }
  
  const { data, error } = await query
  if (error) return { error: error.message }
  
  // Calculate progress for each service
  const servicesWithProgress = data?.map(service => {
    const totalMilestones = service.milestones.length
    const completedMilestones = service.milestones.filter(
      m => m.status === 'completed'
    ).length
    
    return {
      ...service,
      progress: totalMilestones > 0 
        ? Math.round((completedMilestones / totalMilestones) * 100)
        : 0
    }
  })
  
  return { services: servicesWithProgress || [] }
}

// Get single service with full details
export async function getService(serviceId: string) {
  const auth = await requireAuth()
  if (isAuthError(auth)) return { error: auth.error }
  
  const { supabase, user } = auth
  
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      client:profiles!client_id(*),
      milestones(
        *,
        tasks(
          *,
          assigned_to:profiles!assigned_to(*),
          comments:task_comments(
            *,
            user:profiles(*)
          )
        )
      ),
      service_members(
        user:profiles(*)
      )
    `)
    .eq('id', serviceId)
    .single()
  
  if (error) return { error: error.message }
  
  // Check access permissions
  if (user.role === 'client' && data.client_id !== user.id) {
    return { error: 'Unauthorized' }
  }
  
  return { service: data }
}

// Create service
export async function createService(data: {
  client_id: string
  name: string
  description?: string
  start_date?: string
  end_date?: string
  budget?: number
}) {
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return { error: auth.error }
  
  const { serviceClient, user } = auth
  
  const { data: service, error } = await serviceClient
    .from('services')
    .insert({
      ...data,
      created_by: user.id,
      status: 'planning'
    })
    .select()
    .single()
  
  if (error) return { error: error.message }
  
  // Auto-add creator as service lead
  await serviceClient
    .from('service_members')
    .insert({
      service_id: service.id,
      user_id: user.id,
      role: 'lead'
    })
  
  revalidatePath('/services')
  return { service }
}

// Update service status
export async function updateServiceStatus(
  serviceId: string, 
  status: string
) {
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return { error: auth.error }
  
  const { supabase } = auth
  
  const { error } = await supabase
    .from('services')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', serviceId)
  
  if (error) return { error: error.message }
  
  revalidatePath('/services')
  revalidatePath(`/services/${serviceId}`)
  return { success: true }
}
```

### 2.3 Task Actions with Drag-Drop (`/app/actions/tasks.ts`)
```typescript
// Update task position for kanban drag-drop
export async function updateTaskPosition(
  taskId: string,
  newStatus: string,
  newPosition: number,
  newMilestoneId?: string
) {
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return { error: auth.error }
  
  const { supabase } = auth
  
  // Get all tasks in target status to reorder
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, position')
    .eq('milestone_id', newMilestoneId || taskId)
    .eq('status', newStatus)
    .order('position')
  
  // Update positions for affected tasks
  const updates = tasks?.map((task, index) => {
    if (task.id === taskId) return null
    const position = index >= newPosition ? index + 1 : index
    return {
      id: task.id,
      position
    }
  }).filter(Boolean) || []
  
  // Batch update
  await Promise.all([
    // Update the dragged task
    supabase.from('tasks').update({
      status: newStatus,
      position: newPosition,
      milestone_id: newMilestoneId,
      updated_at: new Date().toISOString()
    }).eq('id', taskId),
    
    // Update other tasks' positions
    ...updates.map(update => 
      supabase.from('tasks')
        .update({ position: update.position })
        .eq('id', update.id)
    )
  ])
  
  // Revalidate the service page
  const { data: task } = await supabase
    .from('tasks')
    .select('milestone:milestones(service_id)')
    .eq('id', taskId)
    .single()
  
  if (task?.milestone?.service_id) {
    revalidatePath(`/services/${task.milestone.service_id}`)
  }
  
  return { success: true }
}
```

### 2.4 Testing Checkpoint
- [ ] Test each CRUD operation with Playwright
- [ ] Verify role-based access control
- [ ] Test drag-drop position updates
- [ ] Check revalidation works correctly

---

## Phase 3: Services List Page (2 hours)

### 3.1 Main Services Page (`/app/(dashboard)/services/page.tsx`)
```typescript
import { getServices } from '@/app/actions/services'
import { ServiceCard } from './components/service-card'
import { CreateServiceButton } from './components/create-service-button'
import { ServiceFilters } from './components/service-filters'

export default async function ServicesPage() {
  const { services, error } = await getServices()
  
  if (error) {
    return <div>Error loading services</div>
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Services</h1>
        <CreateServiceButton />
      </div>
      
      <ServiceFilters />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {services?.map(service => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
      
      {services?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No services yet</p>
        </div>
      )}
    </div>
  )
}
```

### 3.2 Service Card Component (`/app/(dashboard)/services/components/service-card.tsx`)
```typescript
"use client"

import Link from 'next/link'
import { Card } from '@/shared/components/ui/card'
import { Progress } from '@/shared/components/ui/progress'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Calendar, Users } from 'lucide-react'
import { formatDate } from '@/shared/lib/format-date'

export function ServiceCard({ service }) {
  const statusColors = {
    planning: 'bg-gray-500',
    active: 'bg-green-500',
    paused: 'bg-yellow-500',
    completed: 'bg-blue-500',
    cancelled: 'bg-red-500'
  }
  
  return (
    <Link href={`/services/${service.id}`}>
      <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
        {/* Status Badge */}
        <div className="flex justify-between items-start mb-4">
          <span className={`px-2 py-1 rounded-full text-xs text-white ${statusColors[service.status]}`}>
            {service.status}
          </span>
          <span className="text-2xl font-bold text-muted-foreground">
            {service.progress}%
          </span>
        </div>
        
        {/* Service Name & Client */}
        <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {service.client.company || service.client.full_name}
        </p>
        
        {/* Progress Ring - Simple circular progress */}
        <div className="relative w-24 h-24 mx-auto mb-4">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="36"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="48"
              cy="48"
              r="36"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - service.progress / 100)}`}
              className="text-primary transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold">{service.progress}%</span>
          </div>
        </div>
        
        {/* Milestones Summary */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span>{service.milestones.length} milestones</span>
          <span>•</span>
          <span>
            {service.milestones.filter(m => m.status === 'completed').length} completed
          </span>
        </div>
        
        {/* Team Members */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {service.service_members?.slice(0, 3).map(member => (
              <Avatar key={member.user.id} className="h-8 w-8 border-2 border-background">
                <AvatarFallback>
                  {member.user.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            ))}
            {service.service_members?.length > 3 && (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs">
                +{service.service_members.length - 3}
              </div>
            )}
          </div>
          
          {service.end_date && (
            <div className="flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              {formatDate(service.end_date)}
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}
```

### 3.3 Testing Checkpoint
- [ ] Test responsive grid layout (mobile/tablet/desktop)
- [ ] Verify progress calculations are correct
- [ ] Test create service modal
- [ ] Check filtering works properly
- [ ] Test navigation to detail page

---

## Phase 4: Service Detail Page with Kanban (4 hours)

### 4.1 Service Detail Layout (`/app/(dashboard)/services/[id]/page.tsx`)
```typescript
import { getService } from '@/app/actions/services'
import { MilestoneSidebar } from '../components/milestone-sidebar'
import { KanbanBoard } from '../components/kanban-board'
import { ServiceHeader } from '../components/service-header'

export default async function ServiceDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const { service, error } = await getService(params.id)
  
  if (error || !service) {
    return <div>Service not found</div>
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Service Header */}
      <ServiceHeader service={service} />
      
      {/* Split Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Milestones */}
        <div className="w-80 border-r bg-muted/10 overflow-y-auto">
          <MilestoneSidebar 
            milestones={service.milestones}
            serviceId={service.id}
          />
        </div>
        
        {/* Right: Kanban Board */}
        <div className="flex-1 overflow-x-auto">
          <KanbanBoard 
            milestones={service.milestones}
            serviceId={service.id}
          />
        </div>
      </div>
    </div>
  )
}
```

### 4.2 Kanban Board Component (`/app/(dashboard)/services/components/kanban-board.tsx`)
```typescript
"use client"

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { TaskCard } from './task-card'
import { TaskColumn } from './task-column'
import { updateTaskPosition } from '@/app/actions/tasks'
import { useToast } from '@/shared/hooks/use-toast'

const TASK_STATUSES = [
  { id: 'todo', label: 'To Do', color: 'gray' },
  { id: 'in_progress', label: 'In Progress', color: 'blue' },
  { id: 'review', label: 'Review', color: 'yellow' },
  { id: 'done', label: 'Done', color: 'green' },
  { id: 'blocked', label: 'Blocked', color: 'red' }
]

export function KanbanBoard({ milestones, serviceId }) {
  const [activeMilestone, setActiveMilestone] = useState(milestones[0]?.id)
  const [activeTask, setActiveTask] = useState(null)
  const { toast } = useToast()
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )
  
  // Get tasks for active milestone
  const currentMilestone = milestones.find(m => m.id === activeMilestone)
  const tasks = currentMilestone?.tasks || []
  
  // Group tasks by status
  const tasksByStatus = TASK_STATUSES.reduce((acc, status) => {
    acc[status.id] = tasks
      .filter(task => task.status === status.id)
      .sort((a, b) => a.position - b.position)
    return acc
  }, {})
  
  const handleDragStart = (event) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    setActiveTask(task)
  }
  
  const handleDragEnd = async (event) => {
    const { active, over } = event
    
    if (!over) {
      setActiveTask(null)
      return
    }
    
    const activeTask = tasks.find(t => t.id === active.id)
    const overStatus = over.id // This will be the column ID
    
    if (!activeTask || activeTask.status === overStatus) {
      setActiveTask(null)
      return
    }
    
    // Calculate new position
    const tasksInNewStatus = tasksByStatus[overStatus]
    const newPosition = tasksInNewStatus.length
    
    // Optimistic update
    const updatedTasks = tasks.map(task => {
      if (task.id === activeTask.id) {
        return { ...task, status: overStatus, position: newPosition }
      }
      return task
    })
    
    // Update UI optimistically
    // (You'd update state here in a real implementation)
    
    // Server update
    const result = await updateTaskPosition(
      activeTask.id,
      overStatus,
      newPosition,
      activeMilestone
    )
    
    if (result.error) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      })
    }
    
    setActiveTask(null)
  }
  
  return (
    <div className="p-6">
      {/* Milestone Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {milestones.map(milestone => (
          <button
            key={milestone.id}
            onClick={() => setActiveMilestone(milestone.id)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeMilestone === milestone.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {milestone.name}
            <span className="ml-2 text-xs">
              ({milestone.tasks?.length || 0})
            </span>
          </button>
        ))}
      </div>
      
      {/* Kanban Columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {TASK_STATUSES.map(status => (
            <TaskColumn
              key={status.id}
              status={status}
              tasks={tasksByStatus[status.id]}
              milestoneId={activeMilestone}
            />
          ))}
        </div>
        
        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} isDragging />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
```

### 4.3 Testing Checkpoint
- [ ] Test milestone tabs switching
- [ ] Test drag and drop between columns
- [ ] Verify task position updates in database
- [ ] Test on touch devices (mobile drag)
- [ ] Check responsive layout on small screens

---

## Phase 5: Client View (2 hours)

### 5.1 Client Timeline View (`/app/(dashboard)/services/components/client-timeline.tsx`)
```typescript
"use client"

export function ClientTimeline({ service }) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="space-y-8">
        {service.milestones.map((milestone, index) => (
          <div key={milestone.id} className="flex gap-4">
            {/* Timeline Line */}
            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full ${
                milestone.status === 'completed' 
                  ? 'bg-green-500' 
                  : milestone.status === 'in_progress'
                  ? 'bg-blue-500'
                  : 'bg-gray-300'
              }`} />
              {index < service.milestones.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-300 mt-2" />
              )}
            </div>
            
            {/* Milestone Content */}
            <div className="flex-1 pb-8">
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{milestone.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    milestone.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : milestone.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {milestone.status.replace('_', ' ')}
                  </span>
                </div>
                
                {milestone.description && (
                  <p className="text-muted-foreground mb-4">
                    {milestone.description}
                  </p>
                )}
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>
                      {milestone.tasks?.filter(t => t.status === 'done').length || 0}
                      /{milestone.tasks?.length || 0} tasks
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          milestone.tasks?.length 
                            ? (milestone.tasks.filter(t => t.status === 'done').length / milestone.tasks.length) * 100
                            : 0
                        }%`
                      }}
                    />
                  </div>
                </div>
                
                {/* Key Deliverables */}
                {milestone.tasks?.filter(t => t.priority === 'high').length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Key Deliverables:</p>
                    <ul className="space-y-1">
                      {milestone.tasks
                        .filter(t => t.priority === 'high')
                        .map(task => (
                          <li key={task.id} className="flex items-center gap-2 text-sm">
                            <span className={`w-2 h-2 rounded-full ${
                              task.status === 'done' ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                            <span className={
                              task.status === 'done' ? 'line-through text-muted-foreground' : ''
                            }>
                              {task.title}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
                
                {milestone.due_date && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Due: {formatDate(milestone.due_date)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 5.2 Role-Based View Switching
```typescript
// In service detail page, conditionally render based on user role
const { user } = await getAuthUser()

return (
  <div>
    {user.role === 'client' ? (
      <ClientTimeline service={service} />
    ) : (
      <div className="flex">
        <MilestoneSidebar />
        <KanbanBoard />
      </div>
    )}
  </div>
)
```

### 5.3 Testing Checkpoint
- [ ] Test client can only see their services
- [ ] Verify timeline shows correct status
- [ ] Test progress calculations
- [ ] Check responsive design
- [ ] Verify clients cannot access team features

---

## Phase 6: Mobile Experience (2 hours)

### 6.1 Mobile Task View (`/app/(dashboard)/services/components/mobile-task-list.tsx`)
```typescript
"use client"

import { useState } from 'react'
import { SwipeableListItem } from '@/shared/components/ui/swipeable-list-item'
import { updateTaskStatus } from '@/app/actions/tasks'

export function MobileTaskList({ tasks, milestoneId }) {
  const [filter, setFilter] = useState('all')
  
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    return task.status === filter
  })
  
  const handleSwipeRight = async (taskId) => {
    // Mark as done
    await updateTaskStatus(taskId, 'done')
  }
  
  const handleSwipeLeft = async (taskId) => {
    // Open assign menu
    // Implementation here
  }
  
  return (
    <div className="pb-20">
      {/* Filter Pills */}
      <div className="flex gap-2 p-4 overflow-x-auto">
        {['all', 'todo', 'in_progress', 'done'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              filter === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>
      
      {/* Task List */}
      <div className="divide-y">
        {filteredTasks.map(task => (
          <SwipeableListItem
            key={task.id}
            onSwipeRight={() => handleSwipeRight(task.id)}
            onSwipeLeft={() => handleSwipeLeft(task.id)}
            rightAction={{ label: 'Complete', color: 'green' }}
            leftAction={{ label: 'Assign', color: 'blue' }}
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    {task.assigned_to && (
                      <span className="flex items-center gap-1">
                        <Avatar className="h-4 w-4">
                          <AvatarFallback>
                            {task.assigned_to.full_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {task.assigned_to.full_name}
                      </span>
                    )}
                    {task.due_date && (
                      <span>{formatDate(task.due_date)}</span>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  task.priority === 'urgent'
                    ? 'bg-red-100 text-red-700'
                    : task.priority === 'high'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {task.priority}
                </span>
              </div>
            </div>
          </SwipeableListItem>
        ))}
      </div>
    </div>
  )
}
```

### 6.2 Testing Checkpoint
- [ ] Test swipe gestures on mobile
- [ ] Verify touch targets are large enough
- [ ] Test landscape orientation
- [ ] Check performance with many tasks
- [ ] Test on iOS and Android

---

## Phase 7: Integration & Polish (2 hours)

### 7.1 Add to Navigation
- Update `/shared/components/navigation.tsx` to include Services link
- Add role-based visibility (hide from clients if needed)

### 7.2 Dashboard Integration
- Add services overview widget to dashboard
- Show upcoming milestones
- Display overdue tasks

### 7.3 Notifications (Optional - Simple)
- Task assignment notifications
- Milestone completion alerts
- Due date reminders

### 7.4 Performance Optimizations
- Implement virtual scrolling for long task lists
- Add loading skeletons
- Optimize database queries with proper indexes

---

## Phase 8: Comprehensive Testing (3 hours)

### 8.1 Create Test Script (`/scripts/test-services.js`)
```javascript
const { chromium } = require('playwright')

async function testServices() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()
  
  // Test scenarios:
  // 1. Admin creates service
  // 2. Admin adds milestones
  // 3. Team member creates tasks
  // 4. Drag tasks between columns
  // 5. Client views timeline
  // 6. Mobile swipe actions
  // 7. Progress calculations
  // 8. Role-based access
  
  // Implementation...
}
```

### 8.2 Test Matrix
- [ ] Desktop: Chrome, Firefox, Safari
- [ ] Mobile: iOS Safari, Android Chrome
- [ ] Viewports: 320px, 768px, 1024px, 1920px
- [ ] User Roles: Admin, Team, Client
- [ ] Data States: Empty, Few items, Many items

### 8.3 Edge Cases
- [ ] Deleting service with tasks
- [ ] Moving task to different milestone
- [ ] Concurrent edits by multiple users
- [ ] Large number of tasks (100+)
- [ ] Network interruption during drag-drop

---

## Implementation Checklist

### Database
- [ ] Create all tables with proper constraints
- [ ] Set up indexes for performance
- [ ] Implement RLS policies
- [ ] Create demo data script
- [ ] Test with different user roles

### Server Actions
- [ ] Service CRUD operations
- [ ] Milestone management
- [ ] Task operations with drag-drop
- [ ] Progress calculations
- [ ] Permission checks

### UI Components
- [ ] Service cards with progress rings
- [ ] Kanban board with drag-drop
- [ ] Milestone sidebar
- [ ] Task cards with inline editing
- [ ] Client timeline view
- [ ] Mobile swipe interface

### Testing
- [ ] Unit tests for server actions
- [ ] E2E tests with Playwright
- [ ] Mobile testing
- [ ] Performance testing
- [ ] Security testing (RLS)

### Polish
- [ ] Loading states
- [ ] Error handling
- [ ] Empty states
- [ ] Responsive design
- [ ] Accessibility

---

## Technical Decisions

### Why These Choices:
1. **No dnd-kit complexity**: Using native HTML5 drag-drop or simple touch gestures
2. **No keyboard shortcuts**: Mobile-first, touch-friendly
3. **No AI/automation**: Keep it predictable and simple
4. **Supabase Realtime**: Already configured, use for live updates
5. **Server Components**: Leverage Next.js 15 for better performance
6. **Tailwind + shadcn/ui**: Consistent with existing codebase

### Performance Targets:
- Page load: < 1 second
- Drag-drop response: < 100ms
- Database queries: < 200ms
- Mobile interaction: 60fps

### Security Considerations:
- RLS policies on all tables
- Service role only for necessary operations
- Input validation on all forms
- XSS prevention in comments
- Rate limiting on API calls

---

## Potential Issues & Solutions

### Issue: Drag-drop on mobile
**Solution**: Use touch events with visual feedback, or simple tap-to-move interface

### Issue: Large number of tasks
**Solution**: Virtual scrolling, pagination, or filtering

### Issue: Concurrent edits
**Solution**: Optimistic updates with conflict resolution

### Issue: Complex permissions
**Solution**: Simple role-based system (admin/team/client)

### Issue: Progress calculation performance
**Solution**: Database triggers or cached calculations

---

## Success Metrics

1. **Functionality**: All CRUD operations work
2. **Performance**: Sub-second load times
3. **Responsiveness**: Works on all devices
4. **Reliability**: No data loss on drag-drop
5. **Usability**: Clients can understand their project status
6. **Maintainability**: Clean, documented code

---

## Next Steps After Implementation

1. User feedback collection
2. Performance monitoring
3. Analytics on feature usage
4. Gradual feature additions based on needs
5. Integration with other tools (if needed)

---

## Notes

- Keep it simple - resist feature creep
- Test everything - no assumptions
- Document patterns for future development
- Consider accessibility from the start
- Mobile experience is crucial