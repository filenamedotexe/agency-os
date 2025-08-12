import { redirect } from "next/navigation"
import { createClient } from "@/shared/lib/supabase/server"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { EmailLogsTable } from "../emails/components/email-logs-table"
import { EmailTemplatePreview } from "../emails/components/email-template-preview"
import { TestEmailForm } from "../emails/components/test-email-form"
import { SmsSettings } from "./components/sms-settings"
import { PageLayout, PageHeader, PageContent } from "@/shared/components/layout/page-layout"

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  
  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()
    
  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <PageLayout>
      <PageHeader
        title="Settings"
        subtitle="Manage system configuration and preferences"
      />
      
      <PageContent>
        <Tabs defaultValue="emails" className="w-full">
          <TabsList>
            <TabsTrigger value="emails">Email Management</TabsTrigger>
            <TabsTrigger value="sms">SMS Configuration</TabsTrigger>
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="emails" className="mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Email Management</h3>
                <p className="text-sm text-muted-foreground">
                  View email logs, preview templates, and send test emails
                </p>
              </div>
              
              <Tabs defaultValue="logs" className="w-full">
                <TabsList>
                  <TabsTrigger value="logs">Email Logs</TabsTrigger>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                  <TabsTrigger value="test">Send Test</TabsTrigger>
                </TabsList>
                
                <TabsContent value="logs" className="mt-6">
                  <EmailLogsTable />
                </TabsContent>
                
                <TabsContent value="templates" className="mt-6">
                  <EmailTemplatePreview />
                </TabsContent>
                
                <TabsContent value="test" className="mt-6">
                  <TestEmailForm />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
          
          <TabsContent value="sms" className="mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">SMS Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Configure Twilio integration for SMS messaging
                </p>
              </div>
              <SmsSettings />
            </div>
          </TabsContent>
          
          <TabsContent value="general" className="mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">General Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Configure general system settings
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <p className="text-sm text-muted-foreground">
                  General settings will be added here in future updates.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">User Management</h3>
                <p className="text-sm text-muted-foreground">
                  Manage user accounts and permissions
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <p className="text-sm text-muted-foreground">
                  User management features will be added here in future updates.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PageContent>
    </PageLayout>
  )
}