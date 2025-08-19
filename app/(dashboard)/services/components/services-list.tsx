"use client"

import { useState } from 'react'
import Link from 'next/link'
import { ServiceCard } from './service-card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { 
  LayoutGrid, 
  List,
  ChevronRight,
  Clock,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign
} from 'lucide-react'
import { formatDate } from '@/shared/lib/format-date'
import { cn } from '@/shared/lib/utils'

interface ServicesListProps {
  services: any[]
}

export function ServicesList({ services }: ServicesListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'mobile'>('grid')
  const [isMobile, setIsMobile] = useState(false)
  
  // Detect mobile on mount
  useState(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      setViewMode(window.innerWidth < 768 ? 'mobile' : 'grid')
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
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
  
  // Mobile List View
  if (viewMode === 'mobile') {
    return (
      <div className="space-y-3">
        {services.map((service) => {
          const StatusIcon = statusIcons[service.status as keyof typeof statusIcons] || Clock
          const progress = service.progress || 0
          
          return (
            <Link key={service.id} href={`/services/${service.id}`}>
              <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base line-clamp-1">{service.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={service.client?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {service.client?.full_name?.charAt(0) || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {service.client?.company || service.client?.full_name || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-white text-xs",
                      statusColors[service.status as keyof typeof statusColors]
                    )}
                  >
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {service.status}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Progress value={progress} className="h-1.5" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{progress}% complete</span>
                    {service.end_date && (
                      <span>Due {formatDate(service.end_date)}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex items-center gap-3 text-xs">
                    {service.milestones && (
                      <span>
                        {service.milestones.filter((m: any) => m.status === 'completed').length}/{service.milestones.length} milestones
                      </span>
                    )}
                    {service.budget && (
                      <span>${service.budget.toLocaleString()}</span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    )
  }
  
  // Desktop Table View
  if (viewMode === 'table') {
    return (
      <>
        <div className="flex justify-end mb-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Milestones</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => {
                const StatusIcon = statusIcons[service.status as keyof typeof statusIcons] || Clock
                const progress = service.progress || 0
                const completedMilestones = service.milestones?.filter((m: any) => m.status === 'completed').length || 0
                const totalMilestones = service.milestones?.length || 0
                
                return (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">
                      <Link href={`/services/${service.id}`} className="hover:underline">
                        {service.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={service.client?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {service.client?.full_name?.charAt(0) || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {service.client?.company || service.client?.full_name || 'Unknown'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={cn(
                          "text-white",
                          statusColors[service.status as keyof typeof statusColors]
                        )}
                      >
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {service.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="w-20 h-2" />
                        <span className="text-sm text-muted-foreground">{progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {completedMilestones}/{totalMilestones}
                      </span>
                    </TableCell>
                    <TableCell>
                      {service.end_date ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(service.end_date)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {service.budget ? (
                        <div className="flex items-center gap-1 text-sm">
                          <DollarSign className="h-3 w-3" />
                          {service.budget.toLocaleString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/services/${service.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                          <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </>
    )
  }
  
  // Desktop Grid View (default)
  return (
    <>
      {!isMobile && (
        <div className="flex justify-end mb-4">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {services.map((service: any) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </>
  )
}