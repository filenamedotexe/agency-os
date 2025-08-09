"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { ArrowUpDown, Phone, Globe, Building2 } from "lucide-react"
import { ClientActions } from "./client-actions"

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
    duda_site_id: string | null
    duda_site_url: string | null
    linkedin_url?: string | null
    twitter_url?: string | null
    facebook_url?: string | null
    instagram_url?: string | null
    company_size: string | null
    annual_revenue: string | null
    address?: string | null
    notes?: string | null
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
    id: "name",
    accessorFn: (row) => `${row.first_name || ""} ${row.last_name || ""} ${row.email}`.toLowerCase(),
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
    filterFn: (row, id, value) => {
      const searchValue = value.toLowerCase()
      const firstName = (row.original.first_name || "").toLowerCase()
      const lastName = (row.original.last_name || "").toLowerCase()
      const email = (row.original.email || "").toLowerCase()
      const company = (row.original.client_profiles?.company_name || "").toLowerCase()
      
      return firstName.includes(searchValue) || 
             lastName.includes(searchValue) || 
             email.includes(searchValue) ||
             company.includes(searchValue)
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
    accessorKey: "duda_site_id",
    header: "Duda Site ID",
    cell: ({ row }) => {
      const siteId = row.original.client_profiles?.duda_site_id
      
      if (!siteId) return <span className="text-muted-foreground">—</span>
      
      return (
        <div className="font-mono text-sm">
          {siteId}
        </div>
      )
    },
  },
  {
    accessorKey: "duda_site_url",
    header: "Duda Site URL",
    cell: ({ row }) => {
      const siteUrl = row.original.client_profiles?.duda_site_url
      
      if (!siteUrl) return <span className="text-muted-foreground">—</span>
      
      return (
        <a 
          href={siteUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:underline text-sm flex items-center gap-1"
        >
          <Globe className="h-3 w-3" />
          View Site
        </a>
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
    header: "Actions",
    enableHiding: false,
    enableSorting: false,
    cell: ({ row, table }) => {
      const client = row.original
      const meta = table.options.meta as { onDataChange?: () => void } | undefined

      return (
        <div className="flex justify-end">
          <ClientActions 
            client={client} 
            onDataChange={meta?.onDataChange}
          />
        </div>
      )
    },
  },
]