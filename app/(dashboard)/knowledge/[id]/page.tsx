import { redirect } from 'next/navigation'
import { createClient } from '@/shared/lib/supabase/server'
import { getCollection } from '@/app/actions/knowledge'
import { KnowledgeCollectionClient } from '../components/knowledge-collection-client'
import { Button } from '@/shared/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PageLayout, PageContent } from '@/shared/components/layout/page-layout'

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
  
  // const resourceCount = collection.resources?.length || 0
  
  return (
    <PageLayout>
      <PageContent>
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/knowledge">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Knowledge Hub
            </Link>
          </Button>
        </div>
        
        <KnowledgeCollectionClient
          collection={collection}
          isAdmin={isAdmin}
          userRole={profile.role as 'admin' | 'team_member' | 'client'}
        />
      </PageContent>
    </PageLayout>
  )
}