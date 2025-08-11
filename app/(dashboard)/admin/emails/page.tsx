import { redirect } from "next/navigation"
import { createClient } from "@/shared/lib/supabase/server"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { EmailLogsTable } from "./components/email-logs-table"
import { EmailTemplatePreview } from "./components/email-template-preview"
import { TestEmailForm } from "./components/test-email-form"
import { PageLayout, PageHeader, PageContent } from "@/shared/components/layout/page-layout"

export default async function EmailManagementPage() {
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
        title="Email Management"
        subtitle="View email logs, preview templates, and send test emails"
      />
      
      <PageContent>
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
      </PageContent>
    </PageLayout>
  )
}