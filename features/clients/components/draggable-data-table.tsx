"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
  ColumnOrderState,
} from "@tanstack/react-table"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
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
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { ChevronDown, Search, X, GripVertical } from "lucide-react"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { FilterSheet } from "./filter-sheet"
import { DataTableFacetedFilter } from "@/shared/components/ui/data-table-faceted-filter"
import { AddClientDialog } from "./add-client-dialog"
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

function DraggableTableHeader<TData>({ column }: DraggableHeaderProps<TData>) {
  const isDraggable = column.id !== 'actions' && column.id !== 'select'
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: column.id,
    disabled: !isDraggable,
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <th
      ref={setNodeRef}
      style={style}
      className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
    >
      <div className="flex items-center gap-2">
        {isDraggable && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab hover:text-primary touch-none"
            aria-label={`Drag to reorder ${column.id} column`}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        {flexRender(column.column.columnDef.header, column.getContext())}
      </div>
    </th>
  )
}

export function DraggableDataTable<TData, TValue>({
  columns,
  data,
  onDataChange,
}: DataTableProps<TData, TValue>) {
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([])
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

  // Initialize column order from table
  React.useEffect(() => {
    if (columnOrder.length === 0 && table.getAllColumns().length > 0) {
      const allColumns = table.getAllColumns().map(col => col.id)
      
      const savedOrder = localStorage.getItem('clientsTableColumnOrder')
      if (savedOrder) {
        try {
          const parsed = JSON.parse(savedOrder)
          // Make sure all columns are included
          const validOrder = allColumns.filter(id => parsed.includes(id))
          const missingColumns = allColumns.filter(id => !parsed.includes(id))
          setColumnOrder([...validOrder, ...missingColumns])
          return
        } catch (e) {}
      }
      // Set default order from all columns
      setColumnOrder(allColumns)
    }
  }, [table, columnOrder.length])

  React.useEffect(() => {
    if (columnOrder.length > 0) {
      localStorage.setItem('clientsTableColumnOrder', JSON.stringify(columnOrder))
    }
  }, [columnOrder])

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!active || !over || active.id === over.id) return
    
    setColumnOrder((items) => {
      const oldIndex = items.indexOf(active.id as string)
      const newIndex = items.indexOf(over.id as string)
      return arrayMove(items, oldIndex, newIndex)
    })
  }

  const debouncedSearch = React.useMemo(
    () => debounce((value: string) => {
      table.getColumn("name")?.setFilterValue(value)
    }, 300),
    [table]
  )

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
              const defaultOrder = table.getAllColumns().map(col => col.id)
              setColumnOrder(defaultOrder)
              localStorage.removeItem('clientsTableColumnOrder')
            }}
          >
            Reset Order
          </Button>
          
          <AddClientDialog onClientAdded={onDataChange} />
        </div>
      </div>

      {/* Desktop Table View with Draggable Headers */}
      <div className="hidden md:block">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToHorizontalAxis]}
        >
          <div className="rounded-md border" style={{ maxHeight: '70vh', overflow: 'auto' }}>
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                {table.getHeaderGroups().map((headerGroup) => {
                  // Sort headers based on columnOrder
                  const orderedHeaders = columnOrder.length > 0 
                    ? columnOrder
                        .map(columnId => headerGroup.headers.find(h => h.id === columnId))
                        .filter(Boolean)
                    : headerGroup.headers
                  
                  return (
                    <tr key={headerGroup.id} className="border-b transition-colors hover:bg-muted/50">
                      <SortableContext
                        items={columnOrder}
                        strategy={horizontalListSortingStrategy}
                      >
                        {orderedHeaders.map((header) => header && (
                          <DraggableTableHeader
                            key={header.id}
                            column={header}
                            table={table}
                          />
                        ))}
                      </SortableContext>
                    </tr>
                  )
                })}
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      data-state={row.getIsSelected() ? "selected" : undefined}
                    >
                      {columnOrder.length > 0
                        ? columnOrder
                            .map(columnId => row.getVisibleCells().find(cell => cell.column.id === columnId))
                            .filter(Boolean)
                            .map((cell) => cell && (
                              <td key={cell.id} className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </td>
                            ))
                        : row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          ))
                      }
                    </tr>
                  ))
                ) : (
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <td
                      colSpan={columns.length}
                      className="h-24 text-center p-4 align-middle"
                    >
                      No clients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DndContext>
      </div>

      {/* Mobile Card View - Visible only on mobile and tablet */}
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
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/clients/${client.id}`)}
                      >
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