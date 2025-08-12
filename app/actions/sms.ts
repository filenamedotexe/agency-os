"use server"

import { createClient } from '@/shared/lib/supabase/server'
import twilio from 'twilio'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || 'your-secret-key-here-change-this-32ch'
const ALGORITHM = 'aes-256-cbc'

function decrypt(text: string): string {
  const parts = text.split(':')
  const iv = Buffer.from(parts.shift()!, 'hex')
  const encryptedText = parts.join(':')
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY.substring(0, 32), iv)
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

export async function sendSmsMessage({
  conversationId,
  content,
  recipientPhone
}: {
  conversationId: string
  content: string
  recipientPhone: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }

  try {
    // Get SMS settings from admin user
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .single()

    if (!adminProfile) {
      return { error: 'No admin user found for SMS configuration' }
    }

    const { data: settings } = await supabase
      .from('app_settings')
      .select('key, value')
      .eq('user_id', adminProfile.id)
      .in('key', ['sms_phone_number', 'sms_account_sid', 'sms_auth_token'])

    if (!settings || settings.length < 3) {
      return { error: 'SMS not configured. Please configure SMS settings first.' }
    }

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    const twilioPhone = settingsMap.sms_phone_number
    const accountSid = settingsMap.sms_account_sid
    const authToken = decrypt(settingsMap.sms_auth_token)

    if (!twilioPhone || !accountSid || !authToken) {
      return { error: 'SMS configuration incomplete' }
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken)

    // Handle message length
    let messageBody = content
    let magicLink = null

    if (content.length > 140) {
      // Generate magic link for full message
      const token = crypto.randomBytes(16).toString('hex')
      
      // Store magic link token
      await supabase
        .from('app_settings')
        .upsert({
          user_id: user.id,
          key: `magic_link_${token}`,
          value: {
            conversationId,
            messageContent: content,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
          }
        })

      magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/m/${token}`
      messageBody = content.substring(0, 120) + '... See full message: ' + magicLink
    }

    // Send SMS
    const message = await client.messages.create({
      body: messageBody,
      from: twilioPhone,
      to: recipientPhone
    })

    return { 
      success: true, 
      messageSid: message.sid,
      truncated: !!magicLink,
      magicLink 
    }

  } catch (error: unknown) {
    console.error('SMS sending error:', error)
    return { error: (error as Error).message || 'Failed to send SMS' }
  }
}