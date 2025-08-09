import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StatCard } from "@/components/dashboard/stat-card"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Activity,
  UserCheck,
  Clock,
  CheckCircle,
} from "lucide-react"

export default async function AdminDashboard() {
  const supabase = await createClient()
  
  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()
    
  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch dashboard metrics
  const [
    clientsResult,
    servicesResult,
    teamResult,
    tasksResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .eq("role", "client"),
    supabase
      .from("services")
      .select("*", { count: "exact" }),
    supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .eq("role", "team_member"),
    supabase
      .from("tasks")
      .select("*", { count: "exact" }),
  ])

  // Calculate metrics
  const totalClients = clientsResult.count || 0
  const totalServices = servicesResult.count || 0
  const totalTeamMembers = teamResult.count || 0
  const totalTasks = tasksResult.count || 0

  // Get active services
  const activeServices = servicesResult.data?.filter(
    (s) => s.status === "in_progress"
  ).length || 0

  // Calculate total revenue (sum of all service budgets)
  const totalRevenue = servicesResult.data?.reduce(
    (sum, service) => sum + (parseFloat(service.budget) || 0),
    0
  ) || 0

  // Get completed tasks
  const completedTasks = tasksResult.data?.filter(
    (t) => t.status === "completed"
  ).length || 0

  // Mock recent activity - in production, this would come from an activity log table
  const recentActivities = [
    {
      id: "1",
      user: { name: "John Smith", email: "john@agencyos.dev" },
      action: "updated",
      target: "Website Redesign project",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    },
    {
      id: "2",
      user: { name: "Sarah Johnson", email: "sarah@agencyos.dev" },
      action: "completed",
      target: "User Research task",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: "3",
      user: { name: "Alice Brown", email: "client1@acme.com" },
      action: "commented on",
      target: "Design Mockups",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    },
  ]

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          Admin Dashboard
        </h2>
        <div className="text-sm text-muted-foreground">
          Welcome back, {profile.first_name}
        </div>
      </div>

      {/* Stats Grid - Responsive */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clients"
          value={totalClients}
          description="Active client accounts"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Active Services"
          value={activeServices}
          description={`${totalServices} total services`}
          icon={Briefcase}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          description="Across all services"
          icon={DollarSign}
          trend={{ value: 23, isPositive: true }}
        />
        <StatCard
          title="Team Members"
          value={totalTeamMembers}
          description="Active team members"
          icon={UserCheck}
        />
      </div>

      {/* Main Content Grid - Responsive */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        {/* Activity Feed - Takes more space on desktop */}
        <div className="lg:col-span-4">
          <RecentActivity activities={recentActivities} />
        </div>

        {/* Quick Stats - Sidebar on desktop */}
        <div className="lg:col-span-3 space-y-4">
          {/* Task Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Task Overview
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Tasks</span>
                  <span className="font-medium">{totalTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="font-medium text-green-600">{completedTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">In Progress</span>
                  <span className="font-medium text-blue-600">
                    {totalTasks - completedTasks}
                  </span>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span>Completion Rate</span>
                  <span className="font-medium">
                    {totalTasks > 0 
                      ? Math.round((completedTasks / totalTasks) * 100) 
                      : 0}%
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${
                        totalTasks > 0 
                          ? (completedTasks / totalTasks) * 100 
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Service Status
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Planning</span>
                  <span className="font-medium">
                    {servicesResult.data?.filter(s => s.status === "planning").length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">In Progress</span>
                  <span className="font-medium text-blue-600">
                    {activeServices}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="font-medium text-green-600">
                    {servicesResult.data?.filter(s => s.status === "completed").length || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <button className="text-sm text-left hover:text-primary transition-colors">
                → Add New Client
              </button>
              <button className="text-sm text-left hover:text-primary transition-colors">
                → Create Service
              </button>
              <button className="text-sm text-left hover:text-primary transition-colors">
                → Invite Team Member
              </button>
              <button className="text-sm text-left hover:text-primary transition-colors">
                → View Reports
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}