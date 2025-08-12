import { redirect } from "next/navigation"
import { createClient } from "@/shared/lib/supabase/server"
import { AppSidebar } from "@/shared/components/layout/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/shared/components/ui/sidebar"
import { Separator } from "@/shared/components/ui/separator"
import { FloatingChat } from "@/features/chat/components/floating-chat"

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
    <SidebarProvider>
      <AppSidebar userRole={profile.role} user={profile} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-3 sm:p-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-3 sm:p-4 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 sm:p-6 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
      
      {/* Floating Chat for Client Users */}
      {user && (
        <FloatingChat 
          userId={user.id} 
          userRole={profile?.role || 'client'}
          userName={profile ? `${profile.first_name} ${profile.last_name}` : undefined}
        />
      )}
    </SidebarProvider>
  )
}