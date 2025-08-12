import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || 'your-secret-key-here-change-this-32ch'
const ALGORITHM = 'aes-256-cbc'

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY.substring(0, 32), iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

function decrypt(text: string): string {
  const parts = text.split(':')
  const iv = Buffer.from(parts.shift()!, 'hex')
  const encryptedText = parts.join(':')
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY.substring(0, 32), iv)
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

export async function GET() {
  try {
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

    // Get SMS settings
    const { data: settings } = await supabase
      .from('app_settings')
      .select('key, value')
      .eq('user_id', user.id)
      .in('key', ['sms_phone_number', 'sms_account_sid', 'sms_auth_token'])

    const settingsMap = settings?.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>) || {}

    // Decrypt auth token if present
    let authToken = ''
    if (settingsMap.sms_auth_token) {
      try {
        authToken = decrypt(settingsMap.sms_auth_token)
      } catch (error) {
        console.error('Error decrypting auth token:', error)
      }
    }

    return NextResponse.json({
      settings: {
        phone_number: settingsMap.sms_phone_number || '',
        account_sid: settingsMap.sms_account_sid || '',
        auth_token: authToken
      }
    })

  } catch (error) {
    console.error('Error fetching SMS settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phone_number, account_sid, auth_token } = await request.json()
    
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

    // Save settings
    const settings = [
      { key: 'sms_phone_number', value: phone_number },
      { key: 'sms_account_sid', value: account_sid },
      { key: 'sms_auth_token', value: encrypt(auth_token) }
    ]

    for (const setting of settings) {
      await supabase
        .from('app_settings')
        .upsert({
          user_id: user.id,
          key: setting.key,
          value: setting.value
        }, {
          onConflict: 'user_id,key'
        })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error saving SMS settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}