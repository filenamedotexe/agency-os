"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { useToast } from '@/shared/hooks/use-toast'
import { Eye, EyeOff, Phone, CheckCircle, XCircle } from 'lucide-react'
import { formatPhoneForDisplay } from '@/shared/lib/phone-utils'

interface SmsSettings {
  phone_number: string
  account_sid: string
  auth_token: string
}

export function SmsSettings() {
  const [settings, setSettings] = useState<SmsSettings>({
    phone_number: '',
    account_sid: '',
    auth_token: ''
  })
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown')
  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/sms-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || {
          phone_number: '',
          account_sid: '',
          auth_token: ''
        })
      }
    } catch (error) {
      console.error('Error loading SMS settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/sms-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "SMS configuration has been updated successfully."
        })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save SMS settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    setConnectionStatus('unknown')
    
    try {
      const response = await fetch('/api/admin/sms-settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        setConnectionStatus('success')
        toast({
          title: "Connection successful",
          description: "Twilio configuration is working correctly."
        })
      } else {
        setConnectionStatus('error')
        toast({
          title: "Connection failed",
          description: result.error || "Unable to connect to Twilio.",
          variant: "destructive"
        })
      }
    } catch {
      setConnectionStatus('error')
      toast({
        title: "Test failed",
        description: "Error testing Twilio connection.",
        variant: "destructive"
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse">Loading SMS settings...</div>
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-3 sm:p-4">
          <Phone className="h-5 w-5" />
          SMS Configuration
        </CardTitle>
        <CardDescription>
          Configure Twilio integration for receiving and sending SMS messages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              value={formatPhoneForDisplay(settings.phone_number)}
              onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="account_sid">Twilio Account SID</Label>
            <Input
              id="account_sid"
              value={settings.account_sid}
              onChange={(e) => setSettings({ ...settings, account_sid: e.target.value })}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="auth_token">Auth Token</Label>
            <div className="relative">
              <Input
                id="auth_token"
                type={showToken ? 'text' : 'password'}
                value={settings.auth_token}
                onChange={(e) => setSettings({ ...settings, auth_token: e.target.value })}
                placeholder="••••••••••••••••••••••••••••••••"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 sm:px-4"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-3 sm:p-4">
            {connectionStatus === 'success' && (
              <div className="flex items-center gap-3 sm:p-4 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Connected</span>
              </div>
            )}
            {connectionStatus === 'error' && (
              <div className="flex items-center gap-3 sm:p-4 text-red-600">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">Connection failed</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 sm:p-4">
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={testing || !settings.account_sid || !settings.auth_token}
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}