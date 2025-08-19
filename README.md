# AgencyOS

A comprehensive, production-ready agency management platform built with Next.js 15, TypeScript, and Supabase. Features advanced service templates, smart date calculations, role-based access control, and real-time collaboration tools.

## 🚀 Features

### 🎯 **Multi-Role Dashboard System**
- **Admin Dashboard** - Complete system control and analytics
- **Team Dashboard** - Project management and client communication
- **Client Portal** - Simplified project timeline and task visibility

### 📊 **Advanced Service & Project Management**
- **Service Templates** - Reusable project structures with smart date calculations
- **Milestone Tracking** - Project phases with assignee management
- **Task Management** - Detailed work items with priority and visibility control
- **Kanban Boards** - Visual project management for admin/team users
- **Client Timeline** - Simplified progress view for clients
- **Smart Date System** - Relative date parsing ("1 week", "2 months", etc.)

### 👥 **Client Management**
- **Complete Client Profiles** - Contact info, company details, and preferences
- **Service Assignment** - Link clients to specific projects and services
- **Access Control** - Clients only see their assigned content
- **Communication Hub** - Direct messaging with team members

### 💬 **Real-time Communication**
- **Live Messaging** - Real-time chat between all users
- **File Attachments** - Upload and share documents in conversations
- **Email Notifications** - Automated emails via Resend API
- **SMS Alerts** - Optional SMS notifications via Twilio
- **Message History** - Persistent conversation threads

### 📚 **Knowledge Base & Resources**
- **Resource Collections** - Organize documents and links by topic
- **File Management** - Upload and categorize files with metadata
- **Access Levels** - Public, team-only, or private visibility
- **Search & Discovery** - Easy resource finding and organization

### 🔒 **Security & Access Control**
- **Role-Based Access Control (RBAC)** - Admin, Team Member, Client roles
- **Row Level Security (RLS)** - Database-level access enforcement
- **Route Protection** - Server-side role validation
- **Data Isolation** - Users only access their permitted data

### 📱 **Mobile-First Design**
- **Responsive UI** - Works seamlessly on mobile, tablet, and desktop
- **Touch-Friendly** - Optimized for mobile interactions
- **Progressive Enhancement** - Core functionality works on all devices

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Styling**: Tailwind CSS, shadcn/ui component library
- **Forms**: React Hook Form with Zod validation
- **Testing**: Playwright for comprehensive E2E testing
- **Email**: Resend API for transactional emails
- **SMS**: Twilio for SMS notifications
- **Deployment**: Vercel-ready with edge functions

## 🎬 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Resend account (for email features)
- Twilio account (for SMS features)

### Quick Setup

1. **Clone and install:**
```bash
git clone [repository-url]
cd final-agency
npm install
```

2. **Environment setup:**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
DATABASE_URL=your_database_connection_string

# Email (Resend)
RESEND_API_KEY=your_resend_key

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number
```

3. **Database setup:**
```bash
# Initialize database schema
psql $DATABASE_URL < scripts/setup-database.sql

# Create demo users and data
node scripts/create-demo-users.js
node scripts/seed-default-templates.js
```

4. **Start development:**
```bash
npm run dev
```

Visit `http://localhost:3000` and login with demo accounts.

## 🧪 Testing

### Demo Accounts
```
Admin:    admin@demo.com        (Full system access)
Team:     team@demo.com         (Service management)
Client:   sarah@acmecorp.com    (Assigned services only)
Password: password123 (for all accounts)
```

### E2E Testing Suite
```bash
# Complete template system testing
node scripts/test-templates-complete-e2e.js

# Role-specific testing
node scripts/test-templates-admin-e2e.js     # Admin capabilities
node scripts/test-templates-team-e2e.js      # Team member permissions
node scripts/test-templates-client-e2e.js    # Client restrictions

# Feature testing
node scripts/test-smart-dates.js             # Smart date calculations
node scripts/test-assignee-system.js         # Task assignment system

# Run Playwright test suite
npm run test                                 # All E2E tests
npm run test:ui                             # With browser UI
```

## 📋 Service Template System

### Smart Date Formats
```typescript
// Supported relative date formats:
'0 days' | 'same day'     // Start immediately
'1 day' | 'next day'      // Tomorrow
'3 days'                  // 3 days from anchor
'1 week' | '2 weeks'      // Week-based scheduling
'1 month' | '2 months'    // Month-based planning
```

### Template Usage Workflow
1. **Create Template** - Design reusable service structure
2. **Smart Dates** - Configure relative timing for milestones/tasks
3. **Generate Service** - Create projects with auto-calculated dates
4. **Assign Team** - Assign milestones/tasks to team members
5. **Client Access** - Clients see appropriate timeline view

### Default Templates Included
- **Website Development** - Complete web project workflow
- **Digital Marketing Campaign** - Marketing project structure
- **Mobile App Development** - App development lifecycle
- **Strategic Consulting** - Consulting engagement framework

## 🏗 Architecture

### Role-Based Architecture
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    ADMIN    │  │    TEAM     │  │   CLIENT    │
│             │  │             │  │             │
│ • All access│  │ • Services  │  │ • Timeline  │
│ • Settings  │  │ • Clients   │  │ • Messages  │
│ • Templates │  │ • Templates │  │ • Tasks     │
│ • Users     │  │ • Tasks     │  │ • Files     │
└─────────────┘  └─────────────┘  └─────────────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
              ┌─────────────────┐
              │   SUPABASE      │
              │                 │
              │ • Auth + RLS    │
              │ • Database      │
              │ • Realtime      │
              │ • Storage       │
              └─────────────────┘
```

### Database Schema
- **profiles** - User accounts with role-based access
- **services** - Projects with client assignments
- **milestones** - Project phases with assignees
- **tasks** - Work items with visibility control
- **service_templates** - Reusable project structures
- **conversations** - Message threads
- **knowledge_collections** - Resource organization

## 🚀 Deployment

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Database Migrations
```bash
# Apply migrations to production database
psql $PRODUCTION_DATABASE_URL < supabase/migrations/[migration-file].sql
```

## 🛠 Development

### Development Workflow
```bash
# Start development server
npm run dev

# Run TypeScript check
npm run build

# Fix linting issues
npm run lint:fix

# Run E2E tests
npm run test
```

### Adding New Features
1. **Plan**: Document in CLAUDE.md if significant
2. **Implement**: Follow existing patterns and TypeScript standards
3. **Test**: Create E2E tests for new functionality
4. **Security**: Verify role-based access controls
5. **Document**: Update README.md and CLAUDE.md

### Code Quality Standards
- **TypeScript**: No `any` types, proper interface definitions
- **Security**: Role-based access for all features
- **Testing**: E2E test coverage for critical workflows
- **Performance**: Mobile-optimized, fast loading
- **Accessibility**: WCAG compliant UI components

## 📁 Project Structure

```
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Public authentication
│   ├── (dashboard)/             # Protected application
│   │   ├── admin/              # Admin-only pages
│   │   ├── team/               # Team member pages
│   │   ├── client/             # Client portal
│   │   ├── services/           # Service management
│   │   ├── messages/           # Communication
│   │   └── knowledge/          # Knowledge base
│   ├── actions/                # Server actions
│   └── api/                   # API endpoints
├── features/                   # Feature modules
│   ├── auth/                  # Authentication
│   ├── chat/                  # Messaging system
│   ├── clients/               # Client management
│   └── services/              # Service management
├── shared/                    # Shared code
│   ├── components/           # UI components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                # Utilities
│   └── types/              # TypeScript definitions
├── scripts/                 # Database and testing
│   ├── test-*/             # E2E testing scripts
│   ├── create-*/           # Setup scripts
│   └── seed-*/             # Data seeding
└── supabase/              # Database schema
    └── migrations/        # SQL migrations
```

## 🔧 Key Scripts

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Production build
npm run lint                   # Code quality check

# Database
node scripts/create-demo-users.js           # Setup test users
node scripts/seed-default-templates.js      # Load service templates
psql $DATABASE_URL < scripts/setup-database.sql  # Initialize schema

# Testing
node scripts/test-templates-complete-e2e.js # Full template system test
node scripts/test-smart-dates.js            # Date calculation testing
npm run test                                # Complete E2E suite
```

## 🎯 Current Status

### ✅ **Production Ready Features:**
- Complete authentication and authorization system
- Full service template system with smart date calculations
- Advanced project management with assignee system
- Real-time messaging and file sharing
- Knowledge base with resource management
- Mobile-responsive design across all viewports
- Comprehensive role-based access controls
- E2E testing coverage for all major workflows

### 🏆 **Quality Metrics:**
- **Build**: ✅ Passes cleanly with zero TypeScript errors
- **Security**: ✅ Role-based access properly enforced
- **Testing**: ✅ Comprehensive E2E test suite
- **Performance**: ✅ Optimized for mobile and desktop
- **Code Quality**: ✅ Professional standards with no `any` types

## 📞 Support

For development guidelines and patterns, see `CLAUDE.md`.
For issues and feature requests, create an issue in the repository.

---

**AgencyOS** - Professional agency management made simple.
Built with ❤️ using Next.js, TypeScript, and Supabase.