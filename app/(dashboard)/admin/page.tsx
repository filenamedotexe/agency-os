import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/shared/lib/supabase/server"
import { StatCard, RecentActivity } from "@/features/dashboard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Progress } from "@/shared/components/ui/progress"
import { Badge } from "@/shared/components/ui/badge"
import { 
  PageLayout, 
  PageHeader, 
  PageContent, 
  StatGrid, 
  ContentGrid 
} from "@/shared/components/layout/page-layout"
import { designSystem as ds } from "@/shared/lib/design-system"
import {
  Users,
  Briefcase,
  DollarSign,
  UserCheck,
  Activity,
  Plus,
  UserPlus,
  FileText,
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

  // Calculate total revenue
  const totalRevenue = servicesResult.data?.reduce(
    (sum, service) => sum + (parseFloat(service.budget) || 0),
    0
  ) || 0

  // Get completed tasks
  const completedTasks = tasksResult.data?.filter(
    (t) => t.status === "completed"
  ).length || 0

  const completionRate = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0

  // Mock recent activity
  const recentActivities = [
    {
      id: "1",
      user: { name: "John Smith", email: "john@agencyos.dev" },
      action: "updated",
      target: "Website Redesign project",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: "2",
      user: { name: "Sarah Johnson", email: "sarah@agencyos.dev" },
      action: "completed",
      target: "User Research task",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      id: "3",
      user: { name: "Alice Brown", email: "client1@acme.com" },
      action: "commented on",
      target: "Design Mockups",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
  ]

  return (
    <PageLayout>
      <PageHeader
        title="Admin Dashboard"
        subtitle={`Welcome back, ${profile.first_name || 'Admin'}`}
      />
      
      <PageContent>
        {/* Stats Grid */}
        <StatGrid>
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
        </StatGrid>

        {/* Content Grid */}
        <ContentGrid columns="sidebar">
          {/* Activity Feed */}
          <div className="lg:col-span-4">
            <RecentActivity activities={recentActivities} />
          </div>

          {/* Side Panels */}
          <div className={`lg:col-span-3 ${ds.spacing.page.gap}`}>
            {/* Task Overview */}
            <Card>
              <CardHeader className="space-y-1">
                <div className={ds.layout.flex.between}>
                  <div>
                    <CardTitle>Task Overview</CardTitle>
                    <CardDescription>Current task progress</CardDescription>
                  </div>
                  <Activity className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className={ds.spacing.section.gap}>
                <div className="space-y-3">
                  <div className={`${ds.layout.flex.between} text-sm`}>
                    <span className="text-muted-foreground">Total Tasks</span>
                    <span className="font-medium">{totalTasks}</span>
                  </div>
                  <div className={`${ds.layout.flex.between} text-sm`}>
                    <span className="text-muted-foreground">Completed</span>
                    <Badge variant="default">{completedTasks}</Badge>
                  </div>
                  <div className={`${ds.layout.flex.between} text-sm`}>
                    <span className="text-muted-foreground">In Progress</span>
                    <Badge variant="secondary">{totalTasks - completedTasks}</Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className={`${ds.layout.flex.between} text-sm`}>
                    <span className="text-muted-foreground">Completion Rate</span>
                    <span className="font-medium">{completionRate}%</span>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Service Status */}
            <Card>
              <CardHeader className="space-y-1">
                <div className={ds.layout.flex.between}>
                  <div>
                    <CardTitle>Service Status</CardTitle>
                    <CardDescription>Service distribution</CardDescription>
                  </div>
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className={ds.spacing.component.gap}>
                <div className={`${ds.layout.flex.between}`}>
                  <div className={`${ds.layout.flex.start} gap-3 sm:p-4`}>
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className={ds.typography.component.body}>Planning</span>
                  </div>
                  <span className="text-sm font-medium">
                    {servicesResult.data?.filter(s => s.status === "planning").length || 0}
                  </span>
                </div>
                <div className={`${ds.layout.flex.between}`}>
                  <div className={`${ds.layout.flex.start} gap-3 sm:p-4`}>
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className={ds.typography.component.body}>In Progress</span>
                  </div>
                  <span className="text-sm font-medium">{activeServices}</span>
                </div>
                <div className={`${ds.layout.flex.between}`}>
                  <div className={`${ds.layout.flex.start} gap-3 sm:p-4`}>
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className={ds.typography.component.body}>Completed</span>
                  </div>
                  <span className="text-sm font-medium">
                    {servicesResult.data?.filter(s => s.status === "completed").length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                <Button variant="ghost" className="w-full justify-start h-9" asChild>
                  <Link href="/clients">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Client
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start h-9" asChild>
                  <Link href="/services">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Create Service
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start h-9" asChild>
                  <Link href="/team">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Team Member
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start h-9" asChild>
                  <Link href="/reports">
                    <FileText className="mr-2 h-4 w-4" />
                    View Reports
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </ContentGrid>
      </PageContent>
    </PageLayout>
  )
}