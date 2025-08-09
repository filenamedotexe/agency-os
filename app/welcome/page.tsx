import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

export default async function WelcomePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // If user is already logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="max-w-md w-full mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-green-600">
            <CheckCircle className="h-full w-full" />
          </div>
          <CardTitle className="text-2xl">Welcome to AgencyOS!</CardTitle>
          <CardDescription className="mt-2">
            Your email has been verified successfully. You can now log in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-medium mb-2">What's next?</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Log in with your email and password</li>
              <li>• Complete your profile information</li>
              <li>• Explore your dashboard and features</li>
              <li>• Connect with your account manager</li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-2">
            <Link href="/login" className="w-full">
              <Button className="w-full">
                Go to Login
              </Button>
            </Link>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            Need help? Contact support at{" "}
            <a href="mailto:support@agencyos.dev" className="underline">
              support@agencyos.dev
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}