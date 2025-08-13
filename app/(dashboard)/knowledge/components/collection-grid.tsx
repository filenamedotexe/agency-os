"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/shared/components/ui/dropdown-menu'
import { 
  Folder, 
  FileText, 
  Video, 
  Link as LinkIcon,
  MoreVertical,
  Trash,
  Eye
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { deleteCollection } from '@/app/actions/knowledge'
import { useToast } from '@/shared/hooks/use-toast'
import { useRouter } from 'next/navigation'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  folder: Folder,
  file: FileText,
  video: Video,
  link: LinkIcon
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  red: 'bg-red-100 text-red-700'
}

interface Collection {
  id: string
  name: string
  description?: string
  icon: string
  color: string
  visibility: string
  created_at: string
  resources?: Array<{ count: number }>
}

interface CollectionGridProps {
  collections: Collection[]
  isAdmin?: boolean
}

export function CollectionGrid({ collections, isAdmin = false }: CollectionGridProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return
    
    setDeleting(id)
    const { error } = await deleteCollection(id)
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: "Collection deleted successfully"
      })
      router.refresh()
    }
    setDeleting(null)
  }
  
  if (collections.length === 0) {
    return (
      <div className="text-center py-12">
        <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No collections yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {isAdmin 
            ? "Create your first collection to start organizing resources for your clients"
            : "No resource collections are available yet"
          }
        </p>
      </div>
    )
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {collections.map((collection) => {
        const Icon = iconMap[collection.icon] || Folder
        const resourceCount = collection.resources?.[0]?.count || 0
        
        return (
          <Link key={collection.id} href={`/knowledge/${collection.id}`}>
            <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "p-3 rounded-lg flex-shrink-0",
                      colorMap[collection.color] || colorMap.blue
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="line-clamp-1 text-base hover:underline">
                        {collection.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {resourceCount} {resourceCount === 1 ? 'item' : 'items'}
                        </Badge>
                        {collection.visibility !== 'clients' && (
                          <Badge variant="outline" className="text-xs">
                            {collection.visibility}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                          onClick={(e) => e.preventDefault()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.preventDefault()
                            handleDelete(collection.id, collection.name)
                          }}
                          disabled={deleting === collection.id}
                          className="text-destructive"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              
              {collection.description && (
                <CardContent className="pt-0">
                  <CardDescription className="line-clamp-2 text-sm">
                    {collection.description}
                  </CardDescription>
                </CardContent>
              )}
            </Card>
          </Link>
        )
      })}
    </div>
  )
}