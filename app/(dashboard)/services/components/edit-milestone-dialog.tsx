"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, CheckCircle2, Clock, AlertCircle, Loader2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { Calendar } from '@/shared/components/ui/calendar'
import { AssigneeSelector } from '@/shared/components/ui/assignee-selector'
import { useToast } from '@/shared/hooks/use-toast'
import { useServiceContext } from '@/shared/contexts/service-context'
import { updateMilestone, deleteMilestone } from '@/app/actions/milestones'
import { getAssignableUsersForMilestone } from '@/app/actions/assignments'
import { cn } from '@/shared/lib/utils'
import type { Profile, AssignableUser, MilestoneStatus, MilestoneWithAssignee } from '@/shared/types'

const editMilestoneSchema = z.object({
  name: z.string().min(1, "Milestone name is required"),
  description: z.string().optional(),
  status: z.enum(["upcoming", "in_progress", "completed", "delayed"] as const),
  due_date: z.date().optional(),
  assignee_id: z.string().nullable().optional(),
})

type EditMilestoneFormValues = z.infer<typeof editMilestoneSchema>

export function EditMilestoneDialog() {
  const router = useRouter()
  const { toast } = useToast()
  const {
    isEditMilestoneOpen,
    setIsEditMilestoneOpen,
    editingMilestone,
    setEditingMilestone,
    serviceId,
    milestones,
    setMilestones
  } = useServiceContext()

  const [isLoading, setIsLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const form = useForm<EditMilestoneFormValues>({
    resolver: zodResolver(editMilestoneSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "upcoming",
      due_date: undefined,
      assignee_id: null,
    },
  })

  // Status options with icons and colors
  const statusOptions = [
    {
      value: "upcoming" as const,
      label: "Upcoming",
      icon: Clock,
      description: "Not started yet",
      className: "text-gray-600"
    },
    {
      value: "in_progress" as const,
      label: "In Progress",
      icon: AlertCircle,
      description: "Currently active",
      className: "text-blue-600"
    },
    {
      value: "completed" as const,
      label: "Completed",
      icon: CheckCircle2,
      description: "Successfully finished",
      className: "text-green-600"
    },
    {
      value: "delayed" as const,
      label: "Delayed",
      icon: AlertCircle,
      description: "Behind schedule",
      className: "text-red-600"
    }
  ]

  // Load assignable users when dialog opens
  useEffect(() => {
    if (isEditMilestoneOpen && serviceId) {
      loadAssignableUsers()
    }
  }, [isEditMilestoneOpen, serviceId])

  // Reset form when editing milestone changes
  useEffect(() => {
    if (editingMilestone) {
      form.reset({
        name: editingMilestone.name,
        description: editingMilestone.description || "",
        status: editingMilestone.status as MilestoneStatus,
        due_date: editingMilestone.due_date ? new Date(editingMilestone.due_date) : undefined,
        assignee_id: editingMilestone.assignee_id || null,
      })
    }
  }, [editingMilestone, form])

  const loadAssignableUsers = async () => {
    setLoadingUsers(true)
    try {
      const result = await getAssignableUsersForMilestone(serviceId)
      if ('data' in result) {
        setAssignableUsers(result.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load assignable users",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load assignable users",
        variant: "destructive"
      })
    } finally {
      setLoadingUsers(false)
    }
  }
  const handleClose = () => {
    setIsEditMilestoneOpen(false)
    setEditingMilestone(null)
    form.reset()
  }

  const onSubmit = async (values: EditMilestoneFormValues) => {
    if (!editingMilestone) return

    setIsLoading(true)
    try {
      // Prepare update data
      const updateData = {
        name: values.name,
        description: values.description || undefined,
        status: values.status,
        due_date: values.due_date ? values.due_date.toISOString().split('T')[0] : undefined,
        assignee_id: values.assignee_id || undefined,
      }

      // Convert AssignableUser to Profile format for optimistic update
      const assignableUser = values.assignee_id 
        ? assignableUsers.find(u => u.id === values.assignee_id) 
        : null
      
      const profileFromAssignable = assignableUser ? {
        id: assignableUser.id,
        email: assignableUser.email,
        first_name: assignableUser.full_name?.split(' ')[0] || null,
        last_name: assignableUser.full_name?.split(' ').slice(1).join(' ') || null,
        full_name: assignableUser.full_name,
        role: assignableUser.role,
        avatar_url: assignableUser.avatar_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } : null

      // Optimistic update with proper type conversion
      const updatedMilestone: MilestoneWithAssignee = {
        ...editingMilestone,
        ...updateData,
        description: updateData.description || null, // Convert undefined to null
        assignee: profileFromAssignable,
        assignee_profile: profileFromAssignable
      }

      // Update local state optimistically
      const updatedMilestones = milestones.map(m => 
        m.id === editingMilestone.id ? updatedMilestone : m
      )
      setMilestones(updatedMilestones)

      // Call server action
      const result = await updateMilestone(editingMilestone.id, updateData)

      if ('error' in result) {
        // Revert optimistic update on error
        setMilestones(milestones)
        throw new Error(result.error)
      }

      toast({
        title: "Success",
        description: "Milestone updated successfully",
      })

      handleClose()
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update milestone",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!editingMilestone) return
    
    const confirmMessage = `Are you sure you want to delete "${editingMilestone.name}"? This will also delete all tasks within this milestone.`
    if (!confirm(confirmMessage)) {
      return
    }
    
    setDeleting(true)
    try {
      const result = await deleteMilestone(editingMilestone.id)
      if ('error' in result) {
        throw new Error(result.error)
      }
      
      toast({
        title: "Success",
        description: "Milestone deleted successfully",
      })
      
      handleClose()
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete milestone",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
  }
  if (!editingMilestone) return null

  return (
    <Dialog open={isEditMilestoneOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Milestone</DialogTitle>
          <DialogDescription>
            Update milestone details, status, and assignment.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Milestone Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Design Phase"
                      {...field}
                      disabled={isLoading || deleting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this milestone..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={isLoading || deleting}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description to clarify the milestone scope
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading || deleting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((status) => {
                          const IconComponent = status.icon
                          return (
                            <SelectItem key={status.value} value={status.value}>
                              <div className="flex items-center gap-2">
                                <IconComponent className={cn("h-4 w-4", status.className)} />
                                <div>
                                  <div className="font-medium">{status.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {status.description}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Due Date */}
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoading || deleting}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                        {field.value && (
                          <div className="p-3 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => field.onChange(undefined)}
                              className="w-full"
                            >
                              Clear date
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Target completion date for this milestone
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Assignee */}
            <FormField
              control={form.control}
              name="assignee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee</FormLabel>
                  <FormControl>
                    <AssigneeSelector
                      value={field.value}
                      onChange={field.onChange}
                      users={assignableUsers}
                      allowClient={false}
                      placeholder="Select assignee..."
                      disabled={isLoading || deleting}
                      loading={loadingUsers}
                      className="w-full"
                    />
                  </FormControl>
                  <FormDescription>
                    Assign this milestone to a team member or admin
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Milestone Stats */}
            {editingMilestone.tasks && (editingMilestone.tasks?.length || 0) > 0 && (
              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-medium mb-3">Task Progress</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {editingMilestone.tasks?.length || 0}
                    </div>
                    <div className="text-muted-foreground">Total Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {editingMilestone.tasks?.filter((t: any) => t.status === 'done').length}
                    </div>
                    <div className="text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round((editingMilestone.tasks?.filter((t: any) => t.status === 'done').length / editingMilestone.tasks?.length || 0) * 100)}%
                    </div>
                    <div className="text-muted-foreground">Progress</div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <div className="flex-1">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading || deleting}
                  className="w-full sm:w-auto"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading || deleting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || deleting}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Updating...' : 'Update Milestone'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}