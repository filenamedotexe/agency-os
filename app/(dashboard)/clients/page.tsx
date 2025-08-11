import { redirect } from "next/navigation"
import { createClient } from "@/shared/lib/supabase/server"
import { ClientsWrapper } from "@/features/clients"
import { 
  PageLayout, 
  PageHeader, 
  PageContent 
} from "@/shared/components/layout/page-layout"

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
        duda_site_id,
        duda_site_url,
        company_size,
        annual_revenue,
        tags
      )
    `)
    .eq("role", "client")
    .order("created_at", { ascending: false })

  return (
    <PageLayout>
      <PageHeader
        title="Clients"
        subtitle="Manage your client relationships"
        description={`${clients?.length || 0} total clients`}
      />
      
      <PageContent>
        <ClientsWrapper 
          initialData={clients || []}
        />
      </PageContent>
    </PageLayout>
  )
}