import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { designSystem as ds } from "@/shared/lib/design-system"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn(ds.animation.transition.default, "hover:shadow-sm", className)}>
      <CardHeader className="pb-2">
        <div className={ds.layout.flex.between}>
          <CardTitle className={ds.typography.component.label}>
            {title}
          </CardTitle>
          <div className="rounded-lg bg-muted p-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent className={ds.spacing.component.gap}>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        
        {description && (
          <p className={ds.typography.component.small}>
            {description}
          </p>
        )}
        
        {trend && (
          <div className={cn(ds.layout.flex.start, "gap-1")}>
            <div className={cn(
              ds.layout.flex.start,
              "gap-0.5",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span className="text-xs font-medium">
                {Math.abs(trend.value)}%
              </span>
            </div>
            <span className={ds.typography.component.small}>
              from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}