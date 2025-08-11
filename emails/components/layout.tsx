import { Html, Body, Container, Section, Text, Link, Hr } from '@react-email/components'

export function EmailLayout({ children }: { children: React.ReactNode }) {
  return (
    <Html>
      <Body style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#f9fafb',
        margin: 0,
        padding: 0,
      }}>
        <Container style={{
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          overflow: 'hidden',
          marginTop: '20px',
          marginBottom: '20px',
        }}>
          {/* Header */}
          <Section style={{
            backgroundColor: '#18181b',
            padding: '20px',
            textAlign: 'center' as const,
          }}>
            <Text style={{
              color: '#ffffff',
              fontSize: '24px',
              fontWeight: 'bold',
              margin: 0,
            }}>
              AgencyOS
            </Text>
          </Section>

          {/* Content */}
          <Section style={{ padding: '32px' }}>
            {children}
          </Section>

          {/* Footer */}
          <Hr style={{ borderColor: '#e5e7eb', margin: '32px 0' }} />
          <Section style={{ padding: '0 32px 32px', textAlign: 'center' as const }}>
            <Text style={{ color: '#6b7280', fontSize: '14px' }}>
              © 2025 AgencyOS. All rights reserved.
            </Text>
            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications`}
              style={{ color: '#3b82f6', fontSize: '14px' }}
            >
              Manage email preferences
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}