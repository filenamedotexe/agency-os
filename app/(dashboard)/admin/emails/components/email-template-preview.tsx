"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Eye, Code, Mail, CheckCircle, FileText } from "lucide-react"
import { ScrollArea } from "@/shared/components/ui/scroll-area"

export function EmailTemplatePreview() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("welcome")

  const templates = [
    {
      id: "welcome",
      name: "Welcome Email",
      description: "Sent when a new client account is created",
      trigger: "Client profile creation",
      icon: Mail,
      status: "Active",
      sampleData: {
        firstName: "John",
        companyName: "Acme Corporation",
        loginUrl: "https://app.agencyos.dev/login"
      }
    },
    {
      id: "milestone",
      name: "Milestone Complete",
      description: "Sent when a project milestone is marked as complete",
      trigger: "Milestone status change to 'complete'",
      icon: CheckCircle,
      status: "Active",
      sampleData: {
        clientName: "Sarah",
        milestoneName: "Design Phase Complete",
        serviceName: "Website Redesign",
        nextSteps: "Development phase begins next week with initial setup and architecture planning.",
        dashboardUrl: "https://app.agencyos.dev/dashboard"
      }
    },
    {
      id: "task",
      name: "Task Assigned",
      description: "Sent when a task is assigned to a team member",
      trigger: "Task assignment to team member",
      icon: FileText,
      status: "Active",
      sampleData: {
        assigneeName: "Mike",
        taskTitle: "Review design mockups",
        taskDescription: "Please review the latest design mockups for the homepage and provide feedback on the user flow and visual hierarchy.",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        priority: "high",
        serviceName: "Website Redesign",
        taskUrl: "https://app.agencyos.dev/tasks/sample-task"
      }
    }
  ]

  const currentTemplate = templates.find(t => t.id === selectedTemplate)

  // Mock HTML preview for each template
  const getTemplatePreview = (templateId: string) => {
    switch (templateId) {
      case "welcome":
        return `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #18181b; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0;">AgencyOS</h1>
              </div>
              <div style="padding: 32px;">
                <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">Welcome to AgencyOS, John! 🎉</h2>
                <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                  We're excited to have Acme Corporation onboard! Your account has been set up and you're ready to start collaborating with our team.
                </p>
                <p style="font-size: 16px; margin-bottom: 24px;">Here's what you can do next:</p>
                <ul style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                  <li>View your active projects and milestones</li>
                  <li>Track progress in real-time</li>
                  <li>Communicate directly with your team</li>
                  <li>Access all project files and deliverables</li>
                </ul>
                <a href="#" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">
                  Access Your Dashboard
                </a>
              </div>
            </div>
          </div>
        `
      case "milestone":
        return `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #18181b; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0;">AgencyOS</h1>
              </div>
              <div style="padding: 32px;">
                <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">Milestone Complete! ✅</h2>
                <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">Hi Sarah,</p>
                <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                  Great news! We've completed <strong>Design Phase Complete</strong> for your <strong>Website Redesign</strong> project.
                </p>
                <p style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">What's Next:</p>
                <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                  Development phase begins next week with initial setup and architecture planning.
                </p>
                <a href="#" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">
                  View Progress
                </a>
              </div>
            </div>
          </div>
        `
      case "task":
        return `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #18181b; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0;">AgencyOS</h1>
              </div>
              <div style="padding: 32px;">
                <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">New Task Assigned 📋</h2>
                <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">Hi Mike,</p>
                <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">You've been assigned a new task:</p>
                <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
                  <h3 style="font-size: 18px; font-weight: bold; margin: 0 0 8px 0;">Review design mockups</h3>
                  <p style="font-size: 14px; margin: 0 0 12px 0;">Please review the latest design mockups for the homepage and provide feedback on the user flow and visual hierarchy.</p>
                  <div style="font-size: 14px;">
                    <div style="margin-bottom: 4px;"><strong>Project:</strong> Website Redesign</div>
                    <div style="margin-bottom: 4px;"><strong>Due:</strong> ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
                    <div><strong>Priority:</strong> <span style="color: #ef4444; font-weight: bold;">HIGH</span></div>
                  </div>
                </div>
                <a href="#" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">
                  View Task Details
                </a>
              </div>
            </div>
          </div>
        `
      default:
        return "<p>Template preview not available</p>"
    }
  }

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template) => {
          const Icon = template.icon
          return (
            <Card
              key={template.id}
              className={`cursor-pointer transition-colors ${
                selectedTemplate === template.id
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-accent"
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {template.name}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {template.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-2">
                  {template.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Trigger:</strong> {template.trigger}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Template Preview */}
      {currentTemplate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <currentTemplate.icon className="h-5 w-5" />
                  {currentTemplate.name}
                </CardTitle>
                <CardDescription>
                  Preview of the email template with sample data
                </CardDescription>
              </div>
              <Badge variant="secondary">{currentTemplate.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="preview" className="w-full">
              <TabsList>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="data" className="gap-2">
                  <Code className="h-4 w-4" />
                  Sample Data
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="mt-4">
                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="h-[500px]">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: getTemplatePreview(selectedTemplate)
                      }}
                    />
                  </ScrollArea>
                </div>
              </TabsContent>
              
              <TabsContent value="data" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Sample Template Data</CardTitle>
                    <CardDescription>
                      This data is used when generating the template preview
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                      {JSON.stringify(currentTemplate.sampleData, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Template Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Template Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm space-y-1">
            <p className="text-muted-foreground">
              • Templates are built with React Email components for consistent styling
            </p>
            <p className="text-muted-foreground">
              • All templates are mobile-responsive and tested across email clients
            </p>
            <p className="text-muted-foreground">
              • Templates automatically include unsubscribe links and branding
            </p>
            <p className="text-muted-foreground">
              • Sample data shown here is used for testing and previews only
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}