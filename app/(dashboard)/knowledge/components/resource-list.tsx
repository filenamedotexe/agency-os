"use client"

import { useState } from 'react'
import { deleteResource } from '@/app/actions/knowledge'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { FileText, Video, File, Download, Trash2, ExternalLink } from 'lucide-react'
import { formatDate } from '@/shared/lib/format-date'
import { useToast } from '@/shared/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'

interface Resource {
  id: string
  title: string
  description?: string | null
  type: string
  content_url: string
  file_name?: string | null
  file_size?: number | null
  mime_type?: string | null
  created_at: string
}

interface ResourceListProps {
  resources: Resource[]
  collectionId: string
  isAdmin: boolean
}

export function ResourceList({ resources, collectionId, isAdmin }: ResourceListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDelete = async (resourceId: string) => {
    setLoading(resourceId)
    try {
      const result = await deleteResource(resourceId)
      if (result.error) {
        throw new Error(result.error)
      }
      toast({
        title: "Success",
        description: "Resource deleted successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete resource',
        variant: "destructive"
      })
    } finally {
      setLoading(null)
      setDeleteId(null)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-5 w-5" />
      case 'video':
        return <Video className="h-5 w-5" />
      default:
        return <File className="h-5 w-5" />
    }
  }

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return ''
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No resources in this collection yet</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4">
        {resources.map((resource) => (
          <Card key={resource.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="mt-1">{getIcon(resource.type)}</div>
                <div className="flex-1">
                  <h3 className="font-medium">{resource.title}</h3>
                  {resource.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {resource.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{formatDate(resource.created_at)}</span>
                    {resource.file_size && (
                      <span>{formatFileSize(resource.file_size)}</span>
                    )}
                    {resource.file_name && (
                      <span className="truncate max-w-[200px]">{resource.file_name}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a href={resource.content_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a href={resource.content_url} download={resource.file_name}>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(resource.id)}
                    disabled={loading === resource.id}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this resource? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}