import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/shared/lib/utils"
import { designSystem as ds } from "@/shared/lib/design-system"

interface Activity {
  id: string
  user: {
    name: string
    email: string
    avatar?: string
  }
  action: string
  target: string
  timestamp: Date
}

interface RecentActivityProps {
  activities: Activity[]
  className?: string
}

export function RecentActivity({ activities, className }: RecentActivityProps) {
  return (
    <Card className={className}>
      <CardHeader className="space-y-1">
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates from your team</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <ScrollArea className="h-[300px] pr-4">
          <div className={ds.spacing.section.gap}>
            {activities.length === 0 ? (
              <div className={cn(ds.layout.flex.center, "py-8")}>
                <p className={ds.typography.component.subtitle}>
                  No recent activity
                </p>
              </div>
            ) : (
              activities.map((activity) => (
                <div 
                  key={activity.id} 
                  className={cn(
                    "flex items-start gap-3 sm:p-4",
                    "pb-3 last:pb-0",
                    "border-b last:border-0"
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={activity.user.avatar} />
                    <AvatarFallback className="text-xs">
                      {activity.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className={ds.typography.component.body}>
                      <span className="font-medium">{activity.user.name}</span>{" "}
                      <span className="text-muted-foreground">
                        {activity.action}
                      </span>{" "}
                      <span className="font-medium">{activity.target}</span>
                    </p>
                    <p className={ds.typography.component.small}>
                      {formatDistanceToNow(activity.timestamp, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}