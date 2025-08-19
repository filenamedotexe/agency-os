"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { Milestone, Profile, MilestoneWithAssignee } from '@/shared/types'

interface ServiceContextValue {
  selectedMilestoneId: string | null
  setSelectedMilestoneId: (id: string | null) => void
  milestones: MilestoneWithAssignee[]
  setMilestones: (milestones: MilestoneWithAssignee[]) => void
  serviceId: string
  isEditMilestoneOpen: boolean
  setIsEditMilestoneOpen: (open: boolean) => void
  editingMilestone: MilestoneWithAssignee | null
  setEditingMilestone: (milestone: MilestoneWithAssignee | null) => void
}

const ServiceContext = createContext<ServiceContextValue | undefined>(undefined)

interface ServiceProviderProps {
  children: ReactNode
  initialMilestones: MilestoneWithAssignee[]
  serviceId: string
}

export function ServiceProvider({ 
  children, 
  initialMilestones, 
  serviceId 
}: ServiceProviderProps) {
  // State for milestone selection - default to first milestone
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(
    initialMilestones[0]?.id || null
  )
  
  // State for milestones list
  const [milestones, setMilestones] = useState<MilestoneWithAssignee[]>(initialMilestones)
  
  // State for edit milestone dialog
  const [isEditMilestoneOpen, setIsEditMilestoneOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<MilestoneWithAssignee | null>(null)
  
  // Update selected milestone if current one is deleted
  const handleSetMilestones = useCallback((newMilestones: MilestoneWithAssignee[]) => {
    setMilestones(newMilestones)
    
    // If selected milestone no longer exists, select the first one
    if (selectedMilestoneId && !newMilestones.find(m => m.id === selectedMilestoneId)) {
      setSelectedMilestoneId(newMilestones[0]?.id || null)
    }
  }, [selectedMilestoneId])
  
  // Open edit dialog with milestone
  const handleEditMilestone = useCallback((milestone: MilestoneWithAssignee | null) => {
    setEditingMilestone(milestone)
    if (milestone) {
      setIsEditMilestoneOpen(true)
    }
  }, [])
  
  const value: ServiceContextValue = {
    selectedMilestoneId,
    setSelectedMilestoneId,
    milestones,
    setMilestones: handleSetMilestones,
    serviceId,
    isEditMilestoneOpen,
    setIsEditMilestoneOpen,
    editingMilestone,
    setEditingMilestone: handleEditMilestone
  }
  
  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  )
}

// Custom hook to use the service context
export function useServiceContext() {
  const context = useContext(ServiceContext)
  if (context === undefined) {
    throw new Error('useServiceContext must be used within a ServiceProvider')
  }
  return context
}

// Helper hook to get the currently selected milestone
export function useSelectedMilestone() {
  const { selectedMilestoneId, milestones } = useServiceContext()
  return milestones.find(m => m.id === selectedMilestoneId) || null
}