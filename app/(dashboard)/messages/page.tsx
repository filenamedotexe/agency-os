import { redirect } from 'next/navigation'
import { createClient } from '@/shared/lib/supabase/server'
import { MessagesInbox } from '@/features/chat/components/messages-inbox'

export default async function MessagesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()
  
  // Only admin and team can access
  if (profile?.role === 'client') {
    redirect('/dashboard')
  }
  
  return (
    <div className="h-[calc(100vh-4rem)]">
      <MessagesInbox userId={user.id} />
    </div>
  )
}