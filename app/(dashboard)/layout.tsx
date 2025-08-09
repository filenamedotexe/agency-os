import { redirect } from "next/navigation"
import { createClient } from "@/shared/lib/supabase/server"
import { ResponsiveNav } from "@/shared/components/layout/responsive-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <ResponsiveNav userRole={profile.role} user={profile} />
      
      {/* Main content area with responsive padding */}
      <main className="transition-all duration-200 ease-in-out">
        {/* Mobile: Account for bottom navigation (64px) and top header (56px) */}
        {/* Tablet/Desktop: Account for sidebar */}
        <div className="pb-16 pt-14 md:pb-0 md:pt-0 md:ml-16 lg:ml-64">
          <div className="min-h-[calc(100vh-120px)] md:min-h-screen">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}