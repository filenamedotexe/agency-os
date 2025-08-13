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
        <Tabs defaultValue="emails" className="w-full" data-testid="main-tabs">
          <div className="overflow-x-auto">
            <TabsList className="w-full sm:w-auto min-w-full sm:min-w-0 grid grid-cols-2 sm:inline-flex h-auto sm:h-10 p-1" data-testid="main-tabs-list">
              <TabsTrigger value="emails" className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-1.5" data-testid="tab-emails">
                <span className="hidden sm:inline">Email Management</span>
                <span className="sm:hidden">Email</span>
              </TabsTrigger>
              <TabsTrigger value="sms" className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-1.5" data-testid="tab-sms">
                <span className="hidden sm:inline">SMS Configuration</span>
                <span className="sm:hidden">SMS</span>
              </TabsTrigger>
              <TabsTrigger value="general" className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-1.5" data-testid="tab-general">
                <span className="hidden sm:inline">General Settings</span>
                <span className="sm:hidden">General</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-1.5" data-testid="tab-users">
                <span className="hidden sm:inline">User Management</span>
                <span className="sm:hidden">Users</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="emails" className="mt-4 sm:mt-6" data-testid="content-emails">
            <div className="space-y-4 sm:space-y-6">
              <div className="px-1">
                <h3 className="text-base sm:text-lg font-medium">Email Management</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  View email logs, preview templates, and send test emails
                </p>
              </div>
              
              <Tabs defaultValue="logs" className="w-full" data-testid="email-sub-tabs">
                <div className="overflow-x-auto">
                  <TabsList className="w-full sm:w-auto min-w-full sm:min-w-0 grid grid-cols-3 sm:inline-flex h-auto sm:h-10 p-1" data-testid="email-tabs-list">
                    <TabsTrigger value="logs" className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-1.5" data-testid="email-tab-logs">Logs</TabsTrigger>
                    <TabsTrigger value="templates" className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-1.5" data-testid="email-tab-templates">Templates</TabsTrigger>
                    <TabsTrigger value="test" className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-1.5" data-testid="email-tab-test">Test</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="logs" className="mt-4 sm:mt-6">
                  <div className="px-1">
                    <EmailLogsTable />
                  </div>
                </TabsContent>
                
                <TabsContent value="templates" className="mt-4 sm:mt-6">
                  <div className="px-1">
                    <EmailTemplatePreview />
                  </div>
                </TabsContent>
                
                <TabsContent value="test" className="mt-4 sm:mt-6">
                  <div className="px-1">
                    <TestEmailForm />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
          
          <TabsContent value="sms" className="mt-4 sm:mt-6">
            <div className="space-y-4 sm:space-y-6 px-1">
              <div>
                <h3 className="text-base sm:text-lg font-medium">SMS Configuration</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure Twilio integration for SMS messaging
                </p>
              </div>
              <div className="w-full">
                <SmsSettings />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="general" className="mt-4 sm:mt-6">
            <div className="space-y-4 sm:space-y-6 px-1">
              <div>
                <h3 className="text-base sm:text-lg font-medium">General Settings</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure general system settings
                </p>
              </div>
              <div className="rounded-lg border p-3 sm:p-6 bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  General settings will be added here in future updates.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="mt-4 sm:mt-6">
            <div className="space-y-4 sm:space-y-6 px-1">
              <div>
                <h3 className="text-base sm:text-lg font-medium">User Management</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage user accounts and permissions
                </p>
              </div>
              <div className="rounded-lg border p-3 sm:p-6 bg-muted/30">
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