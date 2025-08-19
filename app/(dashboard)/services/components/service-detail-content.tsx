"use client"

import { ServiceProvider } from '@/shared/contexts/service-context'
import { MilestoneSidebar } from './milestone-sidebar'
import { KanbanBoard } from './kanban-board'
import { EditMilestoneDialog } from './edit-milestone-dialog'

interface ServiceDetailContentProps {
  milestones: any[]
  serviceId: string
  showMilestoneTabs?: boolean
  isDesktop?: boolean
}

export function ServiceDetailContent({ 
  milestones, 
  serviceId, 
  showMilestoneTabs = false,
  isDesktop = false
}: ServiceDetailContentProps) {
  return (
    <ServiceProvider initialMilestones={milestones} serviceId={serviceId}>
      {isDesktop ? (
        <>
          {/* Desktop Split View */}
          <div className="w-80 border-r bg-muted/5 overflow-y-auto">
            <MilestoneSidebar />
          </div>
          <div className="flex-1 overflow-hidden">
            <KanbanBoard showMilestoneTabs={false} />
          </div>
        </>
      ) : (
        /* Mobile/Tablet View */
        <div className="flex-1 overflow-hidden">
          <KanbanBoard showMilestoneTabs={showMilestoneTabs} />
        </div>
      )}
      {/* Edit Milestone Dialog - shared across views */}
      <EditMilestoneDialog />
    </ServiceProvider>
  )
}