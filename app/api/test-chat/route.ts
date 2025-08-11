import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Step 3.2: Test Chat Service API Endpoint
 * Simple endpoint to verify chat service database connectivity
 * Used by Playwright tests to validate the system
 */
export async function GET() {
  try {
    // Test database connectivity by checking chat tables
    // Use service role for API endpoint testing
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Test conversations table
    const { error: conversationsError } = await supabase
      .from('conversations')
      .select('count')
      .limit(1)
    
    if (conversationsError) {
      console.error('Conversations table error:', conversationsError)
      return NextResponse.json({ 
        success: false, 
        error: 'conversations_table_error',
        details: conversationsError.message 
      })
    }
    
    // Test messages table
    const { error: messagesError } = await supabase
      .from('messages')
      .select('count')
      .limit(1)
    
    if (messagesError) {
      console.error('Messages table error:', messagesError)
      return NextResponse.json({ 
        success: false, 
        error: 'messages_table_error',
        details: messagesError.message 
      })
    }
    
    // Test conversation_participants table
    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .select('count')
      .limit(1)
    
    if (participantsError) {
      console.error('Participants table error:', participantsError)
      return NextResponse.json({ 
        success: false, 
        error: 'participants_table_error',
        details: participantsError.message 
      })
    }
    
    // Test storage bucket access
    const { data: buckets, error: storageError } = await supabase
      .storage
      .listBuckets()
    
    if (storageError) {
      console.error('Storage error:', storageError)
      return NextResponse.json({ 
        success: false, 
        error: 'storage_error',
        details: storageError.message 
      })
    }
    
    const chatBucket = buckets?.find(b => b.name === 'chat-attachments')
    if (!chatBucket) {
      return NextResponse.json({ 
        success: false, 
        error: 'chat_bucket_missing',
        details: 'chat-attachments bucket not found' 
      })
    }
    
    // All tests passed
    return NextResponse.json({ 
      success: true,
      message: 'Chat service is fully operational',
      timestamp: new Date().toISOString(),
      tests: {
        conversations_table: 'ok',
        messages_table: 'ok',
        participants_table: 'ok',
        storage_bucket: 'ok',
        bucket_files: chatBucket.id
      }
    })
    
  } catch (error) {
    console.error('Chat service test failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'unexpected_error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { 
      status: 500 
    })
  }
}