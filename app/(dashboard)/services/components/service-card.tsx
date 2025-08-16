"use client"

import Link from 'next/link'
import { Card } from '@/shared/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Calendar, Users, TrendingUp, Clock } from 'lucide-react'
import { formatDate } from '@/shared/lib/format-date'

interface ServiceCardProps {
  service: any
}

export function ServiceCard({ service }: ServiceCardProps) {
  const statusColors = {
    planning: 'bg-gray-500',
    active: 'bg-green-500',
    paused: 'bg-yellow-500',
    completed: 'bg-blue-500',
    cancelled: 'bg-red-500'
  }
  
  const statusLabels = {
    planning: 'Planning',
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }
  
  // Color schemes for service cards
  const colorSchemes = {
    blue: 'from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-900',
    green: 'from-green-500/10 to-green-600/10 border-green-200 dark:border-green-900',
    purple: 'from-purple-500/10 to-purple-600/10 border-purple-200 dark:border-purple-900',
    orange: 'from-orange-500/10 to-orange-600/10 border-orange-200 dark:border-orange-900',
    pink: 'from-pink-500/10 to-pink-600/10 border-pink-200 dark:border-pink-900'
  }
  
  const cardColor = colorSchemes[service.color as keyof typeof colorSchemes] || colorSchemes.blue
  const progress = service.progress || 0
  
  return (
    <Link href={`/services/${service.id}`}>
      <Card className={`p-6 hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br ${cardColor} border-2 group`}>
        {/* Status Badge & Progress */}
        <div className="flex justify-between items-start mb-4">
          <span className={`px-2.5 py-1 rounded-full text-xs text-white font-medium ${statusColors[service.status as keyof typeof statusColors]}`}>
            {statusLabels[service.status as keyof typeof statusLabels]}
          </span>
          <span className="text-2xl font-bold text-foreground/80">
            {progress}%
          </span>
        </div>
        
        {/* Service Name & Client */}
        <div className="mb-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
            {service.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {service.client?.company || service.client?.full_name || 'No client'}
          </p>
        </div>
        
        {/* Circular Progress Ring */}
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-32 h-32 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted/30"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
              className="text-primary transition-all duration-700 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{progress}%</span>
            <span className="text-xs text-muted-foreground">Complete</span>
          </div>
        </div>
        
        {/* Milestones Summary */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>{service.completedMilestones || 0}</span>
          </div>
          <span>/</span>
          <span>{service.totalMilestones || 0} milestones</span>
        </div>
        
        {/* Next Milestone */}
        {service.nextMilestone && (
          <div className="mb-4 p-3 bg-background/50 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-1">Next Milestone</p>
            <p className="text-sm font-medium line-clamp-1">{service.nextMilestone.name}</p>
            {service.nextMilestone.due_date && (
              <p className="text-xs text-muted-foreground mt-1">
                Due {formatDate(service.nextMilestone.due_date)}
              </p>
            )}
          </div>
        )}
        
        {/* Footer Info */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          {/* Team Members */}
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {service.service_members?.slice(0, 3).map((member: any) => (
                <Avatar key={member.user?.id || member.id} className="h-7 w-7 border-2 border-background">
                  <AvatarImage src={member.user?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {member.user?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            {service.service_members?.length > 3 && (
              <div className="ml-1 h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                +{service.service_members.length - 3}
              </div>
            )}
          </div>
          
          {/* Due Date or Budget */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {service.budget && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>${(service.budget / 1000).toFixed(0)}k</span>
              </div>
            )}
            {service.end_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(service.end_date)}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}