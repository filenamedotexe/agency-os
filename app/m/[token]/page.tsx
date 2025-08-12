import { redirect } from 'next/navigation'
import { createClient } from '@/shared/lib/supabase/server'

interface MagicLinkPageProps {
  params: Promise<{
    token: string
  }>
}

export default async function MagicLinkPage({ params }: MagicLinkPageProps) {
  const { token } = await params
  const supabase = await createClient()

  try {
    // Get magic link data
    const { data: linkData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', `magic_link_${token}`)
      .single()

    if (!linkData?.value) {
      redirect('/login?error=invalid_link')
    }

    const { conversationId, expiresAt } = linkData.value

    // Check expiration
    if (new Date(expiresAt) < new Date()) {
      redirect('/login?error=expired_link')
    }

    // Clean up the magic link (single use)
    await supabase
      .from('app_settings')
      .delete()
      .eq('key', `magic_link_${token}`)

    // Redirect to conversation
    redirect(`/messages?conversation=${conversationId}&highlight=true`)

  } catch (error) {
    console.error('Magic link error:', error)
    redirect('/login?error=invalid_link')
  }
}