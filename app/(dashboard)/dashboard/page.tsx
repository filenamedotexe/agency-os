import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardRedirect() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  // Get user profile to determine role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  // Redirect based on role
  if (profile?.role === "admin") {
    redirect("/admin")
  } else if (profile?.role === "team_member") {
    redirect("/team")
  } else if (profile?.role === "client") {
    redirect("/client")
  } else {
    // Default fallback
    redirect("/")
  }
}