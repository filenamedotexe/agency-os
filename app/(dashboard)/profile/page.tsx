import { redirect } from "next/navigation"
import { createClient } from "@/shared/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar"
import { 
  PageLayout, 
  PageHeader, 
  PageContent 
} from "@/shared/components/layout/page-layout"
import { designSystem as ds } from "@/shared/lib/design-system"
import {
  User,
  Mail,
  Phone,
  Building,
  Globe,
  Calendar,
  Shield
} from "lucide-react"

export default async function ProfilePage() {
  const supabase = await createClient()
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  
  // Get user profile with client details
  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      *,
      client_profiles(*)
    `)
    .eq("id", user.id)
    .single()
    
  if (!profile) {
    redirect("/login")
  }
  
  // Only allow clients to access this page
  if (profile.role !== "client") {
    redirect("/dashboard")
  }

  // Handle both array and object format from Supabase
  const clientProfile = Array.isArray(profile.client_profiles) 
    ? profile.client_profiles[0] 
    : profile.client_profiles
  
  // Get user initials for avatar
  const getUserInitials = (email?: string) => {
    if (!email) return "U"
    const parts = email.split("@")[0].split(".")
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return email[0].toUpperCase()
  }

  return (
    <PageLayout>
      <PageHeader
        title="My Profile"
        subtitle="View and manage your account information"
      />

      <PageContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Overview */}
          <Card>
            <CardHeader className="space-y-1">
              <div className={ds.layout.flex.start}>
                <Avatar className="h-16 w-16 mr-4">
                  <AvatarFallback className="text-lg">
                    {getUserInitials(profile.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="flex items-center gap-3 sm:p-4">
                    {profile.first_name} {profile.last_name}
                    <Badge variant="secondary">Client</Badge>
                  </CardTitle>
                  <p className={ds.typography.component.body}>
                    {clientProfile?.company_name || 'No company set'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={ds.layout.flex.start}>
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className={ds.typography.component.body}>{profile.email}</span>
              </div>
              
              {clientProfile?.phone && (
                <div className={ds.layout.flex.start}>
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className={ds.typography.component.body}>{clientProfile.phone}</span>
                </div>
              )}
              
              <div className={ds.layout.flex.start}>
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className={ds.typography.component.body}>
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          {clientProfile && (
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-3 sm:p-4">
                  <Building className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className={`${ds.typography.component.small} text-muted-foreground`}>
                    Company Name
                  </label>
                  <p className={ds.typography.component.body}>
                    {clientProfile.company_name || 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <label className={`${ds.typography.component.small} text-muted-foreground`}>
                    Industry
                  </label>
                  <p className={ds.typography.component.body}>
                    {clientProfile.industry || 'Not specified'}
                  </p>
                </div>
                
                {clientProfile.website && (
                  <div>
                    <label className={`${ds.typography.component.small} text-muted-foreground`}>
                      Website
                    </label>
                    <div className={ds.layout.flex.start}>
                      <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a 
                        href={clientProfile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {clientProfile.website}
                      </a>
                    </div>
                  </div>
                )}
                
                {clientProfile.company_size && (
                  <div>
                    <label className={`${ds.typography.component.small} text-muted-foreground`}>
                      Company Size
                    </label>
                    <p className={ds.typography.component.body}>
                      {clientProfile.company_size}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Account Security */}
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-3 sm:p-4">
                <Shield className="h-5 w-5" />
                Account Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className={`${ds.typography.component.small} text-muted-foreground`}>
                  Account Status
                </label>
                <div className={ds.layout.flex.start}>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className={`${ds.typography.component.small} text-muted-foreground`}>
                  Email Verified
                </label>
                <div className={ds.layout.flex.start}>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Verified
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className={`${ds.typography.component.small} text-muted-foreground`}>
                  Last Login
                </label>
                <p className={ds.typography.component.body}>
                  {new Date().toLocaleDateString()} (Current session)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Preferences */}
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>Contact Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className={`${ds.typography.component.small} text-muted-foreground`}>
                  Preferred Contact Method
                </label>
                <p className={ds.typography.component.body}>
                  Email & Chat
                </p>
              </div>
              
              <div>
                <label className={`${ds.typography.component.small} text-muted-foreground`}>
                  SMS Notifications
                </label>
                <div className={ds.layout.flex.start}>
                  <Badge variant={clientProfile?.phone ? "default" : "secondary"}>
                    {clientProfile?.phone ? "Enabled" : "Phone number required"}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className={`${ds.typography.component.small} text-muted-foreground`}>
                  Email Notifications
                </label>
                <div className={ds.layout.flex.start}>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Enabled
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader className="space-y-1">
            <CardTitle>Need to Update Your Information?</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <p className={`${ds.typography.component.body} mb-4`}>
              To update your profile information, please contact your account manager or use the chat feature to reach out to our team.
            </p>
            <div className={`${ds.layout.flex.start} text-sm text-muted-foreground`}>
              <User className="h-4 w-4 mr-2" />
              <span>
                Your account is managed by our team to ensure accuracy and security.
              </span>
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </PageLayout>
  )
}