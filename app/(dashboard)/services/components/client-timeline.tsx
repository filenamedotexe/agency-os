"use client"

import { Badge } from '@/shared/components/ui/badge'
import { Progress } from '@/shared/components/ui/progress'
import { Card } from '@/shared/components/ui/card'
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock,
  AlertCircle,
  User,
  ListTodo
} from 'lucide-react'
import { formatDate } from '@/shared/lib/format-date'

interface ClientTimelineProps {
  service: {
    id: string
    name: string
    milestones?: Array<{
      id: string
      name: string
      status: string
      due_date?: string
      tasks?: Array<{
        id: string
        title: string
        status: string
        priority: string
        visibility: string
        assigned_to?: { id: string }
      }>
    }>
  }
  userId?: string
}

export function ClientTimeline({ service, userId }: ClientTimelineProps) {
  const milestones = service.milestones || []
  
  // Get all tasks assigned to the current client
  const assignedTasks = milestones.flatMap((milestone) => 
    (milestone.tasks || [])
      .filter((task) => 
        task.assigned_to?.id === userId || 
        (task.visibility === 'client' && task.assigned_to)
      )
      .map((task) => ({
        ...task,
        milestoneName: milestone.name,
        milestoneId: milestone.id
      }))
  )
  
  // Group assigned tasks by status
  const tasksByStatus = {
    todo: assignedTasks.filter((t) => t.status === 'todo'),
    in_progress: assignedTasks.filter((t) => t.status === 'in_progress'),
    review: assignedTasks.filter((t) => t.status === 'review'),
    done: assignedTasks.filter((t) => t.status === 'done'),
    blocked: assignedTasks.filter((t) => t.status === 'blocked')
  }
  
  const statusColors = {
    upcoming: 'bg-gray-100 text-gray-700 border-gray-300',
    in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
    completed: 'bg-green-100 text-green-700 border-green-300',
    delayed: 'bg-red-100 text-red-700 border-red-300'
  }
  
  const statusIcons = {
    upcoming: Circle,
    in_progress: Clock,
    completed: CheckCircle2,
    delayed: AlertCircle
  }
  
  // Sort milestones by position
  const sortedMilestones = [...milestones].sort((a, b) => a.position - b.position)
  
  const taskStatusColors = {
    todo: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    review: 'bg-yellow-100 text-yellow-700',
    done: 'bg-green-100 text-green-700',
    blocked: 'bg-red-100 text-red-700'
  }
  
  const taskPriorityColors = {
    low: 'bg-gray-50 text-gray-600',
    medium: 'bg-blue-50 text-blue-600',
    high: 'bg-orange-50 text-orange-600',
    urgent: 'bg-red-50 text-red-600'
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Service Description */}
      {service.description && (
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold mb-2">Project Overview</h2>
          <p className="text-muted-foreground">{service.description}</p>
        </Card>
      )}
      
      {/* Assigned Tasks Section */}
      {assignedTasks.length > 0 && (
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ListTodo className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Your Assigned Tasks</h2>
            <Badge variant="secondary" className="ml-auto">
              {assignedTasks.length} task{assignedTasks.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          
          {/* Task Status Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
              <Circle className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">{tasksByStatus.todo.length}</p>
                <p className="text-xs text-muted-foreground">To Do</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">{tasksByStatus.in_progress.length}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">{tasksByStatus.review.length}</p>
                <p className="text-xs text-muted-foreground">Review</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">{tasksByStatus.done.length}</p>
                <p className="text-xs text-muted-foreground">Done</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">{tasksByStatus.blocked.length}</p>
                <p className="text-xs text-muted-foreground">Blocked</p>
              </div>
            </div>
          </div>
          
          {/* Task List */}
          <div className="space-y-3">
            {assignedTasks
              .sort((a, b) => {
                // Sort by status priority, then by due date
                const statusOrder = ['blocked', 'in_progress', 'review', 'todo', 'done']
                const statusDiff = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
                if (statusDiff !== 0) return statusDiff
                
                if (a.due_date && b.due_date) {
                  return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
                }
                return 0
              })
              .map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className={`
                    w-2 h-2 rounded-full mt-2 flex-shrink-0
                    ${task.status === 'done' ? 'bg-green-500' :
                      task.status === 'in_progress' ? 'bg-blue-500' :
                      task.status === 'review' ? 'bg-yellow-500' :
                      task.status === 'blocked' ? 'bg-red-500' :
                      'bg-gray-300'}
                  `} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="outline" className={`text-xs ${taskStatusColors[task.status as keyof typeof taskStatusColors]}`}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${taskPriorityColors[task.priority as keyof typeof taskPriorityColors]}`}>
                            {task.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            in {task.milestoneName}
                          </span>
                          {task.due_date && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(task.due_date)}
                            </div>
                          )}
                        </div>
                      </div>
                      {task.status === 'done' && (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
          
          {assignedTasks.length === 0 && (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No tasks assigned to you yet</p>
              <p className="text-sm text-muted-foreground mt-1">Check back soon for updates!</p>
            </div>
          )}
        </Card>
      )}
      
      {/* Timeline */}
      <div className="space-y-8">
        {sortedMilestones.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No milestones have been created for this project yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Check back soon for updates!</p>
          </Card>
        ) : (
          sortedMilestones.map((milestone, index) => {
            const StatusIcon = statusIcons[milestone.status as keyof typeof statusIcons] || Circle
            const totalTasks = milestone.tasks?.length || 0
            const completedTasks = milestone.tasks?.filter((t) => t.status === 'done').length || 0
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
            const isLast = index === sortedMilestones.length - 1
            
            // Get high priority tasks (key deliverables)
            const keyDeliverables = milestone.tasks?.filter((t) => 
              t.priority === 'high' || t.priority === 'urgent'
            ) || []
            
            return (
              <div key={milestone.id} className="flex gap-4">
                {/* Timeline Line and Dot */}
                <div className="flex flex-col items-center">
                  <div className={`
                    w-4 h-4 rounded-full flex items-center justify-center
                    ${milestone.status === 'completed' 
                      ? 'bg-green-500' 
                      : milestone.status === 'in_progress'
                      ? 'bg-blue-500 animate-pulse'
                      : milestone.status === 'delayed'
                      ? 'bg-red-500'
                      : 'bg-gray-300'
                    }
                  `}>
                    {milestone.status === 'completed' && (
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    )}
                  </div>
                  {!isLast && (
                    <div className={`
                      w-0.5 flex-1 mt-2
                      ${milestone.status === 'completed' 
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                      }
                    `} />
                  )}
                </div>
                
                {/* Milestone Content */}
                <div className="flex-1 pb-8">
                  <Card className="p-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{milestone.name}</h3>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {milestone.description}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${statusColors[milestone.status as keyof typeof statusColors]} border`}
                      >
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {milestone.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    {/* Progress Bar */}
                    {totalTasks > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {completedTasks}/{totalTasks} tasks complete
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}
                    
                    {/* Key Deliverables */}
                    {keyDeliverables.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Key Deliverables:</p>
                        <ul className="space-y-2">
                          {keyDeliverables.map((task) => (
                            <li key={task.id} className="flex items-start gap-2">
                              <div className={`
                                w-2 h-2 rounded-full mt-1.5 flex-shrink-0
                                ${task.status === 'done' ? 'bg-green-500' : 'bg-gray-300'}
                              `} />
                              <span className={`
                                text-sm
                                ${task.status === 'done' 
                                  ? 'line-through text-muted-foreground' 
                                  : ''
                                }
                              `}>
                                {task.title}
                                {task.status === 'done' && (
                                  <CheckCircle2 className="inline-block ml-1 h-3 w-3 text-green-500" />
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Due Date */}
                    {milestone.due_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {milestone.status === 'completed' 
                            ? `Completed ${milestone.completed_at ? formatDate(milestone.completed_at) : ''}` 
                            : `Due ${formatDate(milestone.due_date)}`
                          }
                        </span>
                      </div>
                    )}
                    
                    {/* Stats for completed milestones */}
                    {milestone.status === 'completed' && totalTasks > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
                            <p className="text-xs text-muted-foreground">Tasks Completed</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold">100%</p>
                            <p className="text-xs text-muted-foreground">Complete</p>
                          </div>
                          <div>
                            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
                            <p className="text-xs text-muted-foreground">Delivered</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            )
          })
        )}
      </div>
      
      {/* Overall Summary */}
      {sortedMilestones.length > 0 && (
        <Card className="mt-8 p-6">
          <h3 className="font-semibold mb-4">Project Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{service.totalMilestones || 0}</p>
              <p className="text-xs text-muted-foreground">Total Milestones</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {service.completedMilestones || 0}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {milestones.filter((m) => m.status === 'in_progress').length}
              </p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{service.progress || 0}%</p>
              <p className="text-xs text-muted-foreground">Overall Progress</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}