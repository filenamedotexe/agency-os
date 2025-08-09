"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Filter, X } from "lucide-react"

interface FilterOption {
  label: string
  value: string
  count?: number
}

interface FilterSheetProps {
  industries: FilterOption[]
  sizes: FilterOption[]
  statuses: FilterOption[]
  selectedFilters: {
    industries: string[]
    sizes: string[]
    statuses: string[]
  }
  onFiltersChange: (filters: {
    industries: string[]
    sizes: string[]
    statuses: string[]
  }) => void
}

export function FilterSheet({
  industries,
  sizes,
  statuses,
  selectedFilters,
  onFiltersChange,
}: FilterSheetProps) {
  const [localFilters, setLocalFilters] = React.useState(selectedFilters)
  const [open, setOpen] = React.useState(false)

  const handleFilterChange = (
    category: "industries" | "sizes" | "statuses",
    value: string,
    checked: boolean
  ) => {
    setLocalFilters((prev) => ({
      ...prev,
      [category]: checked
        ? [...prev[category], value]
        : prev[category].filter((v) => v !== value),
    }))
  }

  const applyFilters = () => {
    onFiltersChange(localFilters)
    setOpen(false)
  }

  const clearFilters = () => {
    const clearedFilters = {
      industries: [],
      sizes: [],
      statuses: [],
    }
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const totalActiveFilters =
    localFilters.industries.length +
    localFilters.sizes.length +
    localFilters.statuses.length

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {totalActiveFilters > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 h-5 px-1 min-w-[20px] rounded-full"
            >
              {totalActiveFilters}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Filter Clients</SheetTitle>
          <SheetDescription>
            Narrow down your client list using the filters below
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 mt-6 pr-6 -mr-6">
          <div className="space-y-6">
            {/* Industry Filter */}
            <div>
              <h4 className="font-medium mb-3">Industry</h4>
              <div className="space-y-2">
                {industries.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`industry-${option.value}`}
                      checked={localFilters.industries.includes(option.value)}
                      onCheckedChange={(checked) =>
                        handleFilterChange("industries", option.value, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`industry-${option.value}`}
                      className="flex-1 cursor-pointer text-sm font-normal"
                    >
                      {option.label}
                      {option.count !== undefined && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          ({option.count})
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Company Size Filter */}
            <div>
              <h4 className="font-medium mb-3">Company Size</h4>
              <div className="space-y-2">
                {sizes.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`size-${option.value}`}
                      checked={localFilters.sizes.includes(option.value)}
                      onCheckedChange={(checked) =>
                        handleFilterChange("sizes", option.value, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`size-${option.value}`}
                      className="flex-1 cursor-pointer text-sm font-normal"
                    >
                      {option.label}
                      {option.count !== undefined && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          ({option.count})
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Status Filter */}
            <div>
              <h4 className="font-medium mb-3">Status</h4>
              <div className="space-y-2">
                {statuses.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={localFilters.statuses.includes(option.value)}
                      onCheckedChange={(checked) =>
                        handleFilterChange("statuses", option.value, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`status-${option.value}`}
                      className="flex-1 cursor-pointer text-sm font-normal"
                    >
                      {option.label}
                      {option.count !== undefined && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          ({option.count})
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="mt-6">
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex-1"
              disabled={totalActiveFilters === 0}
            >
              Clear All
            </Button>
            <Button onClick={applyFilters} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}