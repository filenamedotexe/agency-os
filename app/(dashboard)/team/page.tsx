import { redirect } from "next/navigation"
import { createClient } from "@/shared/lib/supabase/server"
import { StatCard } from "@/features/dashboard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Progress } from "@/shared/components/ui/progress"
import { 
  PageLayout, 
  PageHeader, 
  PageContent,
  StatGrid,
  ContentGrid
} from "@/shared/components/layout/page-layout"
import { designSystem as ds } from "@/shared/lib/design-system"
import {
  Briefcase,
  CheckCircle,
  Clock,
  Calendar,
  Target,
  AlertCircle,
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

  // Fetch team member's tasks
  const { data: myTasks, count: totalTasks } = await supabase
    .from("tasks")
    .select("*", { count: "exact" })
    .eq("assignee_id", user.id)

  // Calculate task metrics
  const completedTasks = myTasks?.filter(t => t.status === "completed").length || 0
  const inProgressTasks = myTasks?.filter(t => t.status === "in_progress").length || 0
  const todoTasks = myTasks?.filter(t => t.status === "todo").length || 0
  const overdueTasks = myTasks?.filter(t => 
    t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed"
  ).length || 0

  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <PageLayout>
      <PageHeader
        title="Team Dashboard"
        subtitle={`Welcome back, ${profile.first_name || 'Team Member'}`}
      />
      
      <PageContent>
        {/* Stats Grid */}
        <StatGrid>
          <StatCard
            title="My Tasks"
            value={totalTasks || 0}
            description={`${completedTasks} completed`}
            icon={CheckCircle}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="In Progress"
            value={inProgressTasks}
            description="Active tasks"
            icon={Clock}
          />
          <StatCard
            title="To Do"
            value={todoTasks}
            description="Not started"
            icon={Briefcase}
          />
          <StatCard
            title="Overdue"
            value={overdueTasks}
            description="Need attention"
            icon={AlertCircle}
          />
        </StatGrid>

        {/* Content Grid */}
        <ContentGrid columns="sidebar">
          {/* Main Content */}
          <div className="lg:col-span-4 space-y-6">
            {/* Upcoming Tasks */}
            <Card>
              <CardHeader className="space-y-1">
                <div className={ds.layout.flex.between}>
                  <div>
                    <CardTitle>Upcoming Tasks</CardTitle>
                    <CardDescription>Your next priorities</CardDescription>
                  </div>
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {todoTasks === 0 ? (
                  <p className={ds.typography.component.subtitle}>
                    No upcoming tasks. Great job staying on top of your work!
                  </p>
                ) : (
                  <div className={ds.spacing.section.gap}>
                    {myTasks
                      ?.filter(t => t.status === "todo")
                      .slice(0, 5)
                      .map((task) => (
                        <div key={task.id} className="flex items-center justify-between py-3 sm:py-4 sm:py-4 border-b last:border-0">
                          <div>
                            <p className={ds.typography.component.body}>{task.title}</p>
                            <p className={ds.typography.component.small}>
                              Priority: {task.priority}
                            </p>
                          </div>
                          <Badge variant="outline">To Do</Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Tasks */}
            <Card>
              <CardHeader className="space-y-1">
                <div className={ds.layout.flex.between}>
                  <div>
                    <CardTitle>Active Tasks</CardTitle>
                    <CardDescription>Currently working on</CardDescription>
                  </div>
                  <Target className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {inProgressTasks === 0 ? (
                  <p className={ds.typography.component.subtitle}>
                    No tasks in progress. Pick a task to start working on.
                  </p>
                ) : (
                  <div className={ds.spacing.section.gap}>
                    {myTasks
                      ?.filter(t => t.status === "in_progress")
                      .slice(0, 5)
                      .map((task) => (
                        <div key={task.id} className="flex items-center justify-between py-3 sm:py-4 sm:py-4 border-b last:border-0">
                          <div>
                            <p className={ds.typography.component.body}>{task.title}</p>
                            {task.estimated_hours && (
                              <p className={ds.typography.component.small}>
                                {task.estimated_hours}h estimated
                              </p>
                            )}
                          </div>
                          <Badge>In Progress</Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            {/* Task Progress */}
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle>Task Progress</CardTitle>
                <CardDescription>Overall completion</CardDescription>
              </CardHeader>
              <CardContent className={ds.spacing.section.gap}>
                <div className="space-y-3">
                  <div className={`${ds.layout.flex.between} text-sm`}>
                    <span className="text-muted-foreground">Completion Rate</span>
                    <span className="font-medium">{completionRate}%</span>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                </div>
                
                <div className="space-y-3 pt-4">
                  <div className={`${ds.layout.flex.between} text-sm`}>
                    <span className="text-muted-foreground">Completed</span>
                    <Badge variant="secondary">{completedTasks}</Badge>
                  </div>
                  <div className={`${ds.layout.flex.between} text-sm`}>
                    <span className="text-muted-foreground">In Progress</span>
                    <Badge>{inProgressTasks}</Badge>
                  </div>
                  <div className={`${ds.layout.flex.between} text-sm`}>
                    <span className="text-muted-foreground">To Do</span>
                    <Badge variant="outline">{todoTasks}</Badge>
                  </div>
                  {overdueTasks > 0 && (
                    <div className={`${ds.layout.flex.between} text-sm`}>
                      <span className="text-muted-foreground">Overdue</span>
                      <Badge variant="destructive">{overdueTasks}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle>Priority Distribution</CardTitle>
                <CardDescription>Task priorities</CardDescription>
              </CardHeader>
              <CardContent className={ds.spacing.component.gap}>
                <div className={`${ds.layout.flex.between}`}>
                  <div className={`${ds.layout.flex.start} gap-3 sm:p-4`}>
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span className={ds.typography.component.body}>High</span>
                  </div>
                  <span className="text-sm font-medium">
                    {myTasks?.filter(t => t.priority === "high").length || 0}
                  </span>
                </div>
                <div className={`${ds.layout.flex.between}`}>
                  <div className={`${ds.layout.flex.start} gap-3 sm:p-4`}>
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className={ds.typography.component.body}>Medium</span>
                  </div>
                  <span className="text-sm font-medium">
                    {myTasks?.filter(t => t.priority === "medium").length || 0}
                  </span>
                </div>
                <div className={`${ds.layout.flex.between}`}>
                  <div className={`${ds.layout.flex.start} gap-3 sm:p-4`}>
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className={ds.typography.component.body}>Low</span>
                  </div>
                  <span className="text-sm font-medium">
                    {myTasks?.filter(t => t.priority === "low").length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </ContentGrid>
      </PageContent>
    </PageLayout>
  )
}