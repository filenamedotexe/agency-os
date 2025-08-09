import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  CheckCircle,
  Clock,
  Users,
  Calendar,
  Target,
  AlertCircle,
  ChevronRight,
} from "lucide-react"

export default async function TeamDashboard() {
  const supabase = await createClient()
  
  // Verify team member access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()
    
  if (profile?.role !== "team_member") {
    redirect("/dashboard")
  }

  // Fetch team member's assigned tasks
  const { data: myTasks, count: totalTasks } = await supabase
    .from("tasks")
    .select("*, milestones!inner(*, services!inner(*, profiles!services_client_id_fkey(*)))", { count: "exact" })
    .eq("assignee_id", user.id)

  // Calculate task metrics
  const completedTasks = myTasks?.filter(t => t.status === "completed").length || 0
  const inProgressTasks = myTasks?.filter(t => t.status === "in_progress").length || 0
  const todoTasks = myTasks?.filter(t => t.status === "todo").length || 0
  const overdueT ...filter(t => 
    t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed"
  ).length || 0

  // Get unique clients I'm working with
  const uniqueClients = new Set(
    myTasks?.map(t => t.milestones?.services?.profiles?.id).filter(Boolean)
  )
  const activeClients = uniqueClients.size

  // Get upcoming deadlines (next 7 days)
  const upcomingDeadlines = myTasks?.filter(t => {
    if (!t.due_date || t.status === "completed") return false
    const dueDate = new Date(t.due_date)
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return dueDate >= now && dueDate <= weekFromNow
  }).sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())

  // Priority task status helper
  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "destructive" | "secondary" | "default"> = {
      high: "destructive",
      medium: "default",
      low: "secondary",
    }
    return <Badge variant={variants[priority] || "default"}>{priority}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "destructive" | "secondary" | "default" | "outline"> = {
      completed: "secondary",
      in_progress: "default",
      todo: "outline",
    }
    return <Badge variant={variants[status] || "outline"}>{status.replace('_', ' ')}</Badge>
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          Team Dashboard
        </h2>
        <div className="text-sm text-muted-foreground">
          Welcome back, {profile.first_name}
        </div>
      </div>

      {/* Stats Grid - Responsive */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="My Tasks"
          value={totalTasks || 0}
          description={`${completedTasks} completed`}
          icon={CheckCircle}
        />
        <StatCard
          title="In Progress"
          value={inProgressTasks}
          description="Active tasks"
          icon={Clock}
        />
        <StatCard
          title="Active Clients"
          value={activeClients}
          description="You're working with"
          icon={Users}
        />
        <StatCard
          title="Overdue"
          value={overdueTasks}
          description="Need attention"
          icon={AlertCircle}
          className={overdueTasks > 0 ? "border-red-200" : ""}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        {/* Task List - Main content */}
        <div className="lg:col-span-4 space-y-4">
          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {!upcomingDeadlines || upcomingDeadlines.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No upcoming deadlines in the next 7 days
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingDeadlines.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{task.title}</p>
                            {getPriorityBadge(task.priority)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {task.milestones?.services?.name} • {task.milestones?.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Client: {task.milestones?.services?.profiles?.first_name} {task.milestones?.services?.profiles?.last_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium">
                            {new Date(task.due_date!).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {Math.ceil(
                              (new Date(task.due_date!).getTime() - new Date().getTime()) / 
                              (1000 * 60 * 60 * 24)
                            )} days left
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* My Active Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                My Active Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {!myTasks || myTasks.filter(t => t.status !== "completed").length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No active tasks assigned
                  </p>
                ) : (
                  <div className="space-y-3">
                    {myTasks
                      .filter(t => t.status !== "completed")
                      .slice(0, 10)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{task.title}</p>
                              {getStatusBadge(task.status)}
                            </div>
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{task.milestones?.services?.name}</span>
                              {task.estimated_hours && (
                                <span>{task.estimated_hours}h estimated</span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
                        </div>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Stats */}
        <div className="lg:col-span-3 space-y-4">
          {/* Task Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Task Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Completed</span>
                    <span className="font-medium">{completedTasks}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{
                        width: `${totalTasks ? (completedTasks / (totalTasks || 1)) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>In Progress</span>
                    <span className="font-medium">{inProgressTasks}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{
                        width: `${totalTasks ? (inProgressTasks / (totalTasks || 1)) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>To Do</span>
                    <span className="font-medium">{todoTasks}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-gray-400 transition-all"
                      style={{
                        width: `${totalTasks ? (todoTasks / (totalTasks || 1)) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Priority Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Priority Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-sm">High Priority</span>
                  </div>
                  <span className="text-sm font-medium">
                    {myTasks?.filter(t => t.priority === "high").length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="text-sm">Medium Priority</span>
                  </div>
                  <span className="text-sm font-medium">
                    {myTasks?.filter(t => t.priority === "medium").length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm">Low Priority</span>
                  </div>
                  <span className="text-sm font-medium">
                    {myTasks?.filter(t => t.priority === "low").length || 0}
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
                → View All Tasks
              </button>
              <button className="text-sm text-left hover:text-primary transition-colors">
                → Time Tracking
              </button>
              <button className="text-sm text-left hover:text-primary transition-colors">
                → Submit Report
              </button>
              <button className="text-sm text-left hover:text-primary transition-colors">
                → Team Calendar
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}