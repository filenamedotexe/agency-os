import { getServices } from '@/app/actions/services'
import { ServicesList } from './components/services-list'
import { CreateServiceButton } from './components/create-service-button'
import { CreateServiceFromTemplate } from './components/create-service-from-template'
import { TemplateManagementButton } from './components/template-management-button'
import { ServiceFilters } from './components/service-filters'
import { createClient } from '@/shared/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ServicesPage() {
  // Check user role for access control
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  // Redirect clients to their dashboard
  if (profile?.role === 'client') {
    redirect('/client')
  }
  
  const result = await getServices()
  
  if ('error' in result) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-destructive/50 p-4 text-destructive">
          <p className="text-sm">Error loading services: {result.error}</p>
        </div>
      </div>
    )
  }
  
  const services = result.data || []
  
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Services</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your active projects and milestones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TemplateManagementButton />
          <CreateServiceFromTemplate />
          <CreateServiceButton />
        </div>
      </div>
      
      {/* Filters */}
      <ServiceFilters />
      
      {/* Services List - Responsive with Grid/Table/Mobile views */}
      <div className="mt-6">
        <ServicesList services={services} />
      </div>
      
      {/* Empty State */}
      {services.length === 0 && (
        <div className="text-center py-12 mt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <svg 
              className="w-8 h-8 text-muted-foreground" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <p className="text-muted-foreground mb-2">No services yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first service to get started
          </p>
        </div>
      )}
    </div>
  )
}