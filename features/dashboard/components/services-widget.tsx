import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Progress } from "@/shared/components/ui/progress"
import { formatDate } from "@/shared/lib/format-date"
import { 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Target
} from "lucide-react"

interface Milestone {
  id: string
  name: string
  due_date: string
  service: {
    id: string
    name: string
    client: {
      full_name: string
    }
  }
  tasks: Array<{
    id: string
    status: string
  }>
}

interface Task {
  id: string
  title: string
  due_date: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: string
  milestone: {
    name: string
    service: {
      id: string
      name: string
    }
  }
  assigned_to?: {
    full_name: string
  }
}

interface ServicesWidgetProps {
  upcomingMilestones: Milestone[]
  overdueTasks: Task[]
  role: 'admin' | 'team_member' | 'client'
}

export function ServicesWidget({ upcomingMilestones, overdueTasks, role }: ServicesWidgetProps) {
  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700'
  }

  const getDaysUntil = (date: string) => {
    const today = new Date()
    const dueDate = new Date(date)
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getMilestoneProgress = (tasks: Array<{ status: string }>) => {
    if (tasks.length === 0) return 0
    const completed = tasks.filter(t => t.status === 'done').length
    return Math.round((completed / tasks.length) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Milestones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Upcoming Milestones</CardTitle>
              <CardDescription>Next 30 days</CardDescription>
            </div>
            <Target className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {upcomingMilestones.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No upcoming milestones
            </p>
          ) : (
            <div className="space-y-4">
              {upcomingMilestones.slice(0, 3).map((milestone) => {
                const daysUntil = getDaysUntil(milestone.due_date)
                const progress = getMilestoneProgress(milestone.tasks)
                
                return (
                  <div key={milestone.id} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <Link 
                          href={`/services/${milestone.service.id}`}
                          className="font-medium text-sm hover:underline"
                        >
                          {milestone.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {milestone.service.name} • {milestone.service.client.full_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {daysUntil <= 3 && (
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                        )}
                        <Badge variant={daysUntil <= 3 ? "destructive" : "secondary"} className="text-xs">
                          {daysUntil > 0 ? `${daysUntil}d` : 'Overdue'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">{progress}%</span>
                    </div>
                  </div>
                )
              })}
              
              {upcomingMilestones.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href="/services">
                    View all milestones
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue Tasks - Only for admin/team */}
      {role !== 'client' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Overdue Tasks</CardTitle>
                <CardDescription>Requires attention</CardDescription>
              </div>
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            {overdueTasks.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  No overdue tasks!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueTasks.slice(0, 5).map((task) => {
                  const daysOverdue = Math.abs(getDaysUntil(task.due_date))
                  
                  return (
                    <div key={task.id} className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {task.milestone.service.name} • {task.milestone.name}
                        </p>
                        {task.assigned_to && (
                          <p className="text-xs text-muted-foreground">
                            Assigned to {task.assigned_to.full_name}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="destructive" className="text-xs">
                          {daysOverdue}d overdue
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
                
                {overdueTasks.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="/services">
                      View all overdue tasks ({overdueTasks.length})
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}