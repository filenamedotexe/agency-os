import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'
import twilio from 'twilio'

export async function POST(request: NextRequest) {
  try {
    const { account_sid, auth_token } = await request.json()
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Test Twilio connection
    const client = twilio(account_sid, auth_token)
    
    // Try to fetch account info to test credentials
    await client.api.accounts(account_sid).fetch()
    
    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    console.error('Twilio test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message || 'Failed to connect to Twilio'
    }, { status: 400 })
  }
}