// Simple test to verify email service setup
require('dotenv').config({ path: '.env.local' })

async function testEmailService() {
  console.log('Testing email service configuration...\n')
  
  // Check environment variables
  console.log('Environment Variables:')
  console.log('✓ RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set' : '❌ Missing')
  console.log('✓ RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || '❌ Missing')
  console.log('✓ NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || '❌ Missing')
  
  // Test Resend connection
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    console.log('\nTesting Resend connection...')
    
    // This should not actually send an email, just test the connection
    const testResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: 'test@example.com', // This will fail but should show connection works
      subject: 'Test Connection',
      text: 'This is a test'
    })
    
    console.log('❌ Unexpected success - email should have failed')
    
  } catch (error) {
    if (error.message.includes('test@example.com')) {
      console.log('✓ Resend connection working (failed as expected on test email)')
    } else if (error.message.includes('API key')) {
      console.log('❌ Invalid API key')
    } else {
      console.log('❌ Connection error:', error.message)
    }
  }
  
  console.log('\n✅ Email service test complete!')
}

testEmailService().catch(console.error)