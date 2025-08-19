"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { 
  ChevronLeft, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2,
  Eye,
  EyeOff,
  Play
} from 'lucide-react'
import { createClient } from '@/shared/lib/supabase/client'
import { previewTemplateDates } from '@/shared/lib/smart-dates'
import { formatDate } from '@/shared/lib/format-date'
import type { ServiceTemplate, TemplateMilestone, TemplateTask } from '@/shared/types'

interface TemplatePreviewProps {
  template: ServiceTemplate
  onClose: () => void
}

interface TemplateWithRelations extends ServiceTemplate {
  milestones: (TemplateMilestone & { tasks: TemplateTask[] })[]
}

export function TemplatePreview({ template, onClose }: TemplatePreviewProps) {
  const [loading, setLoading] = useState(true)
  const [templateData, setTemplateData] = useState<TemplateWithRelations | null>(null)
  const [previewStartDate, setPreviewStartDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [previewDates, setPreviewDates] = useState<any[]>([])
  
  useEffect(() => {
    loadTemplateData()
  }, [template.id])
  
  useEffect(() => {
    if (templateData && previewStartDate) {
      calculatePreviewDates()
    }
  }, [templateData, previewStartDate])
  
  const loadTemplateData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('service_templates')
        .select(`
          *,
          milestones:template_milestones(
            *,
            tasks:template_tasks(*)
          )
        `)
        .eq('id', template.id)
        .single()
      
      if (error) throw error
      
      // Sort milestones and tasks by position
      const sortedData = {
        ...data,
        milestones: (data.milestones || [])
          .sort((a: any, b: any) => a.position - b.position)
          .map((milestone: any) => ({
            ...milestone,
            tasks: (milestone.tasks || []).sort((a: any, b: any) => a.position - b.position)
          }))
      }
      
      setTemplateData(sortedData)
    } catch (error) {
      console.error('Error loading template data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const calculatePreviewDates = () => {
    if (!templateData) return
    
    try {
      const serviceStartISO = new Date(previewStartDate + 'T00:00:00.000Z').toISOString()
      const preview = previewTemplateDates(serviceStartISO, templateData.milestones)
      setPreviewDates(preview)
    } catch (error) {
      console.error('Error calculating preview dates:', error)
      setPreviewDates([])
    }
  }
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-blue-500'
      case 'low': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }
  
  const getColorTheme = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500'
      case 'green': return 'bg-green-500'
      case 'purple': return 'bg-purple-500'
      case 'orange': return 'bg-orange-500'
      case 'pink': return 'bg-pink-500'
      case 'red': return 'bg-red-500'
      case 'yellow': return 'bg-yellow-500'
      case 'indigo': return 'bg-indigo-500'
      case 'gray': return 'bg-gray-500'
      default: return 'bg-blue-500'
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (!templateData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load template data</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <DialogTitle className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${getColorTheme(templateData.color)}`} />
              {templateData.name}
              {templateData.is_default && (
                <Badge variant="secondary" className="ml-2">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Default
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Preview how this template will look when used for a new service
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
      
      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {/* Template Info */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Template Information</h3>
          <div className="space-y-2 text-sm">
            {templateData.description && (
              <p className="text-muted-foreground">{templateData.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{templateData.milestones.length} milestones</span>
              <span>{templateData.milestones.reduce((total, m) => total + m.tasks.length, 0)} tasks</span>
              <span>Created {formatDate(templateData.created_at)}</span>
            </div>
          </div>
        </div>
        
        {/* Date Preview */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Date Preview</h3>
            <div className="flex items-center gap-2">
              <Label htmlFor="preview-date" className="text-sm">Service Start:</Label>
              <Input
                id="preview-date"
                type="date"
                value={previewStartDate}
                onChange={(e) => setPreviewStartDate(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>
          
          {previewDates.length > 0 && (
            <div className="space-y-2">
              {previewDates.map((milestone, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{milestone.name}</span>
                  <span className="text-muted-foreground">
                    {milestone.calculated_start_date && formatDate(milestone.calculated_start_date)} - {milestone.calculated_due_date ? formatDate(milestone.calculated_due_date) : 'TBD'}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {milestone.duration_days} days
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Milestones & Tasks */}
        <div className="space-y-4">
          <h3 className="font-medium">Milestones & Tasks</h3>
          
          {templateData.milestones.map((milestone, milestoneIndex) => {
            const previewMilestone = previewDates[milestoneIndex]
            
            return (
              <div key={milestone.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <span className="text-sm bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center">
                        {milestoneIndex + 1}
                      </span>
                      {milestone.name}
                    </h4>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                    )}
                  </div>
                  
                  {previewMilestone && (
                    <div className="text-right text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{previewMilestone.calculated_due_date ? formatDate(previewMilestone.calculated_due_date) : 'TBD'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{previewMilestone.duration_days} days</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Tasks */}
                {milestone.tasks.length > 0 ? (
                  <div className="space-y-2 ml-8">
                    {milestone.tasks.map((task, taskIndex) => (
                      <div key={task.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {milestoneIndex + 1}.{taskIndex + 1}
                          </span>
                          <span>{task.title}</span>
                          <Badge 
                            variant="secondary" 
                            className={`text-white text-xs ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {task.visibility === 'client' ? (
                              <Eye className="h-3 w-3 text-green-600" />
                            ) : (
                              <EyeOff className="h-3 w-3 text-gray-500" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {task.estimated_hours && (
                            <span>{task.estimated_hours}h</span>
                          )}
                          {task.relative_due_days && (
                            <Badge variant="outline" className="text-xs">
                              +{task.relative_due_days} days
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground ml-8">No tasks defined</p>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Summary */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Template Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Milestones:</span>
              <div className="font-medium">{templateData.milestones.length}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Total Tasks:</span>
              <div className="font-medium">
                {templateData.milestones.reduce((total, m) => total + m.tasks.length, 0)}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Estimated Hours:</span>
              <div className="font-medium">
                {templateData.milestones.reduce((total, m) => 
                  total + m.tasks.reduce((taskTotal, t) => taskTotal + (t.estimated_hours || 0), 0), 0
                )}h
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Client Tasks:</span>
              <div className="font-medium">
                {templateData.milestones.reduce((total, m) => 
                  total + m.tasks.filter(t => t.visibility === 'client').length, 0
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button className="gap-2">
          <Play className="h-4 w-4" />
          Use This Template
        </Button>
      </DialogFooter>
    </div>
  )
}