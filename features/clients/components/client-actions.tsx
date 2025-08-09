"use client"

import { useState } from "react"
import { MoreHorizontal, Edit, Trash, Eye } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog"
import { useToast } from "@/shared/hooks/use-toast"
import { useSupabase } from "@/shared/hooks/use-supabase"
import { useRouter } from "next/navigation"
import { formatError, logError } from "@/shared/lib/error-handling"
import { EditClientDialog } from "./edit-client-dialog"
import type { Client } from "./columns"

interface ClientActionsProps {
  client: Client
  onDataChange?: () => void
}

export function ClientActions({ client, onDataChange }: ClientActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = useSupabase()

  const handleView = () => {
    router.push(`/clients/${client.id}`)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      // Delete client profile first (due to foreign key constraint)
      const { error: profileError } = await supabase
        .from("client_profiles")
        .delete()
        .eq("id", client.id)

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError
      }

      // Delete the user profile
      const { error: userError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", client.id)

      if (userError) throw userError

      toast({
        title: "Client deleted",
        description: `${client.first_name || ""} ${client.last_name || ""} has been removed.`,
      })

      onDataChange?.()
    } catch (error) {
      logError(error, "ClientActions.handleDelete")
      toast({
        title: "Error deleting client",
        description: formatError(error),
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleView}>
            <Eye className="mr-2 h-4 w-4" />
            View Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Client
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete Client
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {client.first_name || ""} {client.last_name || ""} 
              ({client.email}) and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditClientDialog
        client={client}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onClientUpdated={onDataChange}
      />
    </>
  )
}