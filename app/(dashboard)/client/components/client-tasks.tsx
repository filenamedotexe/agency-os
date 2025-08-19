"use client"

import { useState } from 'react'
import { Card } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { 
  ListTodo,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Filter,
  ChevronRight,
  User
} from 'lucide-react'
import { formatDate } from '@/shared/lib/format-date'
import Link from 'next/link'

interface ClientTasksProps {
  tasks: Array<{
    id: string
    title: string
    status: string
    priority: string
    due_date?: string
    milestone?: { name: string; service?: { name: string; id: string } }
  }>
  services: Array<{
    id: string
    name: string
  }>
}

export function ClientTasks({ tasks, services }: ClientTasksProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterService, setFilterService] = useState<string>('all')
  
  // Filter tasks based on selected filters
  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false
    if (filterService !== 'all' && task.service_id !== filterService) return false
    return true
  })
  
  // Group tasks by status
  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    review: filteredTasks.filter(t => t.status === 'review'),
    done: filteredTasks.filter(t => t.status === 'done'),
    blocked: filteredTasks.filter(t => t.status === 'blocked')
  }
  
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'done').length
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  
  const statusColors = {
    todo: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    review: 'bg-yellow-100 text-yellow-700',
    done: 'bg-green-100 text-green-700',
    blocked: 'bg-red-100 text-red-700'
  }
  
  const priorityColors = {
    low: 'bg-gray-50 text-gray-600',
    medium: 'bg-blue-50 text-blue-600',
    high: 'bg-orange-50 text-orange-600',
    urgent: 'bg-red-50 text-red-600'
  }
  
  const statusIcons = {
    todo: Circle,
    in_progress: Clock,
    review: AlertCircle,
    done: CheckCircle2,
    blocked: AlertCircle
  }
  
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ListTodo className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Your Tasks</h2>
              <p className="text-sm text-muted-foreground">
                Track and manage your assigned tasks
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-base px-3 py-1">
            {totalTasks} total
          </Badge>
        </div>
        
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{progressPercentage}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completedTasks} completed</span>
            <span>{totalTasks - completedTasks} remaining</span>
          </div>
        </div>
      </Card>
      
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterService} onValueChange={setFilterService}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.map(service => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>
      
      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(tasksByStatus).map(([status, statusTasks]) => {
          const Icon = statusIcons[status as keyof typeof statusIcons]
          return (
            <Card key={status} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${
                  status === 'done' ? 'text-green-500' :
                  status === 'in_progress' ? 'text-blue-500' :
                  status === 'review' ? 'text-yellow-500' :
                  status === 'blocked' ? 'text-red-500' :
                  'text-gray-500'
                }`} />
                <span className="text-sm font-medium capitalize">
                  {status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-2xl font-bold">{statusTasks.length}</p>
            </Card>
          )
        })}
      </div>
      
      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card className="p-8 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {filterStatus !== 'all' || filterService !== 'all' 
                ? 'No tasks match your filters' 
                : 'No tasks assigned to you yet'}
            </p>
            {(filterStatus !== 'all' || filterService !== 'all') && (
              <Button 
                variant="link" 
                onClick={() => {
                  setFilterStatus('all')
                  setFilterService('all')
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            )}
          </Card>
        ) : (
          filteredTasks
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
            .map(task => {
              const Icon = statusIcons[task.status as keyof typeof statusIcons]
              const service = services.find(s => s.id === task.service_id)
              
              return (
                <Card key={task.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                        task.status === 'done' ? 'text-green-500' :
                        task.status === 'in_progress' ? 'text-blue-500' :
                        task.status === 'review' ? 'text-yellow-500' :
                        task.status === 'blocked' ? 'text-red-500' :
                        'text-gray-400'
                      }`} />
                      
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium ${
                          task.status === 'done' ? 'line-through text-muted-foreground' : ''
                        }`}>
                          {task.title}
                        </h3>
                        
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <Badge variant="outline" className={`text-xs ${statusColors[task.status as keyof typeof statusColors]}`}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                            {task.priority}
                          </Badge>
                          
                          {service && (
                            <Link href={`/services/${service.id}`}>
                              <Badge variant="secondary" className="text-xs hover:bg-secondary/80">
                                {service.name}
                              </Badge>
                            </Link>
                          )}
                          
                          {task.milestone_name && (
                            <span className="text-xs text-muted-foreground">
                              • {task.milestone_name}
                            </span>
                          )}
                          
                          {task.due_date && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(task.due_date)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {service && (
                      <Link href={`/services/${service.id}`}>
                        <Button variant="ghost" size="sm">
                          View Service
                          <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              )
            })
        )}
      </div>
    </div>
  )
}