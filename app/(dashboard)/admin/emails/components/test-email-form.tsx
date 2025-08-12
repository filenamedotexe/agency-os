"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { sendTestEmail } from "@/app/actions/email"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form"
import { useToast } from "@/shared/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Mail, Send, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"

interface TestEmailFormData {
  template: string
  email: string
}

export function TestEmailForm() {
  const [sending, setSending] = useState(false)
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()
  
  const form = useForm<TestEmailFormData>({
    defaultValues: {
      template: "welcome",
      email: ""
    }
  })

  async function onSubmit(values: TestEmailFormData) {
    setSending(true)
    setLastResult(null)
    
    try {
      const result = await sendTestEmail(values.template, values.email)
      
      if (result.success) {
        setLastResult({
          success: true,
          message: `Test email sent successfully to ${values.email}`
        })
        toast({
          title: "Test email sent!",
          description: `Check ${values.email} inbox`,
        })
        form.reset({ template: values.template, email: "" })
      } else {
        setLastResult({
          success: false,
          message: typeof result.error === 'string' ? result.error : "Failed to send test email"
        })
        toast({
          title: "Failed to send test email",
          description: typeof result.error === 'string' ? result.error : "Unknown error occurred",
          variant: "destructive"
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setLastResult({
        success: false,
        message: errorMessage
      })
      toast({
        title: "Failed to send test email",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  const templateDescriptions: Record<string, string> = {
    welcome: "Welcome email with login instructions and next steps",
    milestone: "Milestone completion notification with project details",
    task: "Task assignment notification with priority and due date"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-3 sm:p-4">
            <Mail className="h-5 w-5" />
            <div>
              <CardTitle>Send Test Email</CardTitle>
              <CardDescription>
                Test any email template with sample data to verify formatting and delivery
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Template</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="welcome">
                          <div>
                            <div className="font-medium">Welcome Email</div>
                            <div className="text-sm text-muted-foreground">
                              Client onboarding message
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="milestone">
                          <div>
                            <div className="font-medium">Milestone Complete</div>
                            <div className="text-sm text-muted-foreground">
                              Project progress notification
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="task">
                          <div>
                            <div className="font-medium">Task Assigned</div>
                            <div className="text-sm text-muted-foreground">
                              Team task notification
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {form.watch("template") && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {templateDescriptions[form.watch("template")]}
                      </p>
                    )}
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                rules={{
                  required: "Email address is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="test@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                disabled={sending || !form.formState.isValid}
                className="w-full sm:w-auto gap-3 sm:p-4"
              >
                <Send className={`h-4 w-4 ${sending ? 'animate-pulse' : ''}`} />
                {sending ? "Sending..." : "Send Test Email"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Result Display */}
      {lastResult && (
        <Alert variant={lastResult.success ? "default" : "destructive"}>
          {lastResult.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {lastResult.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Tips */}
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-sm font-medium">Testing Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-1">
            <p className="text-muted-foreground">
              • Test emails use sample data (names, companies, dates)
            </p>
            <p className="text-muted-foreground">
              • Check your spam folder if emails don&apos;t arrive in inbox
            </p>
            <p className="text-muted-foreground">
              • All test emails are logged in the Email Logs tab
            </p>
            <p className="text-muted-foreground">
              • Use your own email address to verify formatting
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}