"use client"

import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { TaskCard } from './task-card'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface VirtualTaskListProps {
  tasks: any[]
  columnId: string
}

export function VirtualTaskList({ tasks, columnId }: VirtualTaskListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated task card height
    overscan: 3, // Render 3 items outside visible area
  })

  // Don't use virtualization for small lists
  if (tasks.length < 20) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto px-2">
        <div className="space-y-2 py-2">
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    )
  }

  // Use virtualization for large lists
  return (
    <div ref={parentRef} className="flex-1 min-h-0 overflow-y-auto px-2">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const task = tasks[virtualItem.index]
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className="pb-2">
                <SortableTaskCard task={task} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Sortable wrapper for task cards
function SortableTaskCard({ task }: { task: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} />
    </div>
  )
}