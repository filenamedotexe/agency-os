import { Skeleton } from "@/shared/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card"

export function ServicesListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="hover:shadow-lg transition-shadow">
          <CardHeader className="space-y-2">
            <div className="flex items-start justify-between">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[...Array(3)].map((_, j) => (
                    <Skeleton key={j} className="h-8 w-8 rounded-full" />
                  ))}
                </div>
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ServiceDetailSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/10 p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 p-6">
          <div className="flex gap-4 h-full">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-1 bg-muted/10 rounded-lg p-4">
                <div className="mb-4 flex items-center justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <Card key={j}>
                      <CardContent className="p-4 space-y-2">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-16 rounded-full" />
                          <Skeleton className="h-6 w-6 rounded-full" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TaskCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}