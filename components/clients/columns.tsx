"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowUpDown, MoreHorizontal, Mail, Phone, Globe, Building2 } from "lucide-react"

export type Client = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  avatar_url: string | null
  created_at: string
  updated_at: string
  client_profiles: {
    company_name: string | null
    phone: string | null
    industry: string | null
    website: string | null
    company_size: string | null
    annual_revenue: string | null
    tags: string[] | null
  } | null
}

export const columns: ColumnDef<Client>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const firstName = row.original.first_name || ""
      const lastName = row.original.last_name || ""
      const fullName = `${firstName} ${lastName}`.trim() || "Unknown"
      
      return (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs font-medium">
              {firstName[0]?.toUpperCase() || "?"}
            </span>
          </div>
          <div>
            <p className="font-medium">{fullName}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "company",
    header: "Company",
    cell: ({ row }) => {
      const company = row.original.client_profiles?.company_name
      const industry = row.original.client_profiles?.industry
      
      if (!company) return <span className="text-muted-foreground">—</span>
      
      return (
        <div>
          <p className="font-medium flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {company}
          </p>
          {industry && (
            <p className="text-xs text-muted-foreground">{industry}</p>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "contact",
    header: "Contact",
    cell: ({ row }) => {
      const phone = row.original.client_profiles?.phone
      const website = row.original.client_profiles?.website
      
      return (
        <div className="space-y-1">
          {phone && (
            <p className="text-sm flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {phone}
            </p>
          )}
          {website && (
            <p className="text-sm flex items-center gap-1">
              <Globe className="h-3 w-3" />
              <a href={website} target="_blank" rel="noopener noreferrer" 
                 className="text-blue-600 hover:underline">
                Website
              </a>
            </p>
          )}
          {!phone && !website && (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "size",
    header: "Size",
    cell: ({ row }) => {
      const size = row.original.client_profiles?.company_size
      const revenue = row.original.client_profiles?.annual_revenue
      
      if (!size && !revenue) return <span className="text-muted-foreground">—</span>
      
      return (
        <div>
          {size && <Badge variant="outline">{size}</Badge>}
          {revenue && (
            <p className="text-xs text-muted-foreground mt-1">{revenue}</p>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.original.client_profiles?.tags
      
      if (!tags || tags.length === 0) {
        return <span className="text-muted-foreground">—</span>
      }
      
      return (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{tags.length - 2}
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Joined
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return (
        <div className="text-sm">
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const client = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>View profile</DropdownMenuItem>
            <DropdownMenuItem>Edit client</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              Send email
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              Delete client
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]