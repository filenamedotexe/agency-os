# Knowledge Hub Implementation Plan
## AgencyOS Resource Management System

**Philosophy**: Simple, reliable, useful. No bells and whistles. Just a clean way for admins/team to share resources with clients.

**Core Concept**: Collections of resources. That's it. A collection holds resources. Resources can be files, videos, documents, or links.

---

## Phase 1: Database Foundation (2-3 hours)

### 1.1 Database Schema

```sql
-- Run these in Supabase SQL Editor in this exact order

-- Collections table (folders for resources)
CREATE TABLE collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'folder', -- lucide icon name
  color TEXT DEFAULT 'blue', -- theme color
  visibility TEXT DEFAULT 'clients' CHECK (visibility IN ('public', 'clients', 'team', 'admin')),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resources table (actual content items)
CREATE TABLE resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('document', 'video', 'link', 'file')),
  content_url TEXT NOT NULL, -- URL to file in storage or external link
  file_name TEXT, -- original filename if uploaded
  file_size INTEGER, -- in bytes
  mime_type TEXT, -- for proper rendering
  thumbnail_url TEXT, -- for previews
  duration_minutes INTEGER, -- for videos
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  downloads_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track user progress/access
CREATE TABLE resource_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  downloaded BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  UNIQUE(user_id, resource_id)
);

-- Collection access permissions (who can see what)
CREATE TABLE collection_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  can_view BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  UNIQUE(collection_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_collections_visibility ON collections(visibility);
CREATE INDEX idx_resources_collection ON resources(collection_id);
CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resource_access_user ON resource_access(user_id);
CREATE INDEX idx_collection_permissions_user ON collection_permissions(user_id);
```

### 1.2 Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_permissions ENABLE ROW LEVEL SECURITY;

-- Collections policies
CREATE POLICY "Admins and team can manage collections" ON collections
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'team_member')
    )
  );

CREATE POLICY "Clients can view allowed collections" ON collections
  FOR SELECT USING (
    visibility = 'public' OR
    visibility = 'clients' AND auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'client'
    ) OR
    auth.uid() IN (
      SELECT user_id FROM collection_permissions 
      WHERE collection_id = collections.id AND can_view = true
    )
  );

-- Resources policies
CREATE POLICY "Admins and team can manage resources" ON resources
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'team_member')
    )
  );

CREATE POLICY "Users can view resources in allowed collections" ON resources
  FOR SELECT USING (
    collection_id IN (
      SELECT id FROM collections WHERE
      visibility = 'public' OR
      visibility = 'clients' AND auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'client'
      ) OR
      auth.uid() IN (
        SELECT user_id FROM collection_permissions 
        WHERE collection_id = collections.id AND can_view = true
      )
    )
  );

-- Resource access policies
CREATE POLICY "Users can track their own access" ON resource_access
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all access" ON resource_access
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );
```

### 1.3 Storage Bucket Setup

```sql
-- Run in Supabase Dashboard > Storage
-- Create a new bucket called 'knowledge-hub'
-- Set it to PUBLIC (we'll use signed URLs for security)

INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-hub', 'knowledge-hub', false);
```

### ✅ CHECKPOINT 1.1: Database Verification
```javascript
// Test script: scripts/test-knowledge-db.js
const { createClient } = require('@supabase/supabase-js');

async function testDatabase() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Test tables exist
  const tables = ['collections', 'resources', 'resource_access', 'collection_permissions'];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.error(`❌ Table ${table} not accessible:`, error.message);
      return false;
    }
    console.log(`✅ Table ${table} is ready`);
  }
  
  // Test storage bucket
  const { data: buckets } = await supabase.storage.listBuckets();
  const knowledgeHub = buckets?.find(b => b.name === 'knowledge-hub');
  if (!knowledgeHub) {
    console.error('❌ Storage bucket knowledge-hub not found');
    return false;
  }
  console.log('✅ Storage bucket ready');
  
  return true;
}

testDatabase();
```

**Expected Output**: All tables accessible, storage bucket exists
**If fails**: Check SQL execution order, check RLS policies

---

## Phase 2: Backend API Routes (3-4 hours)

### 2.1 Server Actions Setup

Create: `app/actions/knowledge.ts`

```typescript
"use server"

import { createClient } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Get all collections user can access
export async function getCollections() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  // Build query based on role
  let query = supabase
    .from('collections')
    .select(`
      *,
      resources (count),
      _count: resources (count)
    `)
    .eq('is_active', true)
    .order('order_index', { ascending: true })
  
  // Filter by visibility based on role
  if (profile?.role === 'client') {
    query = query.in('visibility', ['public', 'clients'])
  }
  
  const { data: collections, error } = await query
  
  if (error) return { error: error.message }
  
  return { collections }
}

// Get single collection with resources
export async function getCollection(collectionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  const { data: collection, error } = await supabase
    .from('collections')
    .select(`
      *,
      resources (
        *,
        access: resource_access!inner (
          completed,
          downloaded
        )
      )
    `)
    .eq('id', collectionId)
    .eq('is_active', true)
    .single()
  
  if (error) return { error: error.message }
  
  // Sort resources by order_index
  if (collection?.resources) {
    collection.resources.sort((a: any, b: any) => a.order_index - b.order_index)
  }
  
  return { collection }
}

// Create collection (admin/team only)
export async function createCollection(data: {
  name: string
  description?: string
  icon?: string
  color?: string
  visibility?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  // Check if admin/team
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['admin', 'team_member'].includes(profile.role)) {
    return { error: 'Unauthorized' }
  }
  
  const { data: collection, error } = await supabase
    .from('collections')
    .insert({
      ...data,
      created_by: user.id
    })
    .select()
    .single()
  
  if (error) return { error: error.message }
  
  revalidatePath('/knowledge')
  return { collection }
}

// Create resource
export async function createResource(data: {
  collection_id: string
  title: string
  description?: string
  type: 'document' | 'video' | 'link' | 'file'
  content_url: string
  file_name?: string
  file_size?: number
  mime_type?: string
  thumbnail_url?: string
  duration_minutes?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  // Check if admin/team
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['admin', 'team_member'].includes(profile.role)) {
    return { error: 'Unauthorized' }
  }
  
  // Get next order_index
  const { data: lastResource } = await supabase
    .from('resources')
    .select('order_index')
    .eq('collection_id', data.collection_id)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()
  
  const order_index = (lastResource?.order_index ?? -1) + 1
  
  const { data: resource, error } = await supabase
    .from('resources')
    .insert({
      ...data,
      order_index,
      created_by: user.id
    })
    .select()
    .single()
  
  if (error) return { error: error.message }
  
  revalidatePath(`/knowledge/${data.collection_id}`)
  return { resource }
}

// Track resource access
export async function trackResourceAccess(
  resourceId: string, 
  action: 'view' | 'download' | 'complete'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  // Get resource details
  const { data: resource } = await supabase
    .from('resources')
    .select('collection_id')
    .eq('id', resourceId)
    .single()
  
  if (!resource) return { error: 'Resource not found' }
  
  // Upsert access record
  const accessData: any = {
    user_id: user.id,
    resource_id: resourceId,
    collection_id: resource.collection_id,
    accessed_at: new Date().toISOString()
  }
  
  if (action === 'download') accessData.downloaded = true
  if (action === 'complete') accessData.completed = true
  
  const { error: accessError } = await supabase
    .from('resource_access')
    .upsert(accessData, {
      onConflict: 'user_id,resource_id'
    })
  
  if (accessError) return { error: accessError.message }
  
  // Update resource counts
  const updateField = action === 'download' ? 'downloads_count' : 'views_count'
  
  await supabase.rpc('increment', {
    table_name: 'resources',
    column_name: updateField,
    row_id: resourceId
  })
  
  return { success: true }
}

// Delete collection
export async function deleteCollection(collectionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  // Soft delete
  const { error } = await supabase
    .from('collections')
    .update({ is_active: false })
    .eq('id', collectionId)
  
  if (error) return { error: error.message }
  
  revalidatePath('/knowledge')
  return { success: true }
}

// Delete resource
export async function deleteResource(resourceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  // Get resource to find collection
  const { data: resource } = await supabase
    .from('resources')
    .select('collection_id, content_url')
    .eq('id', resourceId)
    .single()
  
  if (!resource) return { error: 'Resource not found' }
  
  // Delete from storage if it's an uploaded file
  if (resource.content_url?.includes('knowledge-hub')) {
    const path = resource.content_url.split('/').pop()
    if (path) {
      await supabase.storage
        .from('knowledge-hub')
        .remove([path])
    }
  }
  
  // Soft delete resource
  const { error } = await supabase
    .from('resources')
    .update({ is_active: false })
    .eq('id', resourceId)
  
  if (error) return { error: error.message }
  
  revalidatePath(`/knowledge/${resource.collection_id}`)
  return { success: true }
}

// Reorder resources
export async function reorderResources(
  collectionId: string,
  resourceIds: string[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  // Update order_index for each resource
  const updates = resourceIds.map((id, index) => 
    supabase
      .from('resources')
      .update({ order_index: index })
      .eq('id', id)
  )
  
  await Promise.all(updates)
  
  revalidatePath(`/knowledge/${collectionId}`)
  return { success: true }
}
```

### 2.2 File Upload Handler

Create: `app/api/knowledge/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if admin/team
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || !['admin', 'team_member'].includes(profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const collectionId = formData.get('collectionId') as string
    
    if (!file || !collectionId) {
      return NextResponse.json({ error: 'Missing file or collection' }, { status: 400 })
    }
    
    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `${collectionId}/${timestamp}-${file.name}`
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('knowledge-hub')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })
    
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('knowledge-hub')
      .getPublicUrl(fileName)
    
    // Determine resource type from mime type
    let resourceType: 'document' | 'video' | 'file' = 'file'
    if (file.type.startsWith('video/')) resourceType = 'video'
    else if (file.type.includes('pdf') || file.type.includes('document')) resourceType = 'document'
    
    return NextResponse.json({
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      resourceType
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}

// Get signed URL for private files
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  
  if (!path) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 })
  }
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Generate signed URL (1 hour expiry)
  const { data, error } = await supabase.storage
    .from('knowledge-hub')
    .createSignedUrl(path, 3600)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ url: data.signedUrl })
}
```

### ✅ CHECKPOINT 2.1: Backend API Testing
```javascript
// Test script: scripts/test-knowledge-api.js
async function testKnowledgeAPI() {
  // Test creating a collection
  const testCollection = {
    name: 'Test Resources',
    description: 'Testing the API',
    visibility: 'clients'
  };
  
  const { collection, error } = await createCollection(testCollection);
  
  if (error) {
    console.error('❌ Failed to create collection:', error);
    return false;
  }
  
  console.log('✅ Collection created:', collection.id);
  
  // Test creating a resource
  const testResource = {
    collection_id: collection.id,
    title: 'Test Document',
    type: 'link',
    content_url: 'https://example.com/doc.pdf'
  };
  
  const { resource, error: resourceError } = await createResource(testResource);
  
  if (resourceError) {
    console.error('❌ Failed to create resource:', resourceError);
    return false;
  }
  
  console.log('✅ Resource created:', resource.id);
  
  // Clean up
  await deleteResource(resource.id);
  await deleteCollection(collection.id);
  
  console.log('✅ Cleanup complete');
  return true;
}
```

**Expected**: Collection and resource created successfully
**If fails**: Check server actions, check RLS policies

---

## Phase 3: Frontend Components - Admin Side (4-5 hours)

### 3.1 Main Knowledge Page

Create: `app/(dashboard)/knowledge/page.tsx`

```typescript
import { getCollections } from '@/app/actions/knowledge'
import { KnowledgeHeader } from './components/knowledge-header'
import { CollectionGrid } from './components/collection-grid'
import { PageLayout, PageHeader, PageContent } from '@/shared/components/layout/page-layout'

export default async function KnowledgePage() {
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
        subtitle="Manage and share resources with your clients"
      />
      
      <PageContent>
        <KnowledgeHeader />
        <CollectionGrid collections={collections || []} />
      </PageContent>
    </PageLayout>
  )
}
```

### 3.2 Collection Grid Component

Create: `app/(dashboard)/knowledge/components/collection-grid.tsx`

```typescript
"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/shared/components/ui/dropdown-menu'
import { 
  Folder, 
  FileText, 
  Video, 
  Link as LinkIcon,
  MoreVertical,
  Edit,
  Trash,
  Eye
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { deleteCollection } from '@/app/actions/knowledge'
import { useToast } from '@/shared/hooks/use-toast'
import { useRouter } from 'next/navigation'

const iconMap: Record<string, any> = {
  folder: Folder,
  file: FileText,
  video: Video,
  link: LinkIcon
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  red: 'bg-red-100 text-red-700'
}

interface CollectionGridProps {
  collections: any[]
  isAdmin?: boolean
}

export function CollectionGrid({ collections, isAdmin = false }: CollectionGridProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return
    
    setDeleting(id)
    const { error } = await deleteCollection(id)
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: "Collection deleted"
      })
      router.refresh()
    }
    setDeleting(null)
  }
  
  if (collections.length === 0) {
    return (
      <div className="text-center py-12">
        <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No collections yet</h3>
        <p className="text-muted-foreground">
          Create your first collection to start organizing resources
        </p>
      </div>
    )
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {collections.map((collection) => {
        const Icon = iconMap[collection.icon] || Folder
        const resourceCount = collection.resources?.[0]?.count || 0
        
        return (
          <Card key={collection.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-lg",
                    colorMap[collection.color] || colorMap.blue
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="line-clamp-1">
                      <Link 
                        href={`/knowledge/${collection.id}`}
                        className="hover:underline"
                      >
                        {collection.name}
                      </Link>
                    </CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {resourceCount} {resourceCount === 1 ? 'item' : 'items'}
                    </Badge>
                  </div>
                </div>
                
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/knowledge/${collection.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/knowledge/${collection.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(collection.id)}
                        disabled={deleting === collection.id}
                        className="text-destructive"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            
            {collection.description && (
              <CardContent>
                <CardDescription className="line-clamp-2">
                  {collection.description}
                </CardDescription>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
```

### 3.3 Collection Detail Page

Create: `app/(dashboard)/knowledge/[id]/page.tsx`

```typescript
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
  params: { id: string }
}) {
  const { collection, error } = await getCollection(params.id)
  
  if (error || !collection) {
    return (
      <PageLayout>
        <PageContent>
          <div className="text-center py-8">
            <p className="text-destructive">Collection not found</p>
            <Button asChild className="mt-4">
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
  
  return (
    <PageLayout>
      <PageHeader
        title={collection.name}
        subtitle={collection.description}
      />
      
      <PageContent>
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/knowledge">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Collections
            </Link>
          </Button>
          
          <ResourceUpload collectionId={collection.id} />
        </div>
        
        <ResourceList 
          resources={collection.resources || []} 
          collectionId={collection.id}
        />
      </PageContent>
    </PageLayout>
  )
}
```

### 3.4 Resource List Component

Create: `app/(dashboard)/knowledge/components/resource-list.tsx`

```typescript
"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import {
  FileText,
  Video,
  Link as LinkIcon,
  File,
  Download,
  Eye,
  Trash,
  GripVertical,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { deleteResource, trackResourceAccess, reorderResources } from '@/app/actions/knowledge'
import { useToast } from '@/shared/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { formatBytes } from '@/shared/lib/helpers'

const typeIcons: Record<string, any> = {
  document: FileText,
  video: Video,
  link: LinkIcon,
  file: File
}

const typeColors: Record<string, string> = {
  document: 'bg-blue-100 text-blue-700',
  video: 'bg-purple-100 text-purple-700',
  link: 'bg-green-100 text-green-700',
  file: 'bg-gray-100 text-gray-700'
}

interface ResourceListProps {
  resources: any[]
  collectionId: string
  isAdmin?: boolean
}

export function ResourceList({ resources, collectionId, isAdmin = false }: ResourceListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  
  const handleView = async (resource: any) => {
    // Track view
    await trackResourceAccess(resource.id, 'view')
    
    // Open resource
    if (resource.type === 'link') {
      window.open(resource.content_url, '_blank')
    } else {
      // For files, open in new tab or download
      window.open(resource.content_url, '_blank')
    }
  }
  
  const handleDownload = async (resource: any) => {
    // Track download
    await trackResourceAccess(resource.id, 'download')
    
    // Trigger download
    const link = document.createElement('a')
    link.href = resource.content_url
    link.download = resource.file_name || resource.title
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return
    
    setDeleting(id)
    const { error } = await deleteResource(id)
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: "Resource deleted"
      })
      router.refresh()
    }
    setDeleting(null)
  }
  
  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <File className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No resources yet</h3>
        <p className="text-muted-foreground">
          Upload your first resource to this collection
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      {resources.map((resource) => {
        const Icon = typeIcons[resource.type] || File
        
        return (
          <Card key={resource.id} className="group">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <button className="cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </button>
                )}
                
                <div className={cn(
                  "p-2 rounded-lg flex-shrink-0",
                  typeColors[resource.type] || typeColors.file
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">{resource.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {resource.type}
                    </Badge>
                  </div>
                  
                  {resource.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                      {resource.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {resource.file_size && (
                      <span>{formatBytes(resource.file_size)}</span>
                    )}
                    {resource.duration_minutes && (
                      <span>{resource.duration_minutes} min</span>
                    )}
                    {resource.views_count > 0 && (
                      <span>{resource.views_count} views</span>
                    )}
                    {resource.downloads_count > 0 && (
                      <span>{resource.downloads_count} downloads</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleView(resource)}
                  >
                    {resource.type === 'link' ? (
                      <ExternalLink className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  
                  {resource.type !== 'link' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(resource)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(resource.id)}
                      disabled={deleting === resource.id}
                      className="text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
```

### ✅ CHECKPOINT 3.1: Frontend Components Testing
```javascript
// Manual test checklist:
// 1. Navigate to /knowledge
// 2. Should see empty state or existing collections
// 3. Create a test collection (if admin)
// 4. Click on collection to view details
// 5. Should see empty resource list
// 6. All navigation should work
// 7. Delete buttons should have confirmation
// 8. Responsive on mobile/tablet/desktop

// Browser console test:
console.log('Collections loaded:', document.querySelectorAll('[data-testid="collection-card"]').length);
console.log('Resource list rendered:', document.querySelector('[data-testid="resource-list"]'));
```

**Expected**: Clean UI, navigation works, responsive design
**If fails**: Check component imports, check server actions

---

## Phase 4: Enhanced File Management System (4-5 hours) - SIMPLIFIED

**SIMPLIFIED SCOPE**: Focus on core functionality only - NO enterprise features

### Removed from Phase 4:
- ❌ File version management  
- ❌ Advanced file sharing/permissions
- ❌ Bulk operations
- ❌ File compression/optimization
- ❌ Complex metadata and tagging

### Core Features Only:
- ✅ Enhanced drag-and-drop upload with progress
- ✅ File type detection and categorization  
- ✅ Basic file preview (images/documents)
- ✅ Simple folder organization
- ✅ Basic file operations (upload, delete, move)
- ✅ Search and filter by name/type

### 4.1 Enhanced Upload Component

Create: `app/(dashboard)/knowledge/components/resource-upload.tsx`

```typescript
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
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
import { Upload, Plus, Loader2, Link, FileText, Video, File } from 'lucide-react'
import { useToast } from '@/shared/hooks/use-toast'
import { createResource } from '@/app/actions/knowledge'
import { cn } from '@/shared/lib/utils'

interface ResourceUploadProps {
  collectionId: string
}

export function ResourceUpload({ collectionId }: ResourceUploadProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadType, setUploadType] = useState<'file' | 'link'>('file')
  const [dragActive, setDragActive] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  
  // Form data
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }
  
  const handleFile = (file: File) => {
    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file under 50MB",
        variant: "destructive"
      })
      return
    }
    
    setFile(file)
    if (!title) {
      // Auto-fill title from filename
      setTitle(file.name.replace(/\.[^/.]+$/, ""))
    }
  }
  
  const handleSubmit = async () => {
    if (!title) {
      toast({
        title: "Error",
        description: "Please enter a title",
        variant: "destructive"
      })
      return
    }
    
    if (uploadType === 'link' && !url) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive"
      })
      return
    }
    
    if (uploadType === 'file' && !file) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive"
      })
      return
    }
    
    setLoading(true)
    
    try {
      let resourceData: any = {
        collection_id: collectionId,
        title,
        description
      }
      
      if (uploadType === 'link') {
        // External link
        resourceData.type = 'link'
        resourceData.content_url = url
      } else {
        // Upload file
        const formData = new FormData()
        formData.append('file', file!)
        formData.append('collectionId', collectionId)
        
        const response = await fetch('/api/knowledge/upload', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          throw new Error('Upload failed')
        }
        
        const uploadResult = await response.json()
        
        resourceData.type = uploadResult.resourceType
        resourceData.content_url = uploadResult.url
        resourceData.file_name = uploadResult.fileName
        resourceData.file_size = uploadResult.fileSize
        resourceData.mime_type = uploadResult.mimeType
      }
      
      // Create resource record
      const { error } = await createResource(resourceData)
      
      if (error) {
        throw new Error(error)
      }
      
      toast({
        title: "Success",
        description: "Resource added successfully"
      })
      
      // Reset form
      setTitle('')
      setDescription('')
      setUrl('')
      setFile(null)
      setOpen(false)
      
      // Refresh page
      router.refresh()
      
    } catch (error: any) {
      console.error('Upload error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to add resource",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
          <DialogDescription>
            Upload a file or add a link to external content
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Upload type selector */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={uploadType === 'file' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setUploadType('file')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
            <Button
              type="button"
              variant={uploadType === 'link' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setUploadType('link')}
            >
              <Link className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </div>
          
          {/* File upload area */}
          {uploadType === 'file' && (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                file && "bg-muted"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.mp4,.mov,.avi,.png,.jpg,.jpeg,.gif"
              />
              
              {file ? (
                <div className="space-y-2">
                  <File className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Drop file here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Maximum file size: 50MB
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* URL input */}
          {uploadType === 'link' && (
            <div className="grid gap-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/resource"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          )}
          
          {/* Title input */}
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Resource title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          {/* Description input */}
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
            Add Resource
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### ✅ CHECKPOINT 4.1: Upload Testing
```javascript
// Test checklist:
// 1. Click "Add Resource" button
// 2. Try uploading a small file (<5MB)
// 3. Try adding an external link
// 4. Verify file appears in Supabase Storage
// 5. Verify resource appears in list
// 6. Test drag and drop
// 7. Test file size limit (>50MB should fail)
// 8. Test auto-title from filename

// Check storage:
// Go to Supabase Dashboard > Storage > knowledge-hub bucket
// Should see uploaded files organized by collection ID
```

**Expected**: Files upload successfully, appear in list
**If fails**: Check storage bucket permissions, check API route

---

## Phase 5: Client-Side Experience (2-3 hours)

### 5.1 Client View Adjustments

Update the existing components to handle client vs admin views:

```typescript
// In app/(dashboard)/knowledge/page.tsx, add role detection:

import { createClient } from '@/shared/lib/supabase/server'

export default async function KnowledgePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()
  
  const isAdmin = profile?.role === 'admin' || profile?.role === 'team_member'
  
  const { collections, error } = await getCollections()
  
  // ... rest of component
  
  return (
    <PageLayout>
      <PageHeader
        title="Knowledge Hub"
        subtitle={isAdmin 
          ? "Manage and share resources with your clients"
          : "Resources and documentation"
        }
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
```

### 5.2 Add to Navigation

Update: `shared/components/layout/app-sidebar.tsx`

Add to navigation array:
```typescript
{
  title: "Knowledge Hub",
  url: "/knowledge",
  icon: BookOpen, // import from lucide-react
  roles: ["admin", "team_member", "client"]
}
```

---

## Phase 6: Testing & Validation (2 hours)

### 6.1 Comprehensive Test Script

Create: `scripts/test-knowledge-hub-complete.js`

```javascript
#!/usr/bin/env node

const { chromium } = require('playwright');

console.log('🧪 Knowledge Hub Complete Test');
console.log('==============================\n');

const TEST_URL = 'http://localhost:3000';
const ADMIN_USER = { email: 'admin@demo.com', password: 'password123' };
const CLIENT_USER = { email: 'sarah@acmecorp.com', password: 'password123' };

async function testKnowledgeHub() {
  const browser = await chromium.launch({ headless: false });
  
  try {
    // Test 1: Admin can create collection
    console.log('📚 Test 1: Admin Collection Management');
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    await adminPage.goto(`${TEST_URL}/login`);
    await adminPage.fill('[name="email"]', ADMIN_USER.email);
    await adminPage.fill('[name="password"]', ADMIN_USER.password);
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL('**/admin**');
    
    await adminPage.goto(`${TEST_URL}/knowledge`);
    await adminPage.waitForTimeout(2000);
    
    const hasKnowledgePage = await adminPage.locator('text=Knowledge Hub').count() > 0;
    console.log(`  ✅ Knowledge Hub page loaded: ${hasKnowledgePage}`);
    
    // Test 2: Client can view collections
    console.log('\n📚 Test 2: Client Access');
    const clientContext = await browser.newContext();
    const clientPage = await clientContext.newPage();
    
    await clientPage.goto(`${TEST_URL}/login`);
    await clientPage.fill('[name="email"]', CLIENT_USER.email);
    await clientPage.fill('[name="password"]', CLIENT_USER.password);
    await clientPage.click('button[type="submit"]');
    await clientPage.waitForURL('**/client**');
    
    await clientPage.goto(`${TEST_URL}/knowledge`);
    await clientPage.waitForTimeout(2000);
    
    const clientCanView = await clientPage.locator('text=Knowledge Hub').count() > 0;
    console.log(`  ✅ Client can view Knowledge Hub: ${clientCanView}`);
    
    // Test 3: Upload functionality
    console.log('\n📚 Test 3: Resource Upload');
    
    // Admin creates test collection
    const addButton = await adminPage.locator('button:has-text("Add")').count();
    console.log(`  ✅ Add button visible for admin: ${addButton > 0}`);
    
    // Test 4: Permission check
    console.log('\n📚 Test 4: Permissions');
    
    const clientAddButton = await clientPage.locator('button:has-text("Add")').count();
    console.log(`  ✅ Add button hidden for client: ${clientAddButton === 0}`);
    
    // Take screenshots
    await adminPage.screenshot({ path: 'test-knowledge-admin.png', fullPage: true });
    await clientPage.screenshot({ path: 'test-knowledge-client.png', fullPage: true });
    
    console.log('\n✅ All tests completed');
    console.log('📸 Screenshots saved');
    
    await adminContext.close();
    await clientContext.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  await browser.close();
}

testKnowledgeHub().catch(console.error);
```

### 6.2 Manual Testing Checklist

```markdown
## Knowledge Hub Testing Checklist

### Admin/Team Tests
- [ ] Navigate to /knowledge
- [ ] Create new collection
- [ ] Edit collection details
- [ ] Upload file resource
- [ ] Add link resource
- [ ] View resource
- [ ] Download resource
- [ ] Delete resource
- [ ] Delete collection
- [ ] Reorder resources (drag and drop)

### Client Tests
- [ ] Navigate to /knowledge
- [ ] View available collections
- [ ] Open collection
- [ ] View resources
- [ ] Download allowed resources
- [ ] Cannot see edit/delete buttons
- [ ] Cannot see admin-only collections

### File Upload Tests
- [ ] Upload PDF (<50MB)
- [ ] Upload video file
- [ ] Upload image
- [ ] Drag and drop works
- [ ] File size limit enforced
- [ ] Progress indication
- [ ] Error handling

### Performance Tests
- [ ] Page loads quickly
- [ ] Resources load quickly
- [ ] Search/filter responsive
- [ ] Mobile responsive
- [ ] Tablet responsive

### Data Integrity Tests
- [ ] View counts increment
- [ ] Download counts increment
- [ ] Soft delete works
- [ ] RLS policies enforced
```

---

## Phase 7: Optimization & Polish (1-2 hours)

### 7.1 Add Loading States

Create reusable loading component for consistency.

### 7.2 Add Empty States

Improve UX with helpful empty states and CTAs.

### 7.3 Add Search/Filter

Simple text search for resources within collections.

### 7.4 Add Breadcrumbs

Better navigation context for deep linking.

---

## Rollback Plan

If any phase fails critically:

1. **Database Rollback**
   ```sql
   -- Drop all knowledge tables
   DROP TABLE IF EXISTS resource_access CASCADE;
   DROP TABLE IF EXISTS collection_permissions CASCADE;
   DROP TABLE IF EXISTS resources CASCADE;
   DROP TABLE IF EXISTS collections CASCADE;
   ```

2. **Storage Cleanup**
   - Delete knowledge-hub bucket in Supabase

3. **Code Rollback**
   - Git revert to previous commit
   - Remove /knowledge routes

---

## Success Metrics

- [ ] Collections CRUD working
- [ ] Resources CRUD working
- [ ] File upload < 50MB working
- [ ] Client access control working
- [ ] Download tracking working
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Page load < 2 seconds
- [ ] All test scripts passing

---

## Notes for Implementation

1. **Start small** - Get basic CRUD working first
2. **Test after each section** - Don't accumulate errors
3. **Use existing patterns** - Copy from messages/chat features
4. **Keep it simple** - No fancy features in v1
5. **Security first** - RLS policies are critical
6. **Mobile matters** - Test responsive at each step

This implementation will give us a solid, simple Knowledge Hub that matches the reliability and simplicity of our SMS/email features. No AI, no gamification, just a clean resource management system.