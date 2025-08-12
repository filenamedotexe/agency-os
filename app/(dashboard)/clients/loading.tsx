import { TableSkeleton } from "@/shared/components/ui/loading-skeleton"

export default function Loading() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 sm:p-8 pt-6">
      <div>
        <h2 className="text-2xl md:text-2xl sm:text-3xl font-bold tracking-tight">
          Clients
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage your client relationships and profiles
        </p>
      </div>
      <TableSkeleton />
    </div>
  )
}