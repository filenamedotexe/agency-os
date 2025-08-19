import { redirect } from "next/navigation"
import { createClient } from "@/shared/lib/supabase/server"
import { ROUTES } from "@/shared/lib/constants"
import { formatTimeAgo } from "@/shared/lib/helpers"
import { StatCard } from "@/features/dashboard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Progress } from "@/shared/components/ui/progress"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { 
  PageLayout, 
  PageHeader, 
  PageContent,
  StatGrid,
  ContentGrid
} from "@/shared/components/layout/page-layout"
import { designSystem as ds } from "@/shared/lib/design-system"
import type { ServiceWithMilestones, MilestoneWithTasks, Task } from "@/shared/types"
import {
  Briefcase,
  Clock,
  CheckCircle,
  FileText,
  Calendar,
  TrendingUp,
  Users,
  MessageSquare,
  ListTodo,
  AlertCircle,
  Circle,
} from "lucide-react"
import Link from "next/link"

export default async function ClientDashboard() {
  const supabase = await createClient()
  
  // Verify client access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.LOGIN)
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, client_profiles(*)")
    .eq("id", user.id)
    .single()
    
  if (profile?.role !== "client") {
    redirect(ROUTES.DASHBOARD)
  }

  // Fetch client's services with milestones and tasks
  const { data: services } = await supabase
    .from("services")
    .select(`
      *,
      milestones (
        *,
        tasks (*)
      )
    `)
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })
  
  // Fetch tasks assigned to the client
  const { data: assignedTasks } = await supabase
    .from("tasks")
    .select(`
      *,
      milestone:milestones!inner(
        id,
        name,
        service:services!inner(
          id,
          name: project_name,
          client_id
        )
      )
    `)
    .or(`assigned_to.eq.${user.id},and(visibility.eq.client,milestone.service.client_id.eq.${user.id})`)
    .order("due_date", { ascending: true })

  // Map to correct Service type structure
  const myServices = services?.map(service => ({
    ...service,
    name: service.project_name, // Map project_name to name for consistency
  }))

  // Calculate metrics
  const totalServices = myServices?.length || 0
  const activeServices = myServices?.filter(s => s.status === "in_progress").length || 0
  const completedServices = myServices?.filter(s => s.status === "completed").length || 0
  
  // Calculate total investment
  const totalInvestment = myServices?.reduce(
    (sum, service) => sum + (parseFloat(service.budget) || 0),
    0
  ) || 0
  
  // Calculate task metrics
  const totalTasks = assignedTasks?.length || 0
  const todoTasks = assignedTasks?.filter(t => t.status === 'todo').length || 0
  const inProgressTasks = assignedTasks?.filter(t => t.status === 'in_progress').length || 0
  const completedTasks = assignedTasks?.filter(t => t.status === 'done').length || 0
  const blockedTasks = assignedTasks?.filter(t => t.status === 'blocked').length || 0

  // Get overall progress across all services  
  const calculateServiceProgress = (service: ServiceWithMilestones) => {
    const totalTasks = service.milestones?.reduce(
      (sum: number, m: MilestoneWithTasks) => sum + (m.tasks?.length || 0),
      0
    ) || 0
    
    const completedTasks = service.milestones?.reduce(
      (sum: number, m: MilestoneWithTasks) => sum + (m.tasks?.filter((t: Task) => t.status === "done").length || 0),
      0
    ) || 0
    
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  }

  // Get status badge variant
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      planning: "outline",
      in_progress: "default",
      completed: "secondary",
      on_hold: "destructive",
    }
    return variants[status] || "outline"
  }

  // Mock recent updates - in production, this would come from an activity log
  const recentUpdates = [
    {
      id: "1",
      type: "milestone",
      message: "Design phase completed for Website Redesign",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: "2",
      type: "task",
      message: "Development sprint started",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
    {
      id: "3",
      type: "comment",
      message: "Team responded to your feedback",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    },
  ]

  return (
    <PageLayout>
      <PageHeader
        title="My Dashboard"
        subtitle={`Welcome back, ${profile.first_name || 'there'}`}
        description={profile.client_profiles?.company_name}
      />

      <PageContent>
        {/* Company Info Banner - Only on desktop */}
        {profile.client_profiles && (
          <Card className="hidden lg:block">
            <CardContent className="flex items-center justify-between p-4 sm:p-6">
              <div>
                <p className={ds.typography.component.body}>{profile.client_profiles.company_name}</p>
                <p className={ds.typography.component.small}>{profile.client_profiles.industry}</p>
              </div>
              <div className={`${ds.layout.flex.start} gap-4 ${ds.typography.component.small}`}>
                {profile.client_profiles.phone && <span>📞 {profile.client_profiles.phone}</span>}
                {profile.client_profiles.website && <span>🌐 {profile.client_profiles.website}</span>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <StatGrid>
        <StatCard
          title="Active Services"
          value={activeServices}
          description={`of ${totalServices} total`}
          icon={Briefcase}
        />
        <StatCard
          title="Completed"
          value={completedServices}
          description="Services delivered"
          icon={CheckCircle}
        />
        <StatCard
          title="Total Investment"
          value={`$${totalInvestment.toLocaleString()}`}
          description="Across all services"
          icon={TrendingUp}
        />
        <StatCard
          title="Team Members"
          value="3"
          description="Working on your projects"
          icon={Users}
        />
      </StatGrid>

      {/* Main Content Grid */}
      <ContentGrid columns="sidebar">
        {/* Services Overview - Main content */}
        <div className="lg:col-span-4 space-y-6">
          {/* My Tasks Widget */}
          {totalTasks > 0 && (
            <Card>
              <CardHeader className="space-y-1">
                <div className={ds.layout.flex.between}>
                  <div>
                    <CardTitle>My Tasks</CardTitle>
                    <CardDescription>Tasks assigned to you across all services</CardDescription>
                  </div>
                  <ListTodo className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {/* Task Status Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                    <Circle className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">{todoTasks}</p>
                      <p className="text-xs text-muted-foreground">To Do</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">{inProgressTasks}</p>
                      <p className="text-xs text-muted-foreground">In Progress</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">{completedTasks}</p>
                      <p className="text-xs text-muted-foreground">Done</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">{blockedTasks}</p>
                      <p className="text-xs text-muted-foreground">Blocked</p>
                    </div>
                  </div>
                </div>
                
                {/* Recent Tasks List */}
                <div className="space-y-2">
                  <p className="text-sm font-medium mb-2">Recent Tasks</p>
                  {assignedTasks?.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`
                        w-2 h-2 rounded-full mt-1.5 flex-shrink-0
                        ${task.status === 'done' ? 'bg-green-500' :
                          task.status === 'in_progress' ? 'bg-blue-500' :
                          task.status === 'blocked' ? 'bg-red-500' :
                          'bg-gray-300'}
                      `} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          in {task.milestone?.service?.name || 'Unknown Service'}
                        </p>
                      </div>
                      {task.status === 'done' && (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
                
                {totalTasks > 5 && (
                  <div className="pt-3 mt-3 border-t">
                    <Link href="/client/tasks" className="text-sm text-primary hover:underline">
                      View all {totalTasks} tasks →
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Active Services */}
          <Card>
            <CardHeader className="space-y-1">
              <div className={ds.layout.flex.between}>
                <div>
                  <CardTitle>My Services</CardTitle>
                  <CardDescription>Your active projects and services</CardDescription>
                </div>
                <Briefcase className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ScrollArea className="h-[400px]">
                {!myServices || myServices.length === 0 ? (
                  <div className="text-center py-8">
                    <p className={`${ds.typography.component.subtitle} mb-2`}>No services yet</p>
                    <p className={ds.typography.component.small}>
                      Your projects will appear here once they&apos;re set up
                    </p>
                  </div>
                ) : (
                  <div className={ds.spacing.section.gap}>
                    {myServices.map((service) => {
                      const progress = calculateServiceProgress(service)
                      const totalMilestones = service.milestones?.length || 0
                      const completedMilestones = service.milestones?.filter(
                        (m: MilestoneWithTasks) => m.status === "completed"
                      ).length || 0
                      
                      return (
                        <div
                          key={service.id}
                          className={`${ds.spacing.component.padding} rounded-lg border hover:shadow-md transition-shadow`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className={ds.typography.component.title}>{service.name}</h4>
                                <p className={`${ds.typography.component.small} mt-1`}>
                                  {service.description}
                                </p>
                              </div>
                              <Badge variant={getStatusVariant(service.status)}>
                                {service.status.replace("_", " ")}
                              </Badge>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Overall Progress</span>
                                <span className="font-medium">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-muted-foreground">Milestones: </span>
                                <span className="font-medium">
                                  {completedMilestones}/{totalMilestones}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Budget: </span>
                                <span className="font-medium">
                                  ${parseFloat(service.budget).toLocaleString()}
                                </span>
                              </div>
                              {service.start_date && (
                                <div>
                                  <span className="text-muted-foreground">Started: </span>
                                  <span className="font-medium">
                                    {new Date(service.start_date).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              {service.end_date && (
                                <div>
                                  <span className="text-muted-foreground">Deadline: </span>
                                  <span className="font-medium">
                                    {new Date(service.end_date).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="pt-2 border-t">
                              <button className="text-xs text-primary hover:underline">
                                View Details →
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          {/* Recent Updates */}
          <Card>
            <CardHeader className="space-y-1">
              <div className={ds.layout.flex.between}>
                <div>
                  <CardTitle>Recent Updates</CardTitle>
                  <CardDescription>Latest activity on your projects</CardDescription>
                </div>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className={ds.spacing.component.gap}>
                {recentUpdates.map((update) => (
                  <div key={update.id} className="flex items-start gap-3 sm:p-4">
                    <div className="mt-1">
                      {update.type === "milestone" && (
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                      )}
                      {update.type === "task" && (
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                      {update.type === "comment" && (
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className={ds.typography.component.body}>{update.message}</p>
                      <p className={ds.typography.component.small}>
                        {formatTimeAgo(update.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>Quick Links</CardTitle>
              <CardDescription>Frequently used actions</CardDescription>
            </CardHeader>
            <CardContent className={ds.spacing.component.gap}>
              <button className={`${ds.typography.component.body} text-left hover:text-primary transition-colors ${ds.layout.flex.start} gap-3 sm:p-4`}>
                <FileText className="h-3 w-3" />
                View Documents
              </button>
              <button className="text-sm text-left hover:text-primary transition-colors flex items-center gap-3 sm:p-4">
                <MessageSquare className="h-3 w-3" />
                Send Message
              </button>
              <button className="text-sm text-left hover:text-primary transition-colors flex items-center gap-3 sm:p-4">
                <Calendar className="h-3 w-3" />
                Schedule Meeting
              </button>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-sm font-medium">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Your dedicated team is here to help
              </p>
              <button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm py-3 sm:py-4 sm:py-4 px-4 rounded-md transition-colors">
                Contact Support
              </button>
            </CardContent>
          </Card>
        </div>
      </ContentGrid>
    </PageContent>
  </PageLayout>
  )
}