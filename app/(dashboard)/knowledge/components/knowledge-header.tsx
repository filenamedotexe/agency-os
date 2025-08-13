"use client"

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { useToast } from '@/shared/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { createCollection } from '@/app/actions/knowledge'

export function KnowledgeHeader() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  
  // Form data
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('folder')
  const [color, setColor] = useState('blue')
  const [visibility, setVisibility] = useState('clients')
  
  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a collection name",
        variant: "destructive"
      })
      return
    }
    
    setLoading(true)
    
    try {
      const { error } = await createCollection({
        name: name.trim(),
        description: description.trim() || undefined,
        visibility: visibility as 'public' | 'clients' | 'team' | undefined
      })
      
      if (error) {
        throw new Error(error)
      }
      
      toast({
        title: "Success",
        description: "Collection created successfully"
      })
      
      // Reset form
      setName('')
      setDescription('')
      setIcon('folder')
      setColor('blue')
      setVisibility('clients')
      setOpen(false)
      
      // Refresh page
      router.refresh()
      
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create collection",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Organize your resources into collections for easy sharing
      </div>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Collection
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
            <DialogDescription>
              Create a new collection to organize your resources
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Collection name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="icon">Icon</Label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="folder">📁 Folder</SelectItem>
                    <SelectItem value="file">📄 File</SelectItem>
                    <SelectItem value="video">📹 Video</SelectItem>
                    <SelectItem value="link">🔗 Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">🔵 Blue</SelectItem>
                    <SelectItem value="green">🟢 Green</SelectItem>
                    <SelectItem value="purple">🟣 Purple</SelectItem>
                    <SelectItem value="orange">🟠 Orange</SelectItem>
                    <SelectItem value="red">🔴 Red</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - Everyone can see</SelectItem>
                  <SelectItem value="clients">Clients - All clients can see</SelectItem>
                  <SelectItem value="team">Team - Only admin and team</SelectItem>
                  <SelectItem value="admin">Admin - Only admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Collection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}