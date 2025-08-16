"use client"

import { Badge } from '@/shared/components/ui/badge'
import { Progress } from '@/shared/components/ui/progress'
import { Card } from '@/shared/components/ui/card'
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock,
  AlertCircle
} from 'lucide-react'
import { formatDate } from '@/shared/lib/format-date'

interface ClientTimelineProps {
  service: any
}

export function ClientTimeline({ service }: ClientTimelineProps) {
  const milestones = service.milestones || []
  
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
  
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Service Description */}
      {service.description && (
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold mb-2">Project Overview</h2>
          <p className="text-muted-foreground">{service.description}</p>
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
            const completedTasks = milestone.tasks?.filter((t: any) => t.status === 'done').length || 0
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
            const isLast = index === sortedMilestones.length - 1
            
            // Get high priority tasks (key deliverables)
            const keyDeliverables = milestone.tasks?.filter((t: any) => 
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
                          {keyDeliverables.map((task: any) => (
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
                {milestones.filter((m: any) => m.status === 'in_progress').length}
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