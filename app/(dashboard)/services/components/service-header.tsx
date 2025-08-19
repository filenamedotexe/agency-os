"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Progress } from '@/shared/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  DollarSign,
  Clock,
  MoreVertical,
  Edit,
  Pause,
  Play,
  CheckCircle,
  XCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { formatDate } from '@/shared/lib/format-date'
import { updateServiceStatus } from '@/app/actions/services'
import { useToast } from '@/shared/hooks/use-toast'
import { useState } from 'react'
import { EditServiceDialog } from './edit-service-dialog'

interface ServiceHeaderProps {
  service: any
  isClient?: boolean
}

export function ServiceHeader({ service, isClient = false }: ServiceHeaderProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [updating, setUpdating] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  
  const statusColors = {
    planning: 'bg-gray-500',
    active: 'bg-green-500',
    paused: 'bg-yellow-500',
    completed: 'bg-blue-500',
    cancelled: 'bg-red-500'
  }
  
  const statusIcons = {
    planning: Clock,
    active: Play,
    paused: Pause,
    completed: CheckCircle,
    cancelled: XCircle
  }
  
  const StatusIcon = statusIcons[service.status as keyof typeof statusIcons] || Clock
  
  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true)
    try {
      const result = await updateServiceStatus(service.id, newStatus as any)
      if ('error' in result) {
        throw new Error(result.error)
      }
      toast({
        title: "Success",
        description: `Service status updated to ${newStatus}`,
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }
  
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 sm:py-6">
          {/* Top Row - Navigation and Actions */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/services">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Services</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
            
            {!isClient && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={updating}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Service
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange('planning')}
                    disabled={service.status === 'planning'}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Set to Planning
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange('active')}
                    disabled={service.status === 'active'}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Set to Active
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange('paused')}
                    disabled={service.status === 'paused'}
                  >
                    <Pause className="mr-2 h-4 w-4" />
                    Pause Service
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange('completed')}
                    disabled={service.status === 'completed'}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Completed
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={service.status === 'cancelled'}
                    className="text-destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Service
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {/* Service Info */}
          <div className="space-y-4">
            {/* Title and Status */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold">{service.name}</h1>
              <div className="flex items-center gap-2">
                <Badge className={`${statusColors[service.status as keyof typeof statusColors]} text-white border-0`}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {service.status}
                </Badge>
              </div>
            </div>
            
            {/* Client Info */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Avatar className="h-6 w-6">
                <AvatarImage src={service.client?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {service.client?.full_name?.charAt(0) || 'C'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">
                {service.client?.company || service.client?.full_name || 'Unknown Client'}
              </span>
              {service.client?.email && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="text-sm">{service.client.email}</span>
                </>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{service.progress || 0}%</span>
              </div>
              <Progress value={service.progress || 0} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{service.completedMilestones || 0} of {service.totalMilestones || 0} milestones completed</span>
              </div>
            </div>
            
            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 text-sm">
              {/* Team Members */}
              {service.service_members && service.service_members.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex -space-x-2">
                    {service.service_members.slice(0, 5).map((member: any) => (
                      <Avatar key={member.user?.id || member.id} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={member.user?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {member.user?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  {service.service_members.length > 5 && (
                    <span className="text-xs text-muted-foreground">
                      +{service.service_members.length - 5}
                    </span>
                  )}
                </div>
              )}
              
              {/* Dates */}
              {(service.start_date || service.end_date) && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {service.start_date && formatDate(service.start_date)}
                    {service.start_date && service.end_date && ' - '}
                    {service.end_date && formatDate(service.end_date)}
                  </span>
                </div>
              )}
              
              {/* Budget */}
              {service.budget && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    ${service.budget.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Service Dialog */}
      <EditServiceDialog 
        service={service}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  )
}