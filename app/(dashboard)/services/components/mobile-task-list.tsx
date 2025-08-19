"use client"

import { useState, useOptimistic, startTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SwipeableListItem } from '@/shared/components/ui/swipeable-list-item'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { AssigneeSelector } from '@/shared/components/ui/assignee-selector'
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { updateTaskStatus, updateTask, createTask } from '@/app/actions/tasks'
import { getAssignableUsers } from '@/app/actions/assignments'
import { formatDate } from '@/shared/lib/format-date'
import type { Profile } from '@/shared/types'
import { 
  CheckCircle2, 
  UserPlus,
  Clock,
  AlertCircle,
  Calendar,
  Filter,
  X,
  Circle,
  Plus
} from 'lucide-react'
import { useToast } from '@/shared/hooks/use-toast'

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: {
    id: string
    full_name: string
    avatar_url?: string
  }
  due_date?: string
  position: number
}

interface MobileTaskListProps {
  tasks: Task[]
  milestoneId: string
  serviceId: string
  teamMembers?: Array<{
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }>
}

export function MobileTaskList({ 
  tasks: initialTasks, 
  milestoneId,
  serviceId,
  teamMembers = []
}: MobileTaskListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [filter, setFilter] = useState<string>('all')
  const [assignTaskId, setAssignTaskId] = useState<string | null>(null)
  const [selectedAssignee, setSelectedAssignee] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [createSheetOpen, setCreateSheetOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [assignableUsers, setAssignableUsers] = useState<(Profile | any)[]>([])
  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assigned_to: null as string | null,
    status: 'todo' as 'todo' | 'in_progress' | 'review' | 'done' | 'blocked',
    visibility: 'internal' as 'internal' | 'client'
  })
  
  // Use optimistic updates for immediate feedback
  const [tasks, setOptimisticTasks] = useOptimistic(
    initialTasks,
    (state, { taskId, updates }: { taskId: string; updates: Partial<Task> }) => {
      return state.map(task => 
        task.id === taskId 
          ? { ...task, ...updates }
          : task
      )
    }
  )
  
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    return task.status === filter
  })
  
  const handleSwipeRight = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    
    // Optimistically update to done
    startTransition(() => {
      setOptimisticTasks({ taskId, updates: { status: 'done' } })
    })
    
    // Make the actual API call
    const result = await updateTaskStatus(taskId, 'done')
    
    if ('error' in result) {
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive"
      })
      // Revert optimistic update by re-setting original tasks
      // In a real app, you'd want to refetch the data
    } else {
      toast({
        title: "Task Completed",
        description: `"${task.title}" marked as done`,
      })
    }
  }
  
  const handleSwipeLeft = (taskId: string) => {
    // Open assign sheet
    setAssignTaskId(taskId)
    const task = tasks.find(t => t.id === taskId)
    if (task?.assigned_to) {
      setSelectedAssignee(task.assigned_to.id)
    }
  }
  
  const handleAssign = async () => {
    if (!assignTaskId || !selectedAssignee) return
    
    setIsAssigning(true)
    
    const result = await updateTask(assignTaskId, {
      assigned_to: selectedAssignee
    })
    
    if ('error' in result) {
      toast({
        title: "Error",
        description: "Failed to assign task",
        variant: "destructive"
      })
    } else {
      const assignee = teamMembers.find(m => m.id === selectedAssignee)
      toast({
        title: "Task Assigned",
        description: `Task assigned to ${assignee?.full_name}`,
      })
      
      // Optimistically update the task
      startTransition(() => {
        setOptimisticTasks({ 
          taskId: assignTaskId, 
          updates: { 
            assigned_to: {
              id: selectedAssignee,
              full_name: assignee?.full_name || '',
              avatar_url: assignee?.avatar_url
            }
          } 
        })
      })
    }
    
    setIsAssigning(false)
    setAssignTaskId(null)
    setSelectedAssignee('')
  }
  
  const statusOptions = [
    { value: 'all', label: 'All Tasks', icon: Filter },
    { value: 'todo', label: 'To Do', icon: Circle },
    { value: 'in_progress', label: 'In Progress', icon: Clock },
    { value: 'review', label: 'Review', icon: AlertCircle },
    { value: 'done', label: 'Done', icon: CheckCircle2 },
  ]
  
  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700'
  }
  
  const statusColors = {
    todo: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    review: 'bg-yellow-100 text-yellow-700',
    done: 'bg-green-100 text-green-700',
    blocked: 'bg-red-100 text-red-700'
  }
  
  // Load assignable users when create sheet opens
  useEffect(() => {
    if (createSheetOpen && assignableUsers.length === 0) {
      loadAssignableUsers()
    }
  }, [createSheetOpen])
  
  const loadAssignableUsers = async () => {
    setLoadingUsers(true)
    try {
      const result = await getAssignableUsers(serviceId, true)
      if ('error' in result) {
        throw new Error(result.error)
      }
      setAssignableUsers(result.data || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load assignable users",
        variant: "destructive"
      })
    } finally {
      setLoadingUsers(false)
    }
  }
  
  const handleCreateTask = async () => {
    if (!createFormData.title) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive"
      })
      return
    }
    
    setCreating(true)
    try {
      // Auto-set visibility if assigning to client
      let visibility = createFormData.visibility
      if (createFormData.assigned_to) {
        const assignee = assignableUsers.find(u => u.id === createFormData.assigned_to)
        if (assignee?.role === 'client') {
          visibility = 'client'
        }
      }
      
      const result = await createTask({
        milestone_id: milestoneId,
        title: createFormData.title,
        description: createFormData.description || undefined,
        priority: createFormData.priority as any,
        due_date: createFormData.due_date || undefined,
        status: createFormData.status,
        assigned_to: createFormData.assigned_to,
        visibility: visibility
      })
      
      if ('error' in result) {
        throw new Error(result.error)
      }
      
      toast({
        title: "Success",
        description: "Task created successfully",
      })
      
      setCreateSheetOpen(false)
      setCreateFormData({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        assigned_to: null,
        status: 'todo',
        visibility: 'internal'
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create task",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }
  
  return (
    <>
      <div className="pb-20 bg-background min-h-screen">
        {/* Sticky Filter Header */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex gap-2 p-4 overflow-x-auto scrollbar-hide">
            {statusOptions.map(option => {
              const Icon = option.icon
              const isActive = filter === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm 
                    whitespace-nowrap transition-all
                    ${isActive
                      ? 'bg-primary text-primary-foreground shadow-md scale-105'
                      : 'bg-muted hover:bg-muted/80'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{option.label}</span>
                  {option.value !== 'all' && (
                    <span className={`
                      ml-1 px-2 py-0.5 rounded-full text-xs
                      ${isActive ? 'bg-primary-foreground/20' : 'bg-background'}
                    `}>
                      {tasks.filter(t => t.status === option.value).length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          
          {filter !== 'all' && (
            <div className="px-4 pb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter('all')}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear filter
              </Button>
            </div>
          )}
        </div>
        
        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-muted-foreground text-center">
              {filter === 'all' 
                ? 'No tasks yet. Create your first task!'
                : `No ${filter.replace('_', ' ')} tasks`
              }
            </p>
            {filter !== 'all' && (
              <Button
                variant="link"
                onClick={() => setFilter('all')}
                className="mt-2"
              >
                View all tasks
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredTasks.map(task => (
              <SwipeableListItem
                key={task.id}
                onSwipeRight={() => handleSwipeRight(task.id)}
                onSwipeLeft={() => handleSwipeLeft(task.id)}
                rightAction={
                  task.status !== 'done' 
                    ? { label: 'Complete', color: 'green', icon: <CheckCircle2 className="h-5 w-5 mr-2" /> }
                    : undefined
                }
                leftAction={{ 
                  label: 'Assign', 
                  color: 'blue', 
                  icon: <UserPlus className="h-5 w-5 mr-2" /> 
                }}
                className="bg-card"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Task Title */}
                      <p className={`font-medium text-base ${
                        task.status === 'done' ? 'line-through text-muted-foreground' : ''
                      }`}>
                        {task.title}
                      </p>
                      
                      {/* Task Description */}
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      {/* Task Metadata */}
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        {/* Status Badge */}
                        <Badge 
                          variant="outline" 
                          className={`${statusColors[task.status]} text-xs`}
                        >
                          {task.status.replace('_', ' ')}
                        </Badge>
                        
                        {/* Assignee */}
                        {task.assigned_to && (
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={task.assigned_to.avatar_url} />
                              <AvatarFallback className="text-[10px]">
                                {task.assigned_to.full_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {task.assigned_to.full_name?.split(' ')[0]}
                            </span>
                          </div>
                        )}
                        
                        {/* Due Date */}
                        {task.due_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(task.due_date)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Priority Badge */}
                    <Badge 
                      variant="outline"
                      className={`${priorityColors[task.priority]} text-xs shrink-0`}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              </SwipeableListItem>
            ))}
          </div>
        )}
        
        {/* Swipe Instructions (shown once) */}
        {filteredTasks.length > 0 && (
          <div className="p-4 text-center text-xs text-muted-foreground">
            <p>Swipe right to complete • Swipe left to assign</p>
          </div>
        )}
      </div>
      
      {/* Assign Sheet */}
      <Sheet open={!!assignTaskId} onOpenChange={(open) => !open && setAssignTaskId(null)}>
        <SheetContent side="bottom" className="h-[300px]">
          <SheetHeader>
            <SheetTitle>Assign Task</SheetTitle>
            <SheetDescription>
              Select a team member to assign this task to
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {member.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.full_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button
                onClick={handleAssign}
                disabled={!selectedAssignee || isAssigning}
                className="flex-1"
              >
                {isAssigning ? 'Assigning...' : 'Assign Task'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setAssignTaskId(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Create Task Sheet */}
      <Sheet open={createSheetOpen} onOpenChange={setCreateSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create New Task</SheetTitle>
            <SheetDescription>
              Add a new task to this milestone
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="mobile-title">Title *</Label>
              <Input
                id="mobile-title"
                value={createFormData.title}
                onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                placeholder="e.g., Design homepage mockup"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="mobile-description">Description</Label>
              <Textarea
                id="mobile-description"
                value={createFormData.description}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                placeholder="Task details..."
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="mobile-status">Status</Label>
              <Select
                value={createFormData.status}
                onValueChange={(value: any) => setCreateFormData({ ...createFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="mobile-priority">Priority</Label>
              <Select
                value={createFormData.priority}
                onValueChange={(value) => setCreateFormData({ ...createFormData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="mobile-due-date">Due Date</Label>
              <Input
                id="mobile-due-date"
                type="datetime-local"
                value={createFormData.due_date}
                onChange={(e) => setCreateFormData({ ...createFormData, due_date: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="mobile-assignee">Assignee</Label>
              <AssigneeSelector
                value={createFormData.assigned_to}
                onChange={(userId) => setCreateFormData({ ...createFormData, assigned_to: userId })}
                users={assignableUsers}
                allowClient={true}
                placeholder="Select assignee (optional)..."
                loading={loadingUsers}
                disabled={creating}
              />
              {createFormData.assigned_to && assignableUsers.find(u => u.id === createFormData.assigned_to)?.role === 'client' && (
                <p className="text-xs text-muted-foreground">
                  Task will be visible to the client
                </p>
              )}
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCreateSheetOpen(false)}
                disabled={creating}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTask}
                disabled={creating}
                className="flex-1"
              >
                {creating ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Floating Action Button */}
      <Button
        onClick={() => setCreateSheetOpen(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-10"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </>
  )
}