"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { TaskColumn } from './task-column'
import { TaskCard } from './task-card'
import { updateTaskPosition } from '@/app/actions/tasks'
import { useToast } from '@/shared/hooks/use-toast'
import { Button } from '@/shared/components/ui/button'
import { Plus } from 'lucide-react'

const TASK_STATUSES = [
  { id: 'todo', label: 'To Do', color: 'gray' },
  { id: 'in_progress', label: 'In Progress', color: 'blue' },
  { id: 'review', label: 'Review', color: 'yellow' },
  { id: 'done', label: 'Done', color: 'green' },
  { id: 'blocked', label: 'Blocked', color: 'red' }
]

interface KanbanBoardProps {
  milestones: any[]
  serviceId: string
  showMilestoneTabs?: boolean
}

export function KanbanBoard({ milestones = [], serviceId, showMilestoneTabs = true }: KanbanBoardProps) {
  const [activeMilestone, setActiveMilestone] = useState(milestones[0]?.id || null)
  const [activeTask, setActiveTask] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const router = useRouter()
  const { toast } = useToast()
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  // Get current milestone and its tasks
  const currentMilestone = milestones.find(m => m.id === activeMilestone)
  
  useEffect(() => {
    if (currentMilestone?.tasks) {
      setTasks(currentMilestone.tasks)
    }
  }, [currentMilestone])
  
  // Group tasks by status
  const tasksByStatus = TASK_STATUSES.reduce((acc, status) => {
    acc[status.id] = tasks
      .filter(task => task.status === status.id)
      .sort((a, b) => a.position - b.position)
    return acc
  }, {} as Record<string, any[]>)
  
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    setActiveTask(task)
  }
  
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    
    if (!over) return
    
    const activeTask = tasks.find(t => t.id === active.id)
    if (!activeTask) return
    
    // Check if we're over a column
    const overColumn = TASK_STATUSES.find(s => s.id === over.id)
    if (overColumn && activeTask.status !== overColumn.id) {
      // Update task status optimistically
      setTasks(prev => prev.map(task => 
        task.id === activeTask.id 
          ? { ...task, status: overColumn.id }
          : task
      ))
    }
  }
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveTask(null)
      return
    }
    
    const activeTask = tasks.find(t => t.id === active.id)
    if (!activeTask) {
      setActiveTask(null)
      return
    }
    
    // Determine the target status and position
    let targetStatus = activeTask.status
    let targetPosition = activeTask.position
    
    // Check if dropped on a column
    const overColumn = TASK_STATUSES.find(s => s.id === over.id)
    if (overColumn) {
      targetStatus = overColumn.id
      targetPosition = tasksByStatus[overColumn.id].length
    } else {
      // Dropped on another task
      const overTask = tasks.find(t => t.id === over.id)
      if (overTask) {
        targetStatus = overTask.status
        
        // Calculate new position
        const tasksInColumn = tasksByStatus[targetStatus]
        const overIndex = tasksInColumn.findIndex(t => t.id === over.id)
        targetPosition = overIndex >= 0 ? overIndex : tasksInColumn.length
      }
    }
    
    // Only update if something changed
    if (activeTask.status !== targetStatus || activeTask.position !== targetPosition) {
      // Optimistic update
      const updatedTasks = [...tasks]
      const taskIndex = updatedTasks.findIndex(t => t.id === activeTask.id)
      if (taskIndex >= 0) {
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          status: targetStatus,
          position: targetPosition
        }
        setTasks(updatedTasks)
      }
      
      // Server update
      try {
        const result = await updateTaskPosition(
          activeTask.id,
          targetStatus as any,
          targetPosition,
          activeMilestone
        )
        
        if ('error' in result) {
          throw new Error(result.error)
        }
        
        // Refresh to get updated data
        router.refresh()
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update task position",
          variant: "destructive"
        })
        
        // Revert optimistic update
        setTasks(currentMilestone?.tasks || [])
      }
    }
    
    setActiveTask(null)
  }
  
  if (milestones.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No milestones created yet</p>
          <p className="text-sm text-muted-foreground">Create milestones from the sidebar to start adding tasks</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Milestone Tabs (for mobile/tablet) */}
      {showMilestoneTabs && milestones.length > 0 && (
        <div className="border-b bg-background px-4 sm:px-6">
          <div className="flex gap-2 py-3 overflow-x-auto">
            {milestones.map(milestone => {
              const totalTasks = milestone.tasks?.length || 0
              const completedTasks = milestone.tasks?.filter((t: any) => t.status === 'done').length || 0
              
              return (
                <button
                  key={milestone.id}
                  onClick={() => setActiveMilestone(milestone.id)}
                  className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${
                    activeMilestone === milestone.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  {milestone.name}
                  <span className="ml-2 text-xs opacity-80">
                    ({completedTasks}/{totalTasks})
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden p-4 sm:p-6">
        {currentMilestone ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 h-full overflow-x-auto pb-4">
              {TASK_STATUSES.map(status => (
                <TaskColumn
                  key={status.id}
                  status={status}
                  tasks={tasksByStatus[status.id] || []}
                  milestoneId={activeMilestone}
                />
              ))}
            </div>
            
            <DragOverlay>
              {activeTask && <TaskCard task={activeTask} isDragging />}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a milestone to view tasks</p>
          </div>
        )}
      </div>
    </div>
  )
}