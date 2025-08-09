import { redirect, notFound } from "next/navigation"
import { createClient } from "@/shared/lib/supabase/server"
import { ROUTES } from "@/shared/lib/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar"
import type { Profile, ClientProfile, Service } from "@/shared/types"
import {
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Briefcase,
  Activity,
  Edit,
  MessageCircle,
} from "lucide-react"

interface ClientPageProps {
  params: Promise<{ id: string }>
}

export default async function ClientProfilePage({ params }: ClientPageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  // Verify user has access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.LOGIN)
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
    
  // Only admin, team members, or the client themselves can view
  if (!profile?.role || (profile.role === "client" && user.id !== id)) {
    redirect(ROUTES.DASHBOARD)
  }
  
  // Fetch client profile data
  const { data: client } = await supabase
    .from("profiles")
    .select(`
      *,
      client_profiles (*)
    `)
    .eq("id", id)
    .eq("role", "client")
    .single()
  
  if (!client) {
    notFound()
  }
  
  // Fetch client's services
  const { data: services } = await supabase
    .from("services")
    .select(`
      *,
      milestones (
        *,
        tasks (*)
      )
    `)
    .eq("client_id", id)
    .order("created_at", { ascending: false })
  
  const clientProfile = client.client_profiles?.[0]
  const totalServices = services?.length || 0
  const activeServices = services?.filter(s => s.status === "in_progress").length || 0
  const completedServices = services?.filter(s => s.status === "completed").length || 0
  
  // Calculate total investment
  const totalInvestment = services?.reduce(
    (sum, service) => sum + (parseFloat(service.budget) || 0),
    0
  ) || 0
  
  // Get client initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()
  }
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Client Profile
          </h2>
          <p className="text-sm text-muted-foreground">
            Complete client information and project history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>
      
      {/* Client Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(client.first_name, client.last_name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h3 className="text-xl font-semibold">
                  {client.first_name} {client.last_name}
                </h3>
                <Badge variant="outline">Client</Badge>
              </div>
              
              {clientProfile?.company_name && (
                <p className="text-muted-foreground flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {clientProfile.company_name}
                </p>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(client.created_at).toLocaleDateString()}
                </span>
                {clientProfile?.industry && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {clientProfile.industry}
                  </span>
                )}
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 text-center w-full sm:w-auto">
              <div>
                <p className="text-2xl font-bold text-primary">{totalServices}</p>
                <p className="text-xs text-muted-foreground">Services</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{activeServices}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{completedServices}</p>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Company Information */}
            {clientProfile && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Company Size</span>
                      <span className="font-medium">{clientProfile.company_size || "Not specified"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Annual Revenue</span>
                      <span className="font-medium">{clientProfile.annual_revenue || "Not specified"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Industry</span>
                      <span className="font-medium">{clientProfile.industry || "Not specified"}</span>
                    </div>
                  </div>
                  
                  {clientProfile.website && (
                    <div className="pt-2 border-t">
                      <a 
                        href={clientProfile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <Globe className="h-4 w-4" />
                        Visit Website
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Investment Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Investment Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Investment</span>
                    <span className="text-2xl font-bold">
                      ${totalInvestment.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t text-center">
                    <div>
                      <p className="text-lg font-semibold text-green-600">{activeServices}</p>
                      <p className="text-xs text-muted-foreground">Active Projects</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-blue-600">{completedServices}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Services & Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {!services || services.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No services assigned yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {services.map((service) => (
                    <div key={service.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{service.project_name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {service.description}
                          </p>
                        </div>
                        <Badge variant={
                          service.status === 'completed' ? 'secondary' :
                          service.status === 'in_progress' ? 'default' :
                          'outline'
                        }>
                          {service.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Budget: ${parseFloat(service.budget).toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">
                          {service.milestones?.length || 0} milestones
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Activity timeline coming soon</p>
                  <p className="text-xs mt-1">Track client interactions and project updates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{client.email}</p>
                    <p className="text-xs text-muted-foreground">Primary Email</p>
                  </div>
                </div>
                
                {clientProfile?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{clientProfile.phone}</p>
                      <p className="text-xs text-muted-foreground">Phone</p>
                    </div>
                  </div>
                )}
                
                {clientProfile?.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <a 
                        href={clientProfile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        {clientProfile.website}
                      </a>
                      <p className="text-xs text-muted-foreground">Website</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}