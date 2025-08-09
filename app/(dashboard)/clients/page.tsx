import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ClientsDataTable } from "@/components/clients/data-table"
import { columns } from "@/components/clients/columns"

export default async function ClientsPage() {
  const supabase = await createClient()
  
  // Verify user has access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
    
  // Only admin and team members can view clients
  if (profile?.role === "client") {
    redirect("/dashboard")
  }

  // Fetch all client profiles with their extended data
  const { data: clients } = await supabase
    .from("profiles")
    .select(`
      *,
      client_profiles (
        company_name,
        phone,
        industry,
        website,
        company_size,
        annual_revenue,
        tags
      )
    `)
    .eq("role", "client")
    .order("created_at", { ascending: false })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Clients
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your client relationships and profiles
          </p>
        </div>
      </div>
      
      <ClientsDataTable columns={columns} data={clients || []} />
    </div>
  )
}