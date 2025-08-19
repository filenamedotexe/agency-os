"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { AssigneeAvatar } from '@/shared/components/ui/assignee-avatar'
import { AssigneeSelector } from '@/shared/components/ui/assignee-selector'
import { 
  Calendar, 
  MessageSquare, 
  MoreVertical, 
  GripVertical,
  AlertTriangle,
  Clock,
  Edit,
  Trash2,
  User,
  Eye,
  EyeOff
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { formatDate } from '@/shared/lib/format-date'
import { deleteTask, updateTask, assignTask } from '@/app/actions/tasks'
import { getAssignableUsers } from '@/app/actions/assignments'
import { useToast } from '@/shared/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import type { Profile } from '@/shared/types'

interface TaskCardProps {
  task: any
  isDragging?: boolean
  serviceId: string
}

export function TaskCard({ task, isDragging = false, serviceId }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })
  
  const router = useRouter()
  const { toast } = useToast()
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false)
  const [assignableUsers, setAssignableUsers] = useState<(Profile | any)[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : ''
  })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  
  const priorityColors = {
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
  }
  
  const priorityIcons = {
    urgent: AlertTriangle,
    high: AlertTriangle,
    medium: null,
    low: null
  }
  
  const PriorityIcon = priorityIcons[task.priority as keyof typeof priorityIcons]
  
  // Load assignable users when popover opens
  useEffect(() => {
    if (assigneePopoverOpen && assignableUsers.length === 0) {
      loadAssignableUsers()
    }
  }, [assigneePopoverOpen])
  
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
  
  const handleAssignment = async (userId: string | null) => {
    setAssigning(true)
    try {
      // Determine visibility based on assignee role
      let visibility: 'internal' | 'client' | undefined
      if (userId) {
        const assignee = assignableUsers.find(u => u.id === userId)
        if (assignee?.role === 'client') {
          visibility = 'client'
        }
      }
      
      const result = await assignTask(task.id, userId, visibility)
      if ('error' in result) {
        throw new Error(result.error)
      }
      
      toast({
        title: "Success",
        description: userId ? "Task assigned successfully" : "Assignment removed",
      })
      
      setAssigneePopoverOpen(false)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign task",
        variant: "destructive"
      })
    } finally {
      setAssigning(false)
    }
  }
  
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
      return
    }
    
    try {
      const result = await deleteTask(task.id)
      if ('error' in result) {
        throw new Error(result.error)
      }
      toast({
        title: "Success",
        description: "Task deleted successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete task",
        variant: "destructive"
      })
    }
  }
  
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive"
      })
      return
    }
    
    setUpdating(true)
    try {
      const result = await updateTask(task.id, {
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority as any,
        due_date: formData.due_date || null
      })
      
      if ('error' in result) {
        throw new Error(result.error)
      }
      
      toast({
        title: "Success",
        description: "Task updated successfully",
      })
      
      setEditModalOpen(false)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update task",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }
  
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
  
  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`
          ${isDragging || isSortableDragging ? 'opacity-50' : ''}
          ${isDragging || isSortableDragging ? 'cursor-grabbing' : 'cursor-grab'}
        `}
      >
        <Card className="p-3 hover:shadow-md transition-shadow bg-background">
          {/* Task Header */}
          <div className="flex items-start gap-2 mb-2">
            <div
              {...attributes}
              {...listeners}
              className="mt-1 cursor-grab hover:text-muted-foreground"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            
            <div className="flex-1">
              <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditModalOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Task Meta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Priority Badge */}
              <Badge 
                variant="secondary" 
                className={`text-xs ${priorityColors[task.priority as keyof typeof priorityColors]}`}
              >
                {PriorityIcon && <PriorityIcon className="mr-1 h-3 w-3" />}
                {task.priority}
              </Badge>
              
              {/* Due Date */}
              {task.due_date && (
                <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(task.due_date)}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Comments Count */}
              {task.comments && task.comments.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  <span>{task.comments.length}</span>
                </div>
              )}
              
              {/* Task Visibility Indicator */}
              {task.visibility === 'client' && (
                <div className="flex items-center" title="Visible to client">
                  <Eye className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
              
              {/* Assignee with Click to Assign */}
              <Popover open={assigneePopoverOpen} onOpenChange={setAssigneePopoverOpen}>
                <PopoverTrigger asChild>
                  <div className="cursor-pointer">
                    <AssigneeAvatar
                      user={task.assigned_to_profile || task.assigned_to}
                      size="sm"
                      editable={true}
                      showTooltip={true}
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0">
                  <div className="p-3">
                    <h4 className="font-medium text-sm mb-3">Assign Task</h4>
                    <AssigneeSelector
                      value={task.assigned_to}
                      onChange={handleAssignment}
                      users={assignableUsers}
                      allowClient={true}
                      placeholder="Select assignee..."
                      loading={loadingUsers}
                      disabled={assigning}
                    />
                    {task.visibility === 'client' && (
                      <p className="text-xs text-muted-foreground mt-2">
                        <Eye className="inline h-3 w-3 mr-1" />
                        This task is visible to the client
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update the task details.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Task title"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task details..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger id="edit-priority">
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
                  <Label htmlFor="edit-due-date">Due Date</Label>
                  <Input
                    id="edit-due-date"
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? 'Updating...' : 'Update Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}