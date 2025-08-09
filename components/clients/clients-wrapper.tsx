"use client"

import { useState, useCallback } from "react"
import { DraggableDataTable } from "./draggable-data-table"
import { columns } from "./columns"
import { useSupabase } from "@/hooks/use-supabase"
import { useRouter } from "next/navigation"
import { logError } from "@/lib/error-handling"
import type { Client } from "./columns"

interface ClientsWrapperProps {
  initialData: Client[]
}

export function ClientsWrapper({ initialData }: ClientsWrapperProps) {
  const [clients, setClients] = useState<Client[]>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = useSupabase()

  const fetchClients = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data } = await supabase
        .from("profiles")
        .select(`
          *,
          client_profiles (
            company_name,
            phone,
            industry,
            website,
            duda_site_id,
            duda_site_url,
            company_size,
            annual_revenue,
            tags
          )
        `)
        .eq("role", "client")
        .order("created_at", { ascending: false })
      
      if (data) {
        setClients(data)
      }
    } catch (error) {
      logError(error, "ClientsWrapper.fetchClients")
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const handleDataChange = useCallback(() => {
    fetchClients()
    router.refresh()
  }, [fetchClients, router])

  return (
    <DraggableDataTable 
      columns={columns} 
      data={clients} 
      onDataChange={handleDataChange}
    />
  )
}