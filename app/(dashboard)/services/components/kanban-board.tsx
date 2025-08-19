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
import { MobileTaskList } from './mobile-task-list'
import { updateTaskPosition } from '@/app/actions/tasks'
import { useToast } from '@/shared/hooks/use-toast'
import { useMobileDetectSSR } from '@/shared/hooks/use-mobile-detect'
import { useServiceContext, useSelectedMilestone } from '@/shared/contexts/service-context'
import { AssigneeAvatar } from '@/shared/components/ui/assignee-avatar'
import { Button } from '@/shared/components/ui/button'
import { Plus, User } from 'lucide-react'

const TASK_STATUSES = [
  { id: 'todo', label: 'To Do', color: 'gray' },
  { id: 'in_progress', label: 'In Progress', color: 'blue' },
  { id: 'review', label: 'Review', color: 'yellow' },
  { id: 'done', label: 'Done', color: 'green' },
  { id: 'blocked', label: 'Blocked', color: 'red' }
]

interface KanbanBoardProps {
  showMilestoneTabs?: boolean
}

export function KanbanBoard({ showMilestoneTabs = true }: KanbanBoardProps) {
  const { 
    selectedMilestoneId, 
    setSelectedMilestoneId, 
    milestones, 
    serviceId 
  } = useServiceContext()
  const currentMilestone = useSelectedMilestone()
  const [activeTask, setActiveTask] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { isMobile, isTablet, isTouchDevice } = useMobileDetectSSR()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
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
  
  // Tasks are updated from current milestone
  
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
          selectedMilestoneId || undefined
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
  
  // Show mobile view for phones, tablets with touch, or narrow viewports
  // Don't render mobile view until mounted to avoid hydration mismatch
  const shouldShowMobileView = mounted && (isMobile || isTablet || isTouchDevice)
  
  if (shouldShowMobileView && showMilestoneTabs) {
    return (
      <div className="h-full flex flex-col">
        {/* Milestone Tabs */}
        {milestones.length > 0 && (
          <div className="border-b bg-background px-4">
            <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
              {milestones.map(milestone => {
                const totalTasks = milestone.tasks?.length || 0
                const completedTasks = milestone.tasks?.filter((t: any) => t.status === 'done').length || 0
                
                return (
                  <button
                    key={milestone.id}
                    onClick={() => setSelectedMilestoneId(milestone.id)}
                    className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${
                      selectedMilestoneId === milestone.id
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
        
        {/* Mobile Task List */}
        <div className="flex-1 overflow-y-auto">
          {currentMilestone ? (
            <MobileTaskList
              tasks={currentMilestone.tasks || []}
              milestoneId={selectedMilestoneId}
              serviceId={serviceId || ''}
              teamMembers={[]} // TODO: Pass actual team members
            />
          ) : (
            <div className="flex items-center justify-center h-full p-4">
              <p className="text-muted-foreground text-center">
                Select a milestone to view tasks
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // Desktop Kanban Board
  return (
    <div className="h-full flex flex-col">
      {/* Milestone Tabs (for tablet without touch) */}
      {showMilestoneTabs && milestones.length > 0 && (
        <div className="border-b bg-background px-4 sm:px-6">
          <div className="flex gap-2 py-3 overflow-x-auto">
            {milestones.map(milestone => {
              const totalTasks = milestone.tasks?.length || 0
              const completedTasks = milestone.tasks?.filter((t: any) => t.status === 'done').length || 0
              
              return (
                <button
                  key={milestone.id}
                  onClick={() => setSelectedMilestoneId(milestone.id)}
                  className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors whitespace-nowrap ${
                    selectedMilestoneId === milestone.id
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
          <>
            {/* Milestone Header with Assignee */}
            {!showMilestoneTabs && (
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">{currentMilestone.name}</h2>
                  {(currentMilestone.assignee_profile || currentMilestone.assignee) && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Assignee:</span>
                      <AssigneeAvatar
                        user={currentMilestone.assignee_profile || currentMilestone.assignee}
                        size="sm"
                        showName={true}
                        showTooltip={false}
                      />
                    </div>
                  )}
                </div>
                {currentMilestone.description && (
                  <p className="text-sm text-muted-foreground max-w-md">{currentMilestone.description}</p>
                )}
              </div>
            )}
            
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
                  milestoneId={selectedMilestoneId}
                  serviceId={serviceId || ''}
                />
              ))}
            </div>
            
              <DragOverlay>
                {activeTask && <TaskCard task={activeTask} isDragging serviceId={serviceId} />}
              </DragOverlay>
            </DndContext>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a milestone to view tasks</p>
          </div>
        )}
      </div>
    </div>
  )
}