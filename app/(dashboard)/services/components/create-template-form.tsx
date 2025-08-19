"use client"

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
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
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { useToast } from '@/shared/hooks/use-toast'
import { 
  Loader2, 
  Plus, 
  Trash2, 
  GripVertical,
  ChevronLeft,
  FileText,
  Clock
} from 'lucide-react'
import { SmartDateInput } from './smart-date-input'
import { createServiceTemplate } from '@/app/actions/service-templates'
import type { CreateTemplateData } from '@/shared/types'

interface CreateTemplateFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface MilestoneFormData {
  id: string
  name: string
  description: string
  position: number
  relative_start_days: string
  relative_due_days: string
  tasks: TaskFormData[]
}

interface TaskFormData {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimated_hours: string
  position: number
  relative_due_days: string
  visibility: 'internal' | 'client'
}

export function CreateTemplateForm({ onSuccess, onCancel }: CreateTemplateFormProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  // Template basic info
  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    color: 'blue' as const
  })
  
  // Milestones and tasks
  const [milestones, setMilestones] = useState<MilestoneFormData[]>([
    {
      id: '1',
      name: '',
      description: '',
      position: 0,
      relative_start_days: '0',
      relative_due_days: '7',
      tasks: []
    }
  ])
  
  const addMilestone = () => {
    const newMilestone: MilestoneFormData = {
      id: Date.now().toString(),
      name: '',
      description: '',
      position: milestones.length,
      relative_start_days: milestones.length > 0 ? milestones[milestones.length - 1].relative_due_days : '0',
      relative_due_days: '7',
      tasks: []
    }
    setMilestones([...milestones, newMilestone])
  }
  
  const removeMilestone = (milestoneId: string) => {
    if (milestones.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "A template must have at least one milestone",
        variant: "destructive"
      })
      return
    }
    
    setMilestones(milestones.filter(m => m.id !== milestoneId).map((m, index) => ({
      ...m,
      position: index
    })))
  }
  
  const updateMilestone = (milestoneId: string, updates: Partial<MilestoneFormData>) => {
    setMilestones(milestones.map(m => 
      m.id === milestoneId ? { ...m, ...updates } : m
    ))
  }
  
  const addTask = (milestoneId: string) => {
    const milestone = milestones.find(m => m.id === milestoneId)
    if (!milestone) return
    
    const newTask: TaskFormData = {
      id: Date.now().toString(),
      title: '',
      description: '',
      priority: 'medium',
      estimated_hours: '',
      position: milestone.tasks.length,
      relative_due_days: '1',
      visibility: 'internal'
    }
    
    updateMilestone(milestoneId, {
      tasks: [...milestone.tasks, newTask]
    })
  }
  
  const removeTask = (milestoneId: string, taskId: string) => {
    const milestone = milestones.find(m => m.id === milestoneId)
    if (!milestone) return
    
    updateMilestone(milestoneId, {
      tasks: milestone.tasks.filter(t => t.id !== taskId).map((t, index) => ({
        ...t,
        position: index
      }))
    })
  }
  
  const updateTask = (milestoneId: string, taskId: string, updates: Partial<TaskFormData>) => {
    const milestone = milestones.find(m => m.id === milestoneId)
    if (!milestone) return
    
    updateMilestone(milestoneId, {
      tasks: milestone.tasks.map(t =>
        t.id === taskId ? { ...t, ...updates } : t
      )
    })
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!templateData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Template name is required",
        variant: "destructive"
      })
      return
    }
    
    if (milestones.some(m => !m.name.trim())) {
      toast({
        title: "Validation Error", 
        description: "All milestones must have a name",
        variant: "destructive"
      })
      return
    }
    
    setLoading(true)
    
    try {
      const templatePayload: CreateTemplateData = {
        name: templateData.name,
        description: templateData.description || undefined,
        color: templateData.color,
        milestones: milestones.map(m => ({
          name: m.name,
          description: m.description || undefined,
          position: m.position,
          relative_start_days: m.relative_start_days,
          relative_due_days: m.relative_due_days,
          tasks: m.tasks.map(t => ({
            title: t.title,
            description: t.description || undefined,
            priority: t.priority,
            estimated_hours: t.estimated_hours ? parseInt(t.estimated_hours, 10) : undefined,
            position: t.position,
            relative_due_days: t.relative_due_days,
            visibility: t.visibility
          }))
        }))
      }
      
      const result = await createServiceTemplate(templatePayload)
      
      if ('error' in result) {
        throw new Error(result.error)
      }
      
      onSuccess()
    } catch (error) {
      console.error('Error creating template:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create template",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
                        onClick={onCancel}
            className="p-1"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <DialogTitle>Create Service Template</DialogTitle>
            <DialogDescription>
              Create a reusable template with milestones and tasks
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
      
      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {/* Template Basic Info */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Template Information
          </h3>
          
          <div className="grid gap-4">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Website Development"
                value={templateData.name}
                onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this template..."
                value={templateData.description}
                onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="color">Color Theme</Label>
              <Select
                value={templateData.color}
                onValueChange={(value) => setTemplateData({ ...templateData, color: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-500" />
                      Blue
                    </div>
                  </SelectItem>
                  <SelectItem value="green">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-500" />
                      Green
                    </div>
                  </SelectItem>
                  <SelectItem value="purple">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-purple-500" />
                      Purple
                    </div>
                  </SelectItem>
                  <SelectItem value="orange">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-orange-500" />
                      Orange
                    </div>
                  </SelectItem>
                  <SelectItem value="pink">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-pink-500" />
                      Pink
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Milestones */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Milestones & Tasks
            </h3>
            <Button
              type="button"
              variant="outline"
                            onClick={addMilestone}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Milestone
            </Button>
          </div>
          
          {milestones.map((milestone, milestoneIndex) => (
            <div key={milestone.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Milestone {milestoneIndex + 1}</span>
                {milestones.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                                        onClick={() => removeMilestone(milestone.id)}
                    className="ml-auto p-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Milestone Name *</Label>
                  <Input
                    placeholder="e.g., Discovery & Planning"
                    value={milestone.name}
                    onChange={(e) => updateMilestone(milestone.id, { name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Input
                    placeholder="Brief description..."
                    value={milestone.description}
                    onChange={(e) => updateMilestone(milestone.id, { description: e.target.value })}
                  />
                </div>
                
                <SmartDateInput
                  label="Start Time"
                  placeholder="e.g., same day, 1 week"
                  value={milestone.relative_start_days}
                  onChange={(value) => updateMilestone(milestone.id, { relative_start_days: value })}
                  description="When this milestone starts relative to service start"
                />
                
                <SmartDateInput
                  label="Due Time"
                  placeholder="e.g., 1 week, 2 months"
                  value={milestone.relative_due_days}
                  onChange={(value) => updateMilestone(milestone.id, { relative_due_days: value })}
                  description="When this milestone is due relative to service start"
                  required
                />
              </div>
              
              {/* Tasks for this milestone */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Tasks</Label>
                  <Button
                    type="button"
                    variant="outline"
                                        onClick={() => addTask(milestone.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Task
                  </Button>
                </div>
                
                {milestone.tasks.map((task, taskIndex) => (
                  <div key={task.id} className="p-3 bg-muted/50 rounded border space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">Task {taskIndex + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                                                onClick={() => removeTask(milestone.id, task.id)}
                        className="ml-auto p-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Task Title *</Label>
                        <Input
                          placeholder="e.g., Client kickoff meeting"
                          value={task.title}
                          onChange={(e) => updateTask(milestone.id, task.id, { title: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">Priority</Label>
                        <Select
                          value={task.priority}
                          onValueChange={(value) => updateTask(milestone.id, task.id, { priority: value })}
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
                      
                      <div>
                        <Label className="text-xs">Estimated Hours</Label>
                        <Input
                                                    type="number"
                          placeholder="8"
                          value={task.estimated_hours}
                          onChange={(e) => updateTask(milestone.id, task.id, { estimated_hours: e.target.value })}
                          min="1"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">Visibility</Label>
                        <Select
                          value={task.visibility}
                          onValueChange={(value) => updateTask(milestone.id, task.id, { visibility: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="internal">Internal Only</SelectItem>
                            <SelectItem value="client">Client Visible</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <SmartDateInput
                      label="Due Time"
                      placeholder="e.g., 3 days, 1 week"
                      value={task.relative_due_days}
                      onChange={(value) => updateTask(milestone.id, task.id, { relative_due_days: value })}
                      description="When this task is due relative to milestone start"
                      className="text-xs"
                    />
                  </div>
                ))}
                
                {milestone.tasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No tasks yet. Click &ldquo;Add Task&rdquo; to create the first task.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Template'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}