"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Switch } from "@/shared/components/ui/switch"
import { Button } from "@/shared/components/ui/button"
import { Eye, Code, Mail, CheckCircle, FileText, RefreshCw, AlertCircle } from "lucide-react"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { getEmailTemplates, toggleTemplateStatus, type EmailTemplate } from "@/app/actions/email"
import { useToast } from "@/shared/hooks/use-toast"
import { Skeleton } from "@/shared/components/ui/skeleton"

export function EmailTemplatePreview() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchTemplates = async () => {
    setLoading(true)
    const { templates: data, error } = await getEmailTemplates()
    
    if (error) {
      toast({
        title: "Error loading templates",
        description: error,
        variant: "destructive"
      })
    } else if (data) {
      setTemplates(data)
      if (!selectedTemplate && data.length > 0) {
        setSelectedTemplate(data[0].slug)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchTemplates()
    setRefreshing(false)
  }

  const handleToggle = async (templateId: string, currentStatus: boolean) => {
    setToggling(templateId)
    const { success, error } = await toggleTemplateStatus(templateId, !currentStatus)
    
    if (success) {
      toast({
        title: "Status updated",
        description: `Template is now ${!currentStatus ? 'active' : 'inactive'}`,
      })
      // Update local state
      setTemplates(prev => prev.map(t => 
        t.id === templateId ? { ...t, is_active: !currentStatus } : t
      ))
    } else if (error) {
      toast({
        title: "Error updating status",
        description: error,
        variant: "destructive"
      })
    }
    setToggling(null)
  }

  const currentTemplate = templates.find(t => t.slug === selectedTemplate)

  // Function to get icon based on trigger event
  const getIcon = (triggerEvent: string | null) => {
    switch (triggerEvent) {
      case 'client_created':
        return Mail
      case 'milestone_completed':
        return CheckCircle
      case 'task_assigned':
        return FileText
      default:
        return Mail
    }
  }

  // Function to render template preview with replaced variables
  const renderTemplatePreview = (template: EmailTemplate) => {
    let htmlContent = template.html_content
    
    // Default values for preview
    const previewData: Record<string, string> = {
      first_name: "John",
      last_name: "Doe",
      company_name: "Acme Corporation",
      dashboard_url: "https://app.agencyos.dev/dashboard",
      milestone_name: "Design Phase Complete",
      service_name: "Website Redesign",
      next_steps: "Development phase begins next week with initial setup and architecture planning.",
      assignee_name: "Mike",
      task_title: "Review design mockups",
      task_description: "Please review the latest design mockups for the homepage and provide feedback on the user flow and visual hierarchy.",
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      priority: "HIGH",
      priority_color: "#ef4444",
      task_url: "https://app.agencyos.dev/tasks/sample-task"
    }
    
    // Replace variables in template
    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g")
      htmlContent = htmlContent.replace(regex, value)
    })
    
    return htmlContent
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No email templates found</p>
          <p className="text-sm text-muted-foreground">Templates will appear here once configured</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Email Templates</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template) => {
          const Icon = getIcon(template.trigger_event)
          return (
            <Card
              key={template.id}
              className={`cursor-pointer transition-colors ${
                selectedTemplate === template.slug
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-accent"
              }`}
              onClick={() => setSelectedTemplate(template.slug)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 sm:p-4">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium">
                        {template.name}
                      </CardTitle>
                      <div className="flex items-center gap-3 sm:p-4 mt-1">
                        <Badge 
                          variant={template.is_active ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {template.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={template.is_active}
                    disabled={toggling === template.id}
                    onCheckedChange={(checked) => {
                      handleToggle(template.id, template.is_active)
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-2">
                  {template.description}
                </p>
                {template.trigger_event && (
                  <p className="text-xs text-muted-foreground">
                    <strong>Trigger:</strong> {template.trigger_event.replace(/_/g, ' ')}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Template Preview */}
      {currentTemplate && (
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 sm:p-4">
                  {React.createElement(getIcon(currentTemplate.trigger_event), { className: "h-5 w-5" })}
                  {currentTemplate.name}
                </CardTitle>
                <CardDescription>
                  Preview with sample data
                </CardDescription>
              </div>
              <Badge variant={currentTemplate.is_active ? "default" : "secondary"}>
                {currentTemplate.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <Tabs defaultValue="preview" className="w-full">
              <TabsList>
                <TabsTrigger value="preview" className="gap-3 sm:p-4">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="variables" className="gap-3 sm:p-4">
                  <Code className="h-4 w-4" />
                  Variables
                </TabsTrigger>
                <TabsTrigger value="subject" className="gap-3 sm:p-4">
                  <Mail className="h-4 w-4" />
                  Subject
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="mt-4">
                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="h-[500px]">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: renderTemplatePreview(currentTemplate)
                      }}
                    />
                  </ScrollArea>
                </div>
              </TabsContent>
              
              <TabsContent value="variables" className="mt-4">
                <Card>
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-sm">Template Variables</CardTitle>
                    <CardDescription>
                      These variables are replaced with actual data when the email is sent
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3">
                      {currentTemplate.variables.map((variable, index) => (
                        <div key={index} className="flex items-start gap-3 sm:p-4 p-3 sm:p-4 bg-muted rounded-lg">
                          <code className="text-sm font-mono text-primary">
                            {`{{${variable.key}}}`}
                          </code>
                          <span className="text-sm text-muted-foreground">
                            {variable.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="subject" className="mt-4">
                <Card>
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-sm">Email Subject</CardTitle>
                    <CardDescription>
                      The subject line with variables
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      <div className="p-3 sm:p-4 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Template:</p>
                        <code className="text-sm font-mono">{currentTemplate.subject}</code>
                      </div>
                      <div className="p-3 sm:p-4 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Preview:</p>
                        <p className="text-sm">
                          {currentTemplate.subject.replace(/{{(\w+)}}/g, (match, key) => {
                            const previewValues: Record<string, string> = {
                              first_name: "John",
                              milestone_name: "Design Phase Complete",
                              task_title: "Review design mockups"
                            }
                            return previewValues[key] || match
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Template Info */}
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-sm font-medium">Template Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-1">
            <p className="text-muted-foreground flex items-center gap-3 sm:p-4">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Templates are stored in the database and can be edited
            </p>
            <p className="text-muted-foreground flex items-center gap-3 sm:p-4">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Variables are automatically replaced with actual data
            </p>
            <p className="text-muted-foreground flex items-center gap-3 sm:p-4">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Active/Inactive status controls whether emails are sent
            </p>
            <p className="text-muted-foreground flex items-center gap-3 sm:p-4">
              <CheckCircle className="h-4 w-4 text-green-500" />
              All email sends are logged in the database
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Import React at the top level for createElement
import React from 'react'