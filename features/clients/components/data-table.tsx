"use client"

import * as React from "react"
import { debounce } from "@/shared/lib/helpers"
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
import { ChevronDown, Search, Filter, Plus, X } from "lucide-react"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/shared/components/ui/scroll-area"
import { FilterSheet } from "./filter-sheet"
import { DataTableFacetedFilter } from "@/shared/components/ui/data-table-faceted-filter"
import { AddClientDialog } from "./add-client-dialog"
import { designSystem as ds } from "@/shared/lib/design-system"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onDataChange?: () => void
}

export function ClientsDataTable<TData, TValue>({
  columns,
  data,
  onDataChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [selectedFilters, setSelectedFilters] = React.useState<{
    industries: string[]
    sizes: string[]
    statuses: string[]
  }>({
    industries: [],
    sizes: [],
    statuses: [],
  })

  const table = useReactTable({
    data,
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
    },
    meta: {
      onDataChange,
    },
  })

  // Debounced search handler
  const debouncedSearch = React.useMemo(
    () => debounce((value: string) => {
      table.getColumn("name")?.setFilterValue(value)
    }, 300),
    [table]
  )

  // Filter options (in production, these would come from the data)
  const industryOptions = [
    { label: "Technology", value: "technology" },
    { label: "Finance", value: "finance" },
    { label: "Healthcare", value: "healthcare" },
    { label: "Retail", value: "retail" },
    { label: "Manufacturing", value: "manufacturing" },
  ]

  const sizeOptions = [
    { label: "1-10", value: "1-10" },
    { label: "11-50", value: "11-50" },
    { label: "51-200", value: "51-200" },
    { label: "201-500", value: "201-500" },
    { label: "500+", value: "500+" },
  ]

  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Pending", value: "pending" },
    { label: "Inactive", value: "inactive" },
  ]

  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2 top-3 sm:p-4.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or company..."
            value={globalFilter}
            onChange={(event) => {
              setGlobalFilter(event.target.value)
              debouncedSearch(event.target.value)
            }}
            className="pl-8"
          />
        </div>
        
        {/* Desktop Filters - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-3 sm:p-4">
          {table.getColumn("company") && (
            <DataTableFacetedFilter
              column={table.getColumn("company")}
              title="Industry"
              options={industryOptions}
            />
          )}
          {table.getColumn("size") && (
            <DataTableFacetedFilter
              column={table.getColumn("size")}
              title="Size"
              options={sizeOptions}
            />
          )}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-3 sm:px-4 lg:px-3 sm:px-4"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 sm:p-4 w-full sm:w-auto">
          {/* Mobile Filter Sheet - Visible only on mobile */}
          <div className="md:hidden">
            <FilterSheet
              industries={industryOptions}
              sizes={sizeOptions}
              statuses={statusOptions}
              selectedFilters={selectedFilters}
              onFiltersChange={setSelectedFilters}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
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
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <AddClientDialog onClientAdded={onDataChange} />
        </div>
      </div>

      {/* Desktop Table View - Hidden on mobile */}
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
                    No clients found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Mobile Card View - Visible only on mobile */}
      <div className="md:hidden space-y-4">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const client = row.original as any
            return (
              <Card key={row.id} className="overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {client.first_name} {client.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {client.email}
                        </p>
                      </div>
                      <Badge variant="outline">Client</Badge>
                    </div>
                    
                    {client.client_profiles && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {client.client_profiles.company_name}
                        </p>
                        {client.client_profiles.industry && (
                          <p className="text-xs text-muted-foreground">
                            {client.client_profiles.industry}
                          </p>
                        )}
                        {client.client_profiles.phone && (
                          <p className="text-xs text-muted-foreground">
                            📞 {client.client_profiles.phone}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(client.created_at).toLocaleDateString()}
                      </p>
                      <Button variant="ghost" size="sm">
                        View Profile →
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                No clients found
              </p>
              <AddClientDialog onClientAdded={onDataChange} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
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