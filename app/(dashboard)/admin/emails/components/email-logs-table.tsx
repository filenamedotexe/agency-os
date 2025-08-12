"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/shared/lib/supabase/client"
import { Badge } from "@/shared/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { ChevronDown, Search, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/shared/components/ui/card"
import { ScrollArea, ScrollBar } from "@/shared/components/ui/scroll-area"
import { DataTableFacetedFilter } from "@/shared/components/ui/data-table-faceted-filter"

interface EmailLog {
  id: string
  recipient_id: string
  recipient_email: string
  type: string
  subject: string
  status: string
  error?: string
  metadata?: Record<string, unknown>
  sent_at: string
  recipient?: {
    first_name: string
    last_name: string
    email: string
  }
}

export function EmailLogsTable() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")
  
  const supabase = createClient()

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('email_logs')
      .select(`
        *,
        recipient:profiles(first_name, last_name, email)
      `)
      .order('sent_at', { ascending: false })
      .limit(100)
    
    setLogs(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  async function refreshLogs() {
    setRefreshing(true)
    await fetchLogs()
    setRefreshing(false)
  }

  const columns: ColumnDef<EmailLog>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const typeLabels: Record<string, string> = {
          welcome: "Welcome",
          milestone_complete: "Milestone",
          task_assigned: "Task",
          test_welcome: "Test Welcome",
          test_milestone: "Test Milestone", 
          test_task: "Test Task",
        }
        const type = row.original.type
        return (
          <Badge variant="outline">
            {typeLabels[type] || type}
          </Badge>
        )
      }
    },
    {
      id: "recipient_name",
      header: "Recipient",
      cell: ({ row }) => {
        const recipient = row.original.recipient
        const email = row.original.recipient_email
        if (recipient) {
          return (
            <div>
              <div className="font-medium">
                {recipient.first_name} {recipient.last_name}
              </div>
              <div className="text-sm text-muted-foreground">
                {email}
              </div>
            </div>
          )
        }
        return <div className="text-sm">{email}</div>
      }
    },
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate">
          {row.original.subject}
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'sent' ? 'default' : 'destructive'}>
          {row.original.status}
        </Badge>
      )
    },
    {
      accessorKey: "sent_at",
      header: "Sent",
      cell: ({ row }) => {
        const date = new Date(row.original.sent_at)
        return (
          <div className="text-sm">
            <div>{formatDistanceToNow(date, { addSuffix: true })}</div>
            <div className="text-muted-foreground">
              {date.toLocaleDateString()}
            </div>
          </div>
        )
      }
    },
  ]

  const table = useReactTable({
    data: logs,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
  })

  // Filter options
  const typeOptions = [
    { label: "Welcome", value: "welcome" },
    { label: "Milestone", value: "milestone_complete" },
    { label: "Task", value: "task_assigned" },
    { label: "Test Welcome", value: "test_welcome" },
    { label: "Test Milestone", value: "test_milestone" },
    { label: "Test Task", value: "test_task" },
  ]

  const statusOptions = [
    { label: "Sent", value: "sent" },
    { label: "Failed", value: "failed" },
  ]

  const isFiltered = table.getState().columnFilters.length > 0

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading email logs...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2 top-3 sm:p-4.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by recipient, subject, or type..."
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="hidden md:flex items-center gap-3 sm:p-4">
          {table.getColumn("type") && (
            <DataTableFacetedFilter
              column={table.getColumn("type")}
              title="Type"
              options={typeOptions}
            />
          )}
          {table.getColumn("status") && (
            <DataTableFacetedFilter
              column={table.getColumn("status")}
              title="Status"
              options={statusOptions}
            />
          )}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-3 sm:px-4 lg:px-3 sm:px-4"
            >
              Reset
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 sm:p-4 w-full sm:w-auto ml-auto">
          <Button
            variant="outline"
            onClick={refreshLogs}
            disabled={refreshing}
            className="gap-3 sm:p-4"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ChevronDown className="mr-2 h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id.replace('_', ' ')}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No email logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const log = row.original
            return (
              <Card key={row.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3 sm:p-4">
                          <Badge variant="outline">
                            {log.type.replace('_', ' ')}
                          </Badge>
                          <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                            {log.status}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm">
                          {log.subject}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">To:</span> {log.recipient_email}
                      </p>
                      {log.recipient && (
                        <p className="text-sm text-muted-foreground">
                          {log.recipient.first_name} {log.recipient.last_name}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.sent_at), { addSuffix: true })}
                      </p>
                      {log.error && (
                        <Badge variant="destructive" className="text-xs">
                          Error
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">
                No email logs found
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} email(s) found
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}