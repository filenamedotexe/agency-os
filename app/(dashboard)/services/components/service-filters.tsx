"use client"

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Search, Filter, X } from 'lucide-react'

export function ServiceFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'recent')
  
  const updateURL = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value && value !== 'all' && value !== 'recent') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    const queryString = params.toString()
    router.push(queryString ? `?${queryString}` : '/services')
  }
  
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    updateURL('search', value)
  }
  
  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    updateURL('status', value)
  }
  
  const handleSortChange = (value: string) => {
    setSortBy(value)
    updateURL('sort', value)
  }
  
  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setSortBy('recent')
    router.push('/services')
  }
  
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || sortBy !== 'recent'
  
  return (
    <div className="space-y-4">
      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="planning">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                Planning
              </div>
            </SelectItem>
            <SelectItem value="active">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Active
              </div>
            </SelectItem>
            <SelectItem value="paused">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                Paused
              </div>
            </SelectItem>
            <SelectItem value="completed">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Completed
              </div>
            </SelectItem>
            <SelectItem value="cancelled">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Cancelled
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        
        {/* Sort By */}
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="progress">Progress</SelectItem>
            <SelectItem value="budget">Budget</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="icon"
            onClick={clearFilters}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchTerm && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSearch('')}
              className="h-6 px-2 text-xs"
            >
              Search: {searchTerm}
              <X className="ml-1 h-3 w-3" />
            </Button>
          )}
          {statusFilter !== 'all' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleStatusChange('all')}
              className="h-6 px-2 text-xs"
            >
              Status: {statusFilter}
              <X className="ml-1 h-3 w-3" />
            </Button>
          )}
          {sortBy !== 'recent' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSortChange('recent')}
              className="h-6 px-2 text-xs"
            >
              Sort: {sortBy}
              <X className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}