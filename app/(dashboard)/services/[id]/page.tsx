import { getService } from '@/app/actions/services'
import { ServiceHeader } from '../components/service-header'
import { ServiceDetailContent } from '../components/service-detail-content'
import { ClientTimeline } from '../components/client-timeline'
import { createClient } from '@/shared/lib/supabase/server'

export default async function ServiceDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Await params as required in Next.js 15
  const { id } = await params
  
  // Get service details
  const result = await getService(id)
  
  if ('error' in result) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-destructive/50 p-4 text-destructive">
          <p className="text-sm">Error loading service: {result.error}</p>
        </div>
      </div>
    )
  }
  
  const service = result.data
  
  if (!service) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Service Not Found</h2>
          <p className="text-muted-foreground">The service you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        </div>
      </div>
    )
  }
  
  // Get user role to determine which view to show
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user?.id)
    .single()
  
  const isClient = profile?.role === 'client'
  
  // For clients, show timeline view
  if (isClient) {
    return (
      <div className="min-h-screen bg-background">
        {/* Service Header */}
        <ServiceHeader service={service} isClient={true} />
        
        {/* Client Timeline View */}
        <ClientTimeline service={service} userId={profile?.id} />
      </div>
    )
  }
  
  // For admin/team, show kanban view
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Service Header */}
      <ServiceHeader service={service} isClient={false} />
      
      {/* Split Panel Layout - Desktop */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <ServiceDetailContent 
          milestones={service.milestones || []}
          serviceId={service.id}
          isDesktop={true}
        />
      </div>
      
      {/* Mobile/Tablet Layout */}
      <div className="flex lg:hidden flex-1 overflow-hidden">
        <ServiceDetailContent 
          milestones={service.milestones || []}
          serviceId={service.id}
          showMilestoneTabs={true}
          isDesktop={false}
        />
      </div>
    </div>
  )
}