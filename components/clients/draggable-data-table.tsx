"use client"

import * as React from "react"
import { debounce } from "@/lib/helpers"
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
  ColumnOrderState,
} from "@tanstack/react-table"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Search, Filter, Plus, X, GripVertical } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { FilterSheet } from "./filter-sheet"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"
import { AddClientDialog } from "./add-client-dialog"
// Define draggable header props locally
interface DraggableHeaderProps<TData> {
  column: any
  table: any
}
import type { Client } from "./columns"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onDataChange?: () => void
}

// Draggable table header component
function DraggableTableHeader<TData>({ column, table }: DraggableHeaderProps<TData>) {
  // Actions column should not be draggable
  const isDraggable = column.id !== 'actions' && column.id !== 'select'
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    disabled: !isDraggable,
  })

  const style = isDraggable ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  } : {}

  return (
    <TableHead ref={setNodeRef} style={style} className="relative">
      <div className="flex items-center gap-2">
        {isDraggable && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab hover:text-primary touch-none"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        {flexRender(column.column.columnDef.header, column.getContext())}
      </div>
    </TableHead>
  )
}

export function DraggableDataTable<TData, TValue>({
  columns,
  data,
  onDataChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(() => {
    // Get default order from columns, ensuring actions is always last
    const defaultOrder = columns
      .filter(col => col.id !== 'actions')
      .map((column) => typeof column.id === 'string' ? column.id : column.toString())
    return [...defaultOrder, 'actions']
  })
  const [selectedFilters, setSelectedFilters] = React.useState<{
    industries: string[]
    sizes: string[]
    statuses: string[]
  }>({
    industries: [],
    sizes: [],
    statuses: [],
  })

  // Load saved column order from localStorage
  React.useEffect(() => {
    const savedOrder = localStorage.getItem('clientsTableColumnOrder')
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder)
        // Ensure actions column is always last
        const withoutActions = parsed.filter((id: string) => id !== 'actions')
        setColumnOrder([...withoutActions, 'actions'])
      } catch (e) {
        // Failed to parse saved column order, using default
      }
    }
  }, [])

  // Save column order to localStorage when it changes
  React.useEffect(() => {
    localStorage.setItem('clientsTableColumnOrder', JSON.stringify(columnOrder))
  }, [columnOrder])

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
    onColumnOrderChange: setColumnOrder,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      columnOrder,
    },
    meta: {
      onDataChange,
    },
  })

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id && active.id !== 'actions' && over?.id !== 'actions') {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over?.id as string)
        
        // Don't allow moving past the actions column
        if (newIndex >= items.indexOf('actions')) {
          return items
        }
        
        const newOrder = arrayMove(items, oldIndex, newIndex)
        // Ensure actions stays at the end
        const withoutActions = newOrder.filter(id => id !== 'actions')
        return [...withoutActions, 'actions']
      })
    }
  }

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
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
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
        <div className="hidden md:flex items-center gap-2">
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
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
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
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const defaultOrder = columns
                .filter(col => col.id !== 'actions')
                .map((column) => 
                  typeof column.id === 'string' ? column.id : column.toString()
                )
              setColumnOrder([...defaultOrder, 'actions'])
              localStorage.removeItem('clientsTableColumnOrder')
            }}
          >
            Reset Order
          </Button>
          
          <AddClientDialog onClientAdded={onDataChange} />
        </div>
      </div>

      {/* Desktop Table View with Draggable Headers */}
      <div className="hidden md:block rounded-md border">
        <ScrollArea className="w-full">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    <SortableContext
                      items={columnOrder.filter(id => id !== 'actions' && id !== 'select')}
                      strategy={horizontalListSortingStrategy}
                    >
                      {headerGroup.headers.map((header) => {
                        return (
                          <DraggableTableHeader
                            key={header.id}
                            column={header}
                            table={table}
                          />
                        )
                      })}
                    </SortableContext>
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
          </DndContext>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Mobile Card View - Visible only on mobile */}
      <div className="md:hidden space-y-4">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const client = row.original as Client
            return (
              <Card key={row.id} className="overflow-hidden">
                <CardContent className="p-4">
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