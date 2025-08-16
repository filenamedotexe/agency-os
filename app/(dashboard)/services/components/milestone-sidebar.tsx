"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import { Badge } from '@/shared/components/ui/badge'
import { Card } from '@/shared/components/ui/card'
import { 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Edit,
  Trash2,
  GripVertical
} from 'lucide-react'
import { formatDate } from '@/shared/lib/format-date'
import { createMilestone, updateMilestoneStatus, deleteMilestone } from '@/app/actions/milestones'
import { useToast } from '@/shared/hooks/use-toast'
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

interface MilestoneSidebarProps {
  milestones: any[]
  serviceId: string
}

export function MilestoneSidebar({ milestones = [], serviceId }: MilestoneSidebarProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(milestones[0]?.id || null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    due_date: ''
  })
  
  const statusColors = {
    upcoming: 'bg-gray-500',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500',
    delayed: 'bg-red-500'
  }
  
  const statusIcons = {
    upcoming: Clock,
    in_progress: AlertCircle,
    completed: CheckCircle2,
    delayed: AlertCircle
  }
  
  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Milestone name is required",
        variant: "destructive"
      })
      return
    }
    
    setCreating(true)
    try {
      const result = await createMilestone({
        service_id: serviceId,
        name: formData.name,
        description: formData.description || undefined,
        due_date: formData.due_date || undefined
      })
      
      if ('error' in result) {
        throw new Error(result.error)
      }
      
      toast({
        title: "Success",
        description: "Milestone created successfully",
      })
      
      setCreateModalOpen(false)
      setFormData({ name: '', description: '', due_date: '' })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create milestone",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }
  
  const handleStatusChange = async (milestoneId: string, newStatus: string) => {
    try {
      const result = await updateMilestoneStatus(milestoneId, newStatus as any)
      if ('error' in result) {
        throw new Error(result.error)
      }
      toast({
        title: "Success",
        description: "Milestone status updated",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive"
      })
    }
  }
  
  const handleDelete = async (milestoneId: string, milestoneName: string) => {
    if (!confirm(`Are you sure you want to delete "${milestoneName}"? This will also delete all tasks within this milestone.`)) {
      return
    }
    
    try {
      const result = await deleteMilestone(milestoneId)
      if ('error' in result) {
        throw new Error(result.error)
      }
      toast({
        title: "Success",
        description: "Milestone deleted successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete milestone",
        variant: "destructive"
      })
    }
  }
  
  // Sort milestones by position
  const sortedMilestones = [...milestones].sort((a, b) => a.position - b.position)
  
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Milestones</h2>
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateMilestone}>
              <DialogHeader>
                <DialogTitle>Create New Milestone</DialogTitle>
                <DialogDescription>
                  Add a new milestone to track progress on this service.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Design Phase"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this milestone..."
                    rows={3}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
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
                  {creating ? 'Creating...' : 'Create Milestone'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Milestones List */}
      <div className="space-y-3">
        {sortedMilestones.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No milestones yet</p>
            <p className="text-xs mt-1">Create your first milestone to get started</p>
          </div>
        ) : (
          sortedMilestones.map((milestone) => {
            const StatusIcon = statusIcons[milestone.status as keyof typeof statusIcons] || Clock
            const totalTasks = milestone.tasks?.length || 0
            const completedTasks = milestone.tasks?.filter((t: any) => t.status === 'done').length || 0
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
            
            return (
              <Card
                key={milestone.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedMilestone === milestone.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedMilestone(milestone.id)}
              >
                {/* Milestone Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-2 flex-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 cursor-move" />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{milestone.name}</h3>
                      {milestone.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${statusColors[milestone.status as keyof typeof statusColors]} text-white text-xs`}
                  >
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {milestone.status}
                  </Badge>
                </div>
                
                {/* Progress */}
                {totalTasks > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span>{completedTasks}/{totalTasks} tasks</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                )}
                
                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {milestone.due_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(milestone.due_date)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    {/* Quick Actions */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Edit milestone
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(milestone.id, milestone.name)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
      
      {/* Summary Stats */}
      {milestones.length > 0 && (
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-muted rounded">
              <p className="font-medium">{milestones.filter(m => m.status === 'completed').length}</p>
              <p className="text-muted-foreground">Completed</p>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <p className="font-medium">{milestones.filter(m => m.status === 'in_progress').length}</p>
              <p className="text-muted-foreground">In Progress</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}