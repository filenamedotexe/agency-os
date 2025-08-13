import { redirect } from 'next/navigation'
import { createClient } from '@/shared/lib/supabase/server'
import { getCollections } from '@/app/actions/knowledge'
import { KnowledgeHeader } from './components/knowledge-header'
import { CollectionGrid } from './components/collection-grid'
import { PageLayout, PageHeader, PageContent } from '@/shared/components/layout/page-layout'

export default async function KnowledgePage() {
  const supabase = await createClient()
  
  // Verify user has access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  // All authenticated users can access knowledge hub
  if (!profile) redirect('/login')
  
  const isAdmin = profile.role === 'admin' || profile.role === 'team_member'
  
  const { collections, error } = await getCollections()
  
  if (error) {
    return (
      <PageLayout>
        <PageContent>
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load collections: {error}</p>
          </div>
        </PageContent>
      </PageLayout>
    )
  }
  
  return (
    <PageLayout>
      <PageHeader
        title="Knowledge Hub"
        subtitle={isAdmin 
          ? "Manage and share resources with your clients"
          : "Resources and documentation"
        }
        description={`${collections?.length || 0} collections available`}
      />
      
      <PageContent>
        {isAdmin && <KnowledgeHeader />}
        <CollectionGrid 
          collections={collections || []} 
          isAdmin={isAdmin}
        />
      </PageContent>
    </PageLayout>
  )
}