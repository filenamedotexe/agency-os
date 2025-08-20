"use client"

import { useState } from 'react'
import { ResourceList } from './resource-list'
import { UnifiedResourceCreator } from './unified-resource-creator'
import { EditResourceDialog } from './edit-resource-dialog'

interface Resource {
  id: string
  title: string
  description?: string | null
  rich_description?: object | null
  type: string
  content_url?: string | null
  file_name?: string | null
  file_size?: number | null
  mime_type?: string | null
  created_at: string
}

interface Collection {
  id: string
  name: string
  description?: string | null
  resources?: Resource[]
}

interface KnowledgeCollectionClientProps {
  collection: Collection
  isAdmin: boolean
  userRole: 'admin' | 'team_member' | 'client'
}

export function KnowledgeCollectionClient({ 
  collection, 
  isAdmin, 
  userRole 
}: KnowledgeCollectionClientProps) {
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource)
    setIsEditDialogOpen(true)
  }

  const handleEditDialogClose = (open: boolean) => {
    setIsEditDialogOpen(open)
    if (!open) {
      setEditingResource(null)
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{collection.name}</h1>
          {collection.description && (
            <p className="text-muted-foreground">{collection.description}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {collection.resources?.length || 0} resource{collection.resources?.length === 1 ? '' : 's'}
          </p>
        </div>
        
        {isAdmin && (
          <UnifiedResourceCreator 
            collectionId={collection.id} 
            userRole={userRole} 
          />
        )}
      </div>
      
      <ResourceList 
        resources={collection.resources || []}
        isAdmin={isAdmin}
        onEdit={handleEditResource}
      />
      
      <EditResourceDialog
        resource={editingResource}
        open={isEditDialogOpen}
        onOpenChange={handleEditDialogClose}
        userRole={userRole}
      />
    </>
  )
}