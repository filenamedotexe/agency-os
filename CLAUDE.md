# CLAUDE.md - AgencyOS Development Guidelines

## Project Overview
AgencyOS is a comprehensive agency management platform built with Next.js 15, TypeScript, and Supabase. It provides role-based dashboards for admins, team members, and clients to manage services, projects, communication, and resources with advanced features like service templates, smart date calculations, and assignee management.

## Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: Supabase Auth with role-based access control
- **Real-time**: Supabase Realtime for live updates
- **Email**: Resend API for transactional emails
- **SMS**: Twilio for SMS notifications
- **Testing**: Playwright for E2E testing
- **UI**: Responsive design with mobile-first approach

## Development Principles

### 1. ALWAYS Use Real Data
- Never use mock data or demo modes
- Always connect to real database
- Fix issues at their source, not with workarounds

### 2. Mobile-First Responsive Design
- Test on all viewports: 320px, 768px, 1024px, 1920px
- Ensure all features work on mobile devices
- Use responsive utilities from Tailwind

### 3. Type Safety First
- All components properly typed with TypeScript
- No `any` types in production code
- Proper error handling with typed responses

### 4. Role-Based Security
- All routes protected with proper role checks
- Server-side validation for all user actions
- Client-side UI restrictions based on user role

## Project Structure

```
/app
  /(auth)         # Public auth routes (login, signup)
  /(dashboard)    # Protected dashboard routes
    /admin        # Admin-only features and settings
    /team         # Team member dashboard and tools
    /client       # Client portal with limited access
    /services     # Service/project management (admin/team only)
    /messages     # Communication system
    /knowledge    # Knowledge base and resources
    /clients      # Client management (admin/team only)
  /actions        # Server actions for database operations
  /api           # API routes and webhooks

/features         # Feature modules
  /auth          # Authentication components and logic
  /chat          # Real-time messaging system
  /clients       # Client management features
  /services      # Service and project management
  /dashboard     # Dashboard widgets and components

/shared          # Shared code across features
  /components    # Reusable UI components
    /ui          # shadcn/ui component library
    /layout      # Layout components (sidebar, navigation)
  /contexts      # React contexts (service-context)
  /hooks         # Custom React hooks
  /lib           # Utilities and helpers
    /supabase    # Database client configurations
  /types         # TypeScript type definitions

/scripts         # Database and testing scripts
  /test-*        # E2E testing scripts for features
  /create-*      # Database setup and seeding scripts
  /seed-*        # Data seeding utilities

/supabase        # Database schema and migrations
  /migrations    # SQL migration files
```

## Core Features

### Authentication & Authorization
- **Role-based access control**: Admin, Team Member, Client roles
- **Secure authentication**: Supabase Auth with automatic redirects
- **Route protection**: Server-side role validation
- **Session management**: Persistent login with token refresh

### Client Management
- **Client profiles**: Complete contact information and company details
- **Service assignment**: Link clients to specific services and projects
- **Communication**: Direct messaging with file attachments
- **Access control**: Clients only see their assigned content

### Service & Project Management
- **Service templates**: Reusable project structures with smart dates
- **Milestone tracking**: Project phases with assignee management
- **Task management**: Detailed task tracking with priority and visibility
- **Kanban boards**: Visual project management for admin/team
- **Client timeline**: Simplified view for client users
- **Smart date system**: Relative date parsing ("1 week", "2 months")

### Service Template System
- **Template creation**: Save reusable service structures
- **Smart date calculations**: Automatic milestone and task date calculation
- **Template management**: Full CRUD operations for templates
- **Service generation**: Create services from templates with calculated dates
- **Role permissions**: Admin/team can manage, clients restricted

### Communication
- **Real-time messaging**: Live chat between users
- **File attachments**: Upload and share documents
- **Email notifications**: Automated emails via Resend
- **SMS notifications**: Optional SMS alerts via Twilio
- **Message history**: Persistent conversation threads

### Knowledge Base
- **Resource collections**: Organize documents and links by topic
- **File management**: Upload and categorize files
- **Access control**: Public, team, or private visibility levels
- **Search and organization**: Easy resource discovery

### Task Assignment System
- **Assignee management**: Assign milestones and tasks to team members
- **Visibility control**: Internal vs client-visible tasks
- **Progress tracking**: Real-time status updates
- **Timeline views**: Different perspectives for each role

## Key Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production (always test before commit)
npm run lint            # Run ESLint
npm run lint:fix        # Auto-fix linting issues

# Testing
npm run test            # Run Playwright E2E tests
npm run test:ui         # Run tests with browser UI
npm run test:debug     # Debug tests step-by-step

# Database Setup
psql $DATABASE_URL      # Connect to database directly
node scripts/setup-database.sql     # Initialize schema
node scripts/create-demo-users.js   # Create test users
node scripts/seed-default-templates.js  # Seed service templates

# E2E Testing (Service Templates)
node scripts/test-templates-complete-e2e.js  # Full template system test
node scripts/test-templates-admin-e2e.js     # Admin role testing
node scripts/test-templates-team-e2e.js      # Team member testing
node scripts/test-templates-client-e2e.js    # Client restriction testing
node scripts/test-smart-dates.js             # Smart date system testing
```

## Environment Variables

Required in `.env.local`:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_supabase_database_url

# Email Configuration (Resend)
RESEND_API_KEY=your_resend_api_key

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Optional: Error Monitoring
SENTRY_DSN=your_sentry_dsn
```

## Test Accounts

All accounts use password: `password123`

```bash
Admin:    admin@demo.com     # Full system access
Team:     team@demo.com      # Service and client management
Client:   sarah@acmecorp.com # Limited to assigned services
```

## Common Patterns

### Server Actions with Role Validation
```typescript
export async function createService(data: CreateServiceData) {
  // Always validate authentication and role
  const auth = await requireAuth(['admin', 'team_member'])
  if (isAuthError(auth)) return errorResponse(auth.error)
  
  const { supabase, user } = auth
  
  // Your business logic here
  const { data: service, error } = await supabase
    .from('services')
    .insert({ ...data, created_by: user.id })
    .select()
    .single()
  
  if (error) return errorResponse(error.message)
  return successResponse(service, 'Service created successfully')
}
```

### Database Queries with Proper Error Handling
```typescript
// Use maybeSingle() when record might not exist
const { data, error } = await supabase
  .from('services')
  .select('*, milestones(*)')
  .eq('id', serviceId)
  .maybeSingle()

// Use single() only when record must exist
const { data, error } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', userId)
  .single()

// Always handle errors properly
if (error) {
  console.error('Database error:', error)
  return { error: error.message }
}
```

### Component Props with Proper Types
```typescript
interface ServiceCardProps {
  service: ServiceWithMilestones
  showActions?: boolean
  onEdit?: (service: Service) => void
}

export function ServiceCard({ service, showActions = true, onEdit }: ServiceCardProps) {
  // Component implementation
}
```

### Service Template Creation
```typescript
// Create template from scratch
const templateData: CreateTemplateData = {
  name: 'Website Development',
  description: 'Complete website project template',
  color: 'blue',
  milestones: [
    {
      name: 'Discovery & Planning',
      position: 0,
      relative_start_days: '0 days',
      relative_due_days: '1 week',
      tasks: [
        {
          title: 'Client kickoff meeting',
          priority: 'high',
          estimated_hours: 2,
          position: 0,
          relative_due_days: '2 days',
          visibility: 'client'
        }
      ]
    }
  ]
}
```

### Smart Date Usage
```typescript
import { parseRelativeDateString, calculateMilestoneDate } from '@/shared/lib/smart-dates'

// Parse relative date strings
const parsed = parseRelativeDateString('2 weeks') // { amount: 2, unit: 'weeks', total_days: 14 }

// Calculate actual dates from service start
const milestoneDate = calculateMilestoneDate('2025-09-01', 14) // '2025-09-15'
```

## Database Schema

### Key Tables
- **profiles**: User accounts with role-based access
- **services**: Projects with client assignments
- **milestones**: Project phases with assignees
- **tasks**: Detailed work items with visibility control
- **service_templates**: Reusable project structures
- **template_milestones**: Template milestone definitions
- **template_tasks**: Template task definitions
- **conversations**: Message threads between users
- **knowledge_collections**: Resource organization
- **knowledge_resources**: Files and documents

### Row Level Security (RLS)
All tables use RLS policies to enforce role-based access:
- **Admin**: Full access to all data
- **Team Member**: Access to services and clients they manage
- **Client**: Access only to their assigned services and conversations

## Testing Strategy

### E2E Testing Coverage
```bash
# Complete template system testing
node scripts/test-templates-complete-e2e.js

# Role-specific testing
node scripts/test-templates-admin-e2e.js    # Admin permissions
node scripts/test-templates-team-e2e.js     # Team member permissions  
node scripts/test-templates-client-e2e.js   # Client restrictions

# Feature-specific testing
node scripts/test-smart-dates.js            # Date calculation system
node scripts/test-assignee-system.js        # Assignment functionality
```

### Testing Checklist
Before major releases, run:
- [ ] `npm run build` - Verify TypeScript compilation
- [ ] `npm run lint` - Check code quality
- [ ] E2E tests for all user roles
- [ ] Database migration testing
- [ ] Mobile responsive testing
- [ ] Role-based access verification

## Service Template System

### Smart Date Formats
The system supports flexible relative date inputs:
```typescript
// Supported formats
'0 days' | 'same day'     // Immediate start
'1 day' | 'next day'      // Tomorrow
'3 days'                  // 3 days later
'1 week' | '2 weeks'      // Week-based intervals
'1 month' | '2 months'    // Month-based intervals
```

### Template Structure
```typescript
// Service templates contain:
- Basic info (name, description, color)
- Milestones with relative timing
- Tasks with visibility and priority
- Smart date calculations
- Assignee compatibility
```

### Template Usage Workflow
1. **Create Template**: Design reusable service structure
2. **Configure Smart Dates**: Set relative timing for milestones/tasks
3. **Generate Service**: Create service from template with calculated dates
4. **Assign Team**: Assign milestones and tasks to team members
5. **Client Access**: Clients see timeline view with appropriate tasks

## Role-Based Features

### Admin Capabilities
- Full system access and configuration
- User management and role assignment
- Service template creation and management
- Email and SMS settings configuration
- All service and project management features

### Team Member Capabilities  
- Service and project management
- Client communication and support
- Template creation and usage
- Task and milestone management
- Limited to assigned or created content

### Client Capabilities
- View assigned services and projects
- Timeline view of project progress
- Access to client-visible tasks only
- Direct messaging with team
- Knowledge base access (public content)

## Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear all caches and rebuild
rm -rf .next node_modules/.cache
npm run build
```

#### Database Connection
```bash
# Test database connectivity
curl -X GET "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/profiles?select=*&limit=1" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

#### Role-Based Access Issues
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'service_templates';

-- Test user role
SELECT id, email, role FROM profiles WHERE email = 'admin@demo.com';
```

#### Template System Issues
```bash
# Verify templates exist
node scripts/seed-default-templates.js

# Test template backend
node scripts/test-template-actions.js
```

## Development Checklist

### Before Committing:
- [ ] `npm run build` passes without errors
- [ ] `npm run lint` shows no critical issues
- [ ] All user roles tested
- [ ] Mobile responsive verified
- [ ] Database operations work correctly
- [ ] No console errors in browser
- [ ] Smart date calculations accurate

### Before Production Deploy:
- [ ] Complete E2E test suite passes
- [ ] Role-based access controls verified
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Error monitoring enabled
- [ ] Performance tested under load

## Important Development Notes

### Code Quality Standards
1. **TypeScript**: All code must be properly typed, no `any` types
2. **Imports**: Always use absolute imports with `@/` prefix
3. **Security**: Never commit secrets, always use environment variables
4. **Testing**: Verify role-based access for all features
5. **Simplicity**: Prefer simple, maintainable solutions
6. **Documentation**: Update this file when adding new patterns

### Service Template Best Practices
1. **Smart Dates**: Use relative dates for flexible project timing
2. **Task Visibility**: Consider client vs internal task visibility
3. **Template Structure**: Design templates for reusability
4. **Role Permissions**: Test template access for all user roles
5. **Date Validation**: Ensure logical date sequences in templates

### Database Patterns
1. **RLS First**: Always implement Row Level Security
2. **Foreign Keys**: Maintain referential integrity
3. **Indexing**: Add indexes for commonly queried fields
4. **Transactions**: Use transactions for multi-table operations
5. **Validation**: Implement both client and server-side validation

This file should be updated whenever new patterns, features, or conventions are added to the codebase.