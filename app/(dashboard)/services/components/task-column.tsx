"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { TaskCard } from './task-card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { AssigneeSelector } from '@/shared/components/ui/assignee-selector'
import { Plus, MoreVertical } from 'lucide-react'
import { createTask } from '@/app/actions/tasks'
import { getAssignableUsers } from '@/app/actions/assignments'
import { useToast } from '@/shared/hooks/use-toast'
import type { Profile } from '@/shared/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

interface TaskColumnProps {
  status: {
    id: string
    label: string
    color: string
  }
  tasks: Array<{
    id: string
    title: string
    description?: string
    status: string
    priority: string
    due_date?: string
    position: number
  }>
  milestoneId: string
  serviceId: string
}

export function TaskColumn({ status, tasks, milestoneId, serviceId }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
  })
  const router = useRouter()
  const { toast } = useToast()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [assignableUsers, setAssignableUsers] = useState<(Profile | any)[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assigned_to: null as string | null,
    visibility: 'internal' as 'internal' | 'client'
  })
  
  const columnColors = {
    gray: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  }
  
  const badgeColors = {
    gray: 'bg-gray-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    red: 'bg-red-500'
  }
  
  // Load assignable users when modal opens
  useEffect(() => {
    if (createModalOpen && assignableUsers.length === 0) {
      loadAssignableUsers()
    }
  }, [createModalOpen])
  
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
  
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title) {
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
      let visibility = formData.visibility
      if (formData.assigned_to) {
        const assignee = assignableUsers.find(u => u.id === formData.assigned_to)
        if (assignee?.role === 'client') {
          visibility = 'client'
        }
      }
      
      const result = await createTask({
        milestone_id: milestoneId,
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        due_date: formData.due_date || undefined,
        status: status.id as 'todo' | 'in_progress' | 'review' | 'done' | 'blocked',
        assigned_to: formData.assigned_to,
        visibility: visibility
      })
      
      if ('error' in result) {
        throw new Error(result.error)
      }
      
      toast({
        title: "Success",
        description: "Task created successfully",
      })
      
      setCreateModalOpen(false)
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        assigned_to: null,
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
    <div
      ref={setNodeRef}
      className={`
        flex flex-col h-full min-w-[300px] w-[350px] rounded-lg border-2 transition-colors
        ${columnColors[status.color as keyof typeof columnColors]}
        ${isOver ? 'ring-2 ring-primary ring-offset-2' : ''}
      `}
    >
      {/* Column Header */}
      <div className="p-3 border-b bg-background/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`${badgeColors[status.color as keyof typeof badgeColors]} text-white`}
            >
              {status.label}
            </Badge>
            <span className="text-sm text-muted-foreground font-medium">
              {tasks.length}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateTask}>
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                      Add a new task to the {status.label} column.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Design homepage mockup"
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Task details..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          value={formData.priority}
                          onValueChange={(value) => setFormData({ ...formData, priority: value })}
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
                        <Label htmlFor="due_date">Due Date</Label>
                        <Input
                          id="due_date"
                          type="datetime-local"
                          value={formData.due_date}
                          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="assignee">Assignee</Label>
                      <AssigneeSelector
                        value={formData.assigned_to}
                        onChange={(userId) => setFormData({ ...formData, assigned_to: userId })}
                        users={assignableUsers}
                        allowClient={true}
                        placeholder="Select assignee (optional)..."
                        loading={loadingUsers}
                        disabled={creating}
                      />
                      {formData.assigned_to && assignableUsers.find(u => u.id === formData.assigned_to)?.role === 'client' && (
                        <p className="text-xs text-muted-foreground">
                          Task will be visible to the client
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateModalOpen(false)}
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? 'Creating...' : 'Create Task'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Tasks Container */}
      <div className="flex-1 overflow-y-auto p-3">
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No tasks</p>
                <p className="text-xs mt-1">Drop tasks here or create new</p>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard key={task.id} task={task} serviceId={serviceId} />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}