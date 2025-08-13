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
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }
    
    if (!profile || !['admin', 'team_member'].includes(profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const collectionId = formData.get('collectionId') as string
    
    if (!file || !collectionId) {
      return NextResponse.json({ error: 'Missing file or collection' }, { status: 400 })
    }
    
    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB' }, { status: 400 })
    }
    
    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `${collectionId}/${timestamp}-${file.name}`
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('knowledge-hub')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('knowledge-hub')
      .getPublicUrl(fileName)
    
    // Determine resource type from mime type
    let resourceType: 'document' | 'video' | 'file' = 'file'
    if (file.type.startsWith('video/')) resourceType = 'video'
    else if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) resourceType = 'document'
    
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