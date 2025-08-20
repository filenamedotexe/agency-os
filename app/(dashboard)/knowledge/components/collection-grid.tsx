"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
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
  Grid3x3,
  List,
  Calendar
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
  resource_count?: number
}

interface CollectionGridProps {
  collections: Collection[]
  isAdmin?: boolean
}

type ViewMode = 'grid' | 'list'

export function CollectionGrid({ collections, isAdmin = false }: CollectionGridProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
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
  
  const renderViewToggle = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Collections</h2>
        <Badge variant="secondary" className="text-xs">
          {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
        </Badge>
      </div>
      
      <div className="flex items-center border rounded-lg p-1">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('grid')}
          className="h-8 px-3"
        >
          <Grid3x3 className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Grid</span>
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('list')}
          className="h-8 px-3"
        >
          <List className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">List</span>
        </Button>
      </div>
    </div>
  )

  const renderGridView = () => (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {collections.map((collection) => {
        const Icon = iconMap[collection.icon] || Folder
        const resourceCount = collection.resource_count || collection.resources?.[0]?.count || 0
        
        return (
          <Link key={collection.id} href={`/knowledge/${collection.id}`}>
            <Card className="group hover:shadow-lg hover:border-primary/20 transition-all duration-200 cursor-pointer h-full" data-testid="collection-card">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn(
                    "p-3 rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform",
                    colorMap[collection.color] || colorMap.blue
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-muted"
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
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                
                <div className="space-y-2">
                  <CardTitle className="line-clamp-1 text-lg group-hover:text-primary transition-colors">
                    {collection.name}
                  </CardTitle>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-medium">
                      {resourceCount} {resourceCount === 1 ? 'resource' : 'resources'}
                    </Badge>
                    {collection.visibility !== 'public' && (
                      <Badge variant="outline" className="text-xs">
                        {collection.visibility}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {collection.description && (
                <CardContent className="pt-0">
                  <CardDescription className="line-clamp-3 text-sm leading-relaxed">
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

  const renderListView = () => (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Collection</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead className="w-24 text-center">Resources</TableHead>
            <TableHead className="w-20 text-center">Visibility</TableHead>
            <TableHead className="hidden lg:table-cell w-32">Created</TableHead>
            {isAdmin && <TableHead className="w-12"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {collections.map((collection) => {
            const Icon = iconMap[collection.icon] || Folder
            const resourceCount = collection.resource_count || collection.resources?.[0]?.count || 0
            const createdDate = new Date(collection.created_at).toLocaleDateString()
            
            return (
              <TableRow key={collection.id} className="group hover:bg-muted/50 cursor-pointer">
                <TableCell>
                  <div className={cn(
                    "p-2 rounded-lg inline-flex",
                    colorMap[collection.color] || colorMap.blue
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                </TableCell>
                
                <TableCell>
                  <Link 
                    href={`/knowledge/${collection.id}`}
                    className="block hover:underline"
                  >
                    <div>
                      <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {collection.name}
                      </div>
                      <div className="text-sm text-muted-foreground md:hidden line-clamp-1">
                        {collection.description}
                      </div>
                    </div>
                  </Link>
                </TableCell>
                
                <TableCell className="hidden md:table-cell">
                  <div className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                    {collection.description || '—'}
                  </div>
                </TableCell>
                
                <TableCell className="text-center">
                  <Badge variant="secondary" className="text-xs">
                    {resourceCount}
                  </Badge>
                </TableCell>
                
                <TableCell className="text-center">
                  <Badge 
                    variant={collection.visibility === 'public' ? 'default' : 'outline'} 
                    className="text-xs"
                  >
                    {collection.visibility}
                  </Badge>
                </TableCell>
                
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {createdDate}
                  </div>
                </TableCell>
                
                {isAdmin && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(collection.id, collection.name)
                          }}
                          disabled={deleting === collection.id}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )

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
    <div className="space-y-6">
      {renderViewToggle()}
      {viewMode === 'grid' ? renderGridView() : renderListView()}
    </div>
  )
}