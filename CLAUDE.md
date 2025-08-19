# CLAUDE.md - AgencyOS Development Guidelines

## Project Overview
AgencyOS is a comprehensive agency management platform built with Next.js 15, TypeScript, and Supabase. It provides role-based dashboards for admins, team members, and clients to manage services, projects, communication, and resources.

## Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Email**: Resend
- **SMS**: Twilio
- **Testing**: Playwright

## Development Principles

### 1. ALWAYS Use Real Data
- Never use mock data or demo modes
- Always connect to real database
- Fix issues at their source, not with workarounds

### 2. Mobile-First Responsive Design
- Test on all viewports: 320px, 768px, 1024px, 1920px
- Ensure all features work on mobile devices
- Use responsive utilities from Tailwind

### 3. Test Everything
- Run build before committing: `npm run build`
- Test all user roles and permissions
- Verify database operations work correctly

## Project Structure

```
/app
  /(auth)         # Public auth routes
  /(dashboard)    # Protected dashboard routes
    /admin        # Admin-only features
    /team         # Team member features
    /client       # Client portal
    /services     # Service/project management
    /messages     # Communication system
    /knowledge    # Knowledge base
  /actions        # Server actions
  /api           # API routes

/features         # Feature modules
  /auth          # Authentication
  /chat          # Messaging system
  /clients       # Client management
  /services      # Service management
  /dashboard     # Dashboard components

/shared          # Shared code
  /components    # Reusable UI components
  /hooks         # Custom React hooks
  /lib           # Utilities and helpers
```

## Core Features

### Authentication & Authorization
- Role-based access control (Admin, Team, Client)
- Secure authentication with Supabase Auth
- Automatic role-based redirects

### Client Management
- Client profiles and contact information
- Service assignment and tracking
- Direct messaging with clients

### Service Management
- Project creation and tracking
- Milestone and task management
- Kanban board view
- Timeline visualization

### Communication
- Real-time messaging system
- File attachments
- Email notifications via Resend
- SMS notifications via Twilio

### Knowledge Base
- Resource collections
- File uploads and management
- Document organization

## Key Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run lint            # Run linter

# Testing
npm run test            # Run Playwright tests
npm run test:ui         # Run tests with UI
npm run test:debug     # Debug tests

# Database Setup
psql $DATABASE_URL      # Connect to database
node scripts/setup-database.sql
node scripts/create-demo-users.js
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
DATABASE_URL=your_database_url
RESEND_API_KEY=your_resend_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

## Test Accounts

```
All use password: password123

Admin:    admin@demo.com
Team:     team@demo.com
Client:   sarah@acmecorp.com
```

## Common Patterns

### Server Actions
```typescript
export async function serverAction() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  
  // Your logic here
  return { data: result }
}
```

### Database Queries
```typescript
// Use maybeSingle() when record might not exist
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('id', id)
  .maybeSingle()

// Use single() only when certain
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('id', id)
  .single()
```

### Error Handling
```typescript
if (error) {
  console.error('Error:', error)
  return { error: error.message }
}
```

## Troubleshooting

### Clear Build Cache
```bash
rm -rf .next
rm -rf node_modules/.cache
npm run build
```

### Database Connection Issues
```bash
# Test connection
curl -X GET "YOUR_SUPABASE_URL/rest/v1/profiles?select=*&limit=1" \
  -H "apikey: YOUR_ANON_KEY"
```

### Check RLS Policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

## Development Checklist

Before committing:
- [ ] TypeScript builds without errors
- [ ] No console errors
- [ ] Responsive on all viewports
- [ ] Database operations work
- [ ] Tests pass

## Important Notes

1. **Always use absolute imports**: `@/` for imports
2. **Never commit secrets**: Use environment variables
3. **Test role-based access**: Verify permissions work
4. **Keep it simple**: Don't overcomplicate solutions
5. **Document changes**: Update this file when adding patterns