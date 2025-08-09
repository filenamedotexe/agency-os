import { redirect } from "next/navigation"
import { createClient } from "@/shared/lib/supabase/server"
import { ROUTES } from "@/shared/lib/constants"
import { formatTimeAgo, calculateProgress, formatCurrency } from "@/shared/lib/helpers"
import { StatCard } from "@/features/dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Progress } from "@/shared/components/ui/progress"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
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
} from "lucide-react"

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

  // Get overall progress across all services  
  const calculateServiceProgress = (service: ServiceWithMilestones) => {
    const totalTasks = service.milestones?.reduce(
      (sum: number, m: MilestoneWithTasks) => sum + (m.tasks?.length || 0),
      0
    ) || 0
    
    const completedTasks = service.milestones?.reduce(
      (sum: number, m: MilestoneWithTasks) => sum + (m.tasks?.filter((t: Task) => t.status === "completed").length || 0),
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          My Dashboard
        </h2>
        <div className="text-sm text-muted-foreground">
          Welcome back, {profile.first_name}
        </div>
      </div>

      {/* Company Info Banner - Only on desktop */}
      {profile.client_profiles && (
        <Card className="hidden lg:block">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">{profile.client_profiles.company_name}</p>
              <p className="text-xs text-muted-foreground">{profile.client_profiles.industry}</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {profile.client_profiles.phone && <span>📞 {profile.client_profiles.phone}</span>}
              {profile.client_profiles.website && <span>🌐 {profile.client_profiles.website}</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid - Responsive */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        {/* Services Overview - Main content */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                My Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {!myServices || myServices.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground mb-2">No services yet</p>
                    <p className="text-xs text-muted-foreground">
                      Your projects will appear here once they're set up
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myServices.map((service) => {
                      const progress = calculateServiceProgress(service)
                      const totalMilestones = service.milestones?.length || 0
                      const completedMilestones = service.milestones?.filter(
                        (m: MilestoneWithTasks) => m.status === "completed"
                      ).length || 0
                      
                      return (
                        <div
                          key={service.id}
                          className="p-4 rounded-lg border hover:shadow-md transition-shadow"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{service.name}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {service.description}
                                </p>
                              </div>
                              <Badge variant={getStatusVariant(service.status)}>
                                {service.status.replace("_", " ")}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Overall Progress</span>
                                <span className="font-medium">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-xs">
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
        <div className="lg:col-span-3 space-y-4">
          {/* Recent Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentUpdates.map((update) => (
                  <div key={update.id} className="flex items-start gap-2">
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
                      <p className="text-xs">{update.message}</p>
                      <p className="text-xs text-muted-foreground">
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
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <button className="text-sm text-left hover:text-primary transition-colors flex items-center gap-2">
                <FileText className="h-3 w-3" />
                View Documents
              </button>
              <button className="text-sm text-left hover:text-primary transition-colors flex items-center gap-2">
                <MessageSquare className="h-3 w-3" />
                Send Message
              </button>
              <button className="text-sm text-left hover:text-primary transition-colors flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Schedule Meeting
              </button>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Your dedicated team is here to help
              </p>
              <button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm py-2 px-4 rounded-md transition-colors">
                Contact Support
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}