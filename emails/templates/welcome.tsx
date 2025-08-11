import { Text, Button, Link } from '@react-email/components'
import { EmailLayout } from '../components/layout'

interface WelcomeEmailProps {
  firstName: string
  companyName?: string
  loginUrl: string
}

export function WelcomeEmail({ firstName, companyName, loginUrl }: WelcomeEmailProps) {
  return (
    <EmailLayout>
      <Text style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
        Welcome to AgencyOS, {firstName}! 🎉
      </Text>
      
      <Text style={{ fontSize: '16px', lineHeight: '24px', marginBottom: '24px' }}>
        {companyName && `We're excited to have ${companyName} onboard! `}
        Your account has been set up and you're ready to start collaborating with our team.
      </Text>

      <Text style={{ fontSize: '16px', marginBottom: '24px' }}>
        Here's what you can do next:
      </Text>

      <ul style={{ fontSize: '16px', lineHeight: '24px', marginBottom: '24px' }}>
        <li>View your active projects and milestones</li>
        <li>Track progress in real-time</li>
        <li>Communicate directly with your team</li>
        <li>Access all project files and deliverables</li>
      </ul>

      <Button
        href={loginUrl}
        style={{
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '6px',
          textDecoration: 'none',
          display: 'inline-block',
          fontWeight: 'bold',
        }}
      >
        Access Your Dashboard
      </Button>

      <Text style={{ fontSize: '14px', color: '#6b7280', marginTop: '32px' }}>
        Need help? Reply to this email or visit our{' '}
        <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/support`} style={{ color: '#3b82f6' }}>
          support center
        </Link>
      </Text>
    </EmailLayout>
  )
}