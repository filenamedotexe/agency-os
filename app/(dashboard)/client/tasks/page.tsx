import { redirect } from "next/navigation"
import { createClient } from "@/shared/lib/supabase/server"
import { ClientTasks } from "../components/client-tasks"
import { ROUTES } from "@/shared/lib/constants"
import { 
  PageLayout, 
  PageHeader, 
  PageContent
} from "@/shared/components/layout/page-layout"

export default async function ClientTasksPage() {
  const supabase = await createClient()
  
  // Verify client access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.LOGIN)
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
    
  if (profile?.role !== "client") {
    redirect(ROUTES.DASHBOARD)
  }
  
  // Fetch all tasks assigned to the client
  const { data: tasks } = await supabase
    .from("tasks")
    .select(`
      *,
      milestone:milestones!inner(
        id,
        name,
        service_id,
        service:services!inner(
          id,
          name: project_name,
          client_id,
          status
        )
      ),
      assigned_to:profiles!assigned_to(
        id,
        full_name,
        avatar_url
      )
    `)
    .or(`assigned_to.eq.${user.id},and(visibility.eq.client,milestone.service.client_id.eq.${user.id})`)
    .order("created_at", { ascending: false })
  
  // Format tasks with service information
  const formattedTasks = tasks?.map(task => ({
    ...task,
    service_id: task.milestone?.service_id,
    service_name: task.milestone?.service?.name,
    milestone_name: task.milestone?.name
  })) || []
  
  // Get unique services for filtering
  const uniqueServices = tasks?.reduce((acc: Array<{id: string, name: string}>, task) => {
    const serviceId = task.milestone?.service_id
    const serviceName = task.milestone?.service?.name
    if (serviceId && serviceName && !acc.find(s => s.id === serviceId)) {
      acc.push({ id: serviceId, name: serviceName })
    }
    return acc
  }, []) || []
  
  return (
    <PageLayout>
      <PageHeader
        title="My Tasks"
        subtitle="Manage and track your assigned tasks"
        description={`${formattedTasks.length} task${formattedTasks.length !== 1 ? 's' : ''} assigned to you`}
      />
      
      <PageContent>
        <ClientTasks 
          tasks={formattedTasks} 
          services={uniqueServices}
        />
      </PageContent>
    </PageLayout>
  )
}