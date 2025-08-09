import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ROUTES, ROLE_REDIRECTS } from "@/lib/constants"
import { UserRole } from "@/types"

export default async function DashboardRedirect() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect(ROUTES.LOGIN)
  }

  // Get user profile to determine role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  // Redirect based on role
  const role = profile?.role as UserRole
  if (role && ROLE_REDIRECTS[role]) {
    redirect(ROLE_REDIRECTS[role])
  } else {
    // Default fallback
    redirect(ROUTES.HOME)
  }
}