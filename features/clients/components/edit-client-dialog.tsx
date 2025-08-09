"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { useToast } from "@/shared/hooks/use-toast"
import { Globe, Linkedin, Twitter, Facebook, Instagram, Mail, Check, Edit } from "lucide-react"
import { useSupabase } from "@/shared/hooks/use-supabase"
import { formatError, logError } from "@/shared/lib/error-handling"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import type { Client } from "./columns"

// Phone number regex for international format
const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/

// URL validation that allows empty or valid URLs
const urlSchema = z.string().transform((val) => val.trim()).refine(
  (val) => {
    if (!val) return true
    try {
      const urlToTest = val.match(/^https?:\/\//) ? val : `https://${val}`
      new URL(urlToTest)
      return true
    } catch {
      return false
    }
  },
  { message: "Invalid URL format" }
)

// Social media URL validators
const linkedinUrlSchema = z.string().transform((val) => val.trim()).refine(
  (val) => {
    if (!val) return true
    return val.includes('linkedin.com/') || val.includes('linkedin.com')
  },
  { message: "Invalid LinkedIn URL" }
)

const twitterUrlSchema = z.string().transform((val) => val.trim()).refine(
  (val) => {
    if (!val) return true
    return val.includes('twitter.com/') || val.includes('x.com/')
  },
  { message: "Invalid Twitter/X URL" }
)

// Edit form schema (no password required)
const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  company_name: z.string().min(1, "Company name is required"),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  phone: z.string()
    .optional()
    .refine((val) => !val || phoneRegex.test(val), "Invalid phone number format"),
  website: urlSchema.optional(),
  duda_site_id: z.string().optional(),
  duda_site_url: urlSchema.optional(),
  linkedin_url: linkedinUrlSchema.optional(),
  twitter_url: twitterUrlSchema.optional(),
  facebook_url: urlSchema.optional(),
  instagram_url: urlSchema.optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface EditClientDialogProps {
  client: Client
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientUpdated?: () => void
}

export function EditClientDialog({ client, open, onOpenChange, onClientUpdated }: EditClientDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const { toast } = useToast()
  const supabase = useSupabase()
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: client.email || "",
      first_name: client.first_name || "",
      last_name: client.last_name || "",
      company_name: client.client_profiles?.company_name || "",
      industry: client.client_profiles?.industry || "",
      company_size: client.client_profiles?.company_size || "",
      phone: client.client_profiles?.phone || "",
      website: client.client_profiles?.website || "",
      duda_site_id: client.client_profiles?.duda_site_id || "",
      duda_site_url: client.client_profiles?.duda_site_url || "",
      linkedin_url: client.client_profiles?.linkedin_url || "",
      twitter_url: client.client_profiles?.twitter_url || "",
      facebook_url: client.client_profiles?.facebook_url || "",
      instagram_url: client.client_profiles?.instagram_url || "",
      address: client.client_profiles?.address || "",
      notes: client.client_profiles?.notes || "",
    },
  })

  // Reset form when client changes
  useEffect(() => {
    form.reset({
      email: client.email || "",
      first_name: client.first_name || "",
      last_name: client.last_name || "",
      company_name: client.client_profiles?.company_name || "",
      industry: client.client_profiles?.industry || "",
      company_size: client.client_profiles?.company_size || "",
      phone: client.client_profiles?.phone || "",
      website: client.client_profiles?.website || "",
      duda_site_id: client.client_profiles?.duda_site_id || "",
      duda_site_url: client.client_profiles?.duda_site_url || "",
      linkedin_url: client.client_profiles?.linkedin_url || "",
      twitter_url: client.client_profiles?.twitter_url || "",
      facebook_url: client.client_profiles?.facebook_url || "",
      instagram_url: client.client_profiles?.instagram_url || "",
      address: client.client_profiles?.address || "",
      notes: client.client_profiles?.notes || "",
    })
  }, [client, form])

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/[^\d+]/g, '')
    
    if (cleaned.startsWith('+1')) {
      const match = cleaned.match(/^(\+1)(\d{0,3})(\d{0,3})(\d{0,4})/)
      if (match) {
        const parts = [match[1]]
        if (match[2]) parts.push(`(${match[2]}`)
        if (match[3]) parts.push(`) ${match[3]}`)
        if (match[4]) parts.push(`-${match[4]}`)
        return parts.join('')
      }
    } else if (cleaned.startsWith('+')) {
      return cleaned
    } else if (cleaned.length <= 10) {
      const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})/)
      if (match) {
        const parts = []
        if (match[1]) parts.push(`(${match[1]}`)
        if (match[2]) parts.push(`) ${match[2]}`)
        if (match[3]) parts.push(`-${match[3]}`)
        return parts.join('')
      }
    }
    
    return value
  }

  // Auto-prepend https:// to URLs if needed
  const formatUrl = (value: string, field: { onChange: (value: string) => void }) => {
    if (value && !value.match(/^https?:\/\//)) {
      field.onChange(`https://${value}`)
    } else {
      field.onChange(value)
    }
  }

  async function onSubmit(values: FormData) {
    setIsLoading(true)
    setUpdateSuccess(false)
    
    try {
      // Process URLs - add https:// if needed
      const processedValues = {
        ...values,
        website: values.website && !values.website.match(/^https?:\/\//) 
          ? `https://${values.website}` 
          : values.website,
        duda_site_url: values.duda_site_url && !values.duda_site_url.match(/^https?:\/\//) 
          ? `https://${values.duda_site_url}` 
          : values.duda_site_url,
        linkedin_url: values.linkedin_url && !values.linkedin_url.match(/^https?:\/\//) 
          ? `https://${values.linkedin_url}` 
          : values.linkedin_url,
        twitter_url: values.twitter_url && !values.twitter_url.match(/^https?:\/\//) 
          ? `https://${values.twitter_url}` 
          : values.twitter_url,
        facebook_url: values.facebook_url && !values.facebook_url.match(/^https?:\/\//) 
          ? `https://${values.facebook_url}` 
          : values.facebook_url,
        instagram_url: values.instagram_url && !values.instagram_url.match(/^https?:\/\//) 
          ? `https://${values.instagram_url}` 
          : values.instagram_url,
      }

      // Step 1: Update the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email: processedValues.email,
          first_name: processedValues.first_name,
          last_name: processedValues.last_name,
        })
        .eq('id', client.id)

      if (profileError) throw profileError

      // Step 2: Upsert the client profile
      const { error: clientProfileError } = await supabase
        .from('client_profiles')
        .upsert({
          id: client.id,
          company_name: processedValues.company_name,
          industry: processedValues.industry || null,
          company_size: processedValues.company_size || null,
          phone: processedValues.phone || null,
          website: processedValues.website || null,
          duda_site_id: processedValues.duda_site_id || null,
          duda_site_url: processedValues.duda_site_url || null,
          linkedin_url: processedValues.linkedin_url || null,
          twitter_url: processedValues.twitter_url || null,
          facebook_url: processedValues.facebook_url || null,
          instagram_url: processedValues.instagram_url || null,
          address: processedValues.address || null,
          notes: processedValues.notes || null,
        })

      if (clientProfileError) throw clientProfileError

      setUpdateSuccess(true)
      
      toast({
        title: "Client updated successfully",
        description: `${processedValues.first_name} ${processedValues.last_name}'s information has been updated.`,
      })

      // Wait a moment to show the success message
      setTimeout(() => {
        onOpenChange(false)
        setUpdateSuccess(false)
        onClientUpdated?.()
      }, 1500)
      
    } catch (error) {
      logError(error, "EditClientDialog.onSubmit")
      toast({
        title: "Error updating client",
        description: formatError(error),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update client information. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        {updateSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Client information updated successfully!
            </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="email" 
                          placeholder="john@company.com" 
                          className="pl-8"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Changing email will require the user to verify their new email address
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Company Information */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium">Company Information</h3>
              
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="real-estate">Real Estate</SelectItem>
                          <SelectItem value="consulting">Consulting</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="company_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Size</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="201-500">201-500 employees</SelectItem>
                          <SelectItem value="500+">500+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+1 (555) 123-4567" 
                          {...field}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value)
                            field.onChange(formatted)
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        International format supported
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="example.com" 
                            className="pl-8"
                            {...field}
                            onBlur={(e) => formatUrl(e.target.value, field)}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        We'll add https:// automatically
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Duda Integration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duda_site_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duda Site ID (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="site_12345" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The unique Duda site identifier
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="duda_site_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duda Site URL (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="site.duda.co/site/..." 
                            className="pl-8"
                            {...field}
                            onBlur={(e) => formatUrl(e.target.value, field)}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        The Duda editor or preview URL
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Social Media Links */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium">Social Media (Optional)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="linkedin_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Linkedin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="linkedin.com/company/..." 
                            className="pl-8"
                            {...field}
                            onBlur={(e) => formatUrl(e.target.value, field)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="twitter_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter/X</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Twitter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="twitter.com/..." 
                            className="pl-8"
                            {...field}
                            onBlur={(e) => formatUrl(e.target.value, field)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="facebook_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Facebook className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="facebook.com/..." 
                            className="pl-8"
                            {...field}
                            onBlur={(e) => formatUrl(e.target.value, field)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="instagram_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Instagram className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="instagram.com/..." 
                            className="pl-8"
                            {...field}
                            onBlur={(e) => formatUrl(e.target.value, field)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium">Additional Information</h3>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="123 Main St, City, State 12345"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes about the client..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}