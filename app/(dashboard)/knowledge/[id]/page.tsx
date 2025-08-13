import { redirect } from 'next/navigation'
import { createClient } from '@/shared/lib/supabase/server'
import { getCollection } from '@/app/actions/knowledge'
import { ResourceList } from '../components/resource-list'
import { ResourceUpload } from '../components/resource-upload'
import { Button } from '@/shared/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PageLayout, PageHeader, PageContent } from '@/shared/components/layout/page-layout'

export default async function CollectionPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  
  // Verify user has access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile) redirect('/login')
  
  const isAdmin = profile.role === 'admin' || profile.role === 'team_member'
  
  const { collection, error } = await getCollection(id)
  
  if (error || !collection) {
    return (
      <PageLayout>
        <PageContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">
              {error || 'Collection not found'}
            </p>
            <Button asChild>
              <Link href="/knowledge">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Collections
              </Link>
            </Button>
          </div>
        </PageContent>
      </PageLayout>
    )
  }
  
  const resourceCount = collection.resources?.length || 0
  
  return (
    <PageLayout>
      <PageHeader
        title={collection.name}
        subtitle={collection.description}
        description={`${resourceCount} resource${resourceCount === 1 ? '' : 's'}`}
      />
      
      <PageContent>
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/knowledge">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          
          {isAdmin && <ResourceUpload collectionId={collection.id} />}
        </div>
        
        <ResourceList 
          resources={collection.resources || []} 
          collectionId={collection.id}
          isAdmin={isAdmin}
        />
      </PageContent>
    </PageLayout>
  )
}