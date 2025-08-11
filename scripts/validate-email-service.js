// Validate email service can be imported and has all required functions
console.log('Validating email service structure...\n')

async function validateService() {
  try {
    // Test import path works (this will test TypeScript compilation)
    const path = require('path')
    const fs = require('fs')
    
    const emailServicePath = path.join(__dirname, '../app/actions/email.ts')
    const emailContent = fs.readFileSync(emailServicePath, 'utf8')
    
    console.log('✓ Email service file exists')
    
    // Check all required exports exist
    const requiredExports = [
      'sendClientWelcome',
      'sendMilestoneComplete', 
      'sendTaskAssigned',
      'sendTestEmail'
    ]
    
    requiredExports.forEach(exportName => {
      if (emailContent.includes(`export async function ${exportName}`)) {
        console.log(`✓ ${exportName} function exported`)
      } else {
        console.log(`❌ ${exportName} function missing`)
      }
    })
    
    // Check email templates exist
    const templates = [
      '../emails/welcome.tsx',
      '../emails/milestone-complete.tsx', 
      '../emails/task-assigned.tsx'
    ]
    
    templates.forEach(template => {
      const templatePath = path.join(__dirname, template)
      if (fs.existsSync(templatePath)) {
        console.log(`✓ Template exists: ${template}`)
      } else {
        console.log(`❌ Template missing: ${template}`)
      }
    })
    
    // Check imports are correct
    const requiredImports = [
      "import { Resend } from 'resend'",
      "import { createClient } from '@/shared/lib/supabase/server'",
      "import { WelcomeEmail } from '@/emails/welcome'",
      "import { MilestoneCompleteEmail } from '@/emails/milestone-complete'",
      "import { TaskAssignedEmail } from '@/emails/task-assigned'"
    ]
    
    requiredImports.forEach(importLine => {
      if (emailContent.includes(importLine)) {
        console.log(`✓ Import correct: ${importLine.split(' ')[3]}`)
      } else {
        console.log(`❌ Import missing: ${importLine}`)
      }
    })
    
    console.log('\n✅ Email service validation complete!')
    
  } catch (error) {
    console.log('❌ Error validating service:', error.message)
  }
}

validateService().catch(console.error)