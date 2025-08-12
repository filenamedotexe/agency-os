import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { findClientByPhone } from '@/shared/lib/phone-utils'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const from = formData.get('From') as string
    const body = formData.get('Body') as string
    const to = formData.get('To') as string

    console.log('📱 SMS received:', { from, to, body: body?.substring(0, 50) })

    if (!from || !body) {
      console.error('❌ Missing required SMS fields')
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      )
    }

    // Use service role client to bypass RLS for webhook
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all clients with phone numbers using a different approach
    const { data: clientProfiles, error: clientsError } = await supabase
      .from('client_profiles')
      .select(`
        phone,
        profile:profiles(
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)
      .not('phone', 'is', null)
    
    if (clientsError || !clientProfiles) {
      console.error('❌ Error fetching client profiles:', clientsError)
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      )
    }
    
    // Transform to expected format
    interface Profile {
      id: string
      first_name: string
      last_name: string
      email: string
      role: string
    }
    
    const clients = clientProfiles
      .filter(cp => cp.profile && (cp.profile as unknown as Profile).role === 'client')
      .map(cp => ({
        id: (cp.profile as unknown as Profile).id,
        first_name: (cp.profile as unknown as Profile).first_name,
        last_name: (cp.profile as unknown as Profile).last_name,
        email: (cp.profile as unknown as Profile).email,
        client_profiles: [{ phone: cp.phone }]
      }))


    // Find client by phone number
    const client = findClientByPhone(from, clients)

    if (!client) {
      console.error('❌ No client found for phone:', from)
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      )
    }

    console.log('✅ Found client:', client.first_name, client.last_name)

    // Get or create conversation (webhook version)
    let conversation
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('*')
      .eq('client_id', client.id)
      .maybeSingle()

    if (existingConv) {
      conversation = existingConv
    } else {
      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          client_id: client.id
        })
        .select()
        .single()

      if (convError || !newConv) {
        console.error('❌ Error creating conversation:', convError)
        return new NextResponse(
          '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
          { headers: { 'Content-Type': 'text/xml' } }
        )
      }
      conversation = newConv
    }

    // Create message directly with service role
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: client.id, // SMS from client
        type: 'user',
        content: body,
        attachments: [],
        source_type: 'sms',
        source_metadata: {
          from: from,
          to: to,
          provider: 'twilio'
        }
      })
      .select()
      .single()

    // Update conversation metadata
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: body.substring(0, 100)
      })
      .eq('id', conversation.id)

    if (messageError) {
      console.error('❌ Error creating message:', messageError)
    } else {
      console.log('✅ SMS message created successfully')
    }

    // Return empty TwiML response
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    )

  } catch (error) {
    console.error('❌ SMS webhook error:', error)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }
}