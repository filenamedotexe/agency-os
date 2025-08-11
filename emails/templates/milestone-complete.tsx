import { Text, Button } from '@react-email/components'
import { EmailLayout } from '../components/layout'

interface MilestoneCompleteEmailProps {
  clientName: string
  milestoneName: string
  serviceName: string
  nextSteps?: string
  dashboardUrl: string
}

export function MilestoneCompleteEmail({
  clientName,
  milestoneName,
  serviceName,
  nextSteps,
  dashboardUrl
}: MilestoneCompleteEmailProps) {
  return (
    <EmailLayout>
      <Text style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
        Milestone Complete! ✅
      </Text>
      
      <Text style={{ fontSize: '16px', lineHeight: '24px', marginBottom: '24px' }}>
        Hi {clientName},
      </Text>

      <Text style={{ fontSize: '16px', lineHeight: '24px', marginBottom: '24px' }}>
        Great news! We've completed <strong>{milestoneName}</strong> for your{' '}
        <strong>{serviceName}</strong> project.
      </Text>

      {nextSteps && (
        <>
          <Text style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
            What's Next:
          </Text>
          <Text style={{ fontSize: '16px', lineHeight: '24px', marginBottom: '24px' }}>
            {nextSteps}
          </Text>
        </>
      )}

      <Button
        href={dashboardUrl}
        style={{
          backgroundColor: '#10b981',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '6px',
          textDecoration: 'none',
          display: 'inline-block',
          fontWeight: 'bold',
        }}
      >
        View Progress
      </Button>

      <Text style={{ fontSize: '14px', color: '#6b7280', marginTop: '32px' }}>
        Your team will reach out soon with next steps. Feel free to reply with any questions!
      </Text>
    </EmailLayout>
  )
}