# AgencyOS Implementation Plan

## Project Overview
**AgencyOS** - A modern agency management system with role-based access control, built with Next.js 15, Supabase (remote), and shadcn/ui.

## Core Principles
- **Mobile-First Responsive Design**: Every component built responsive from 320px to 4K
- **Small, Testable Chunks**: Each phase broken into ~2-hour implementation blocks
- **Remote Supabase Only**: Using production Supabase instance for all development
- **Real Data First**: No mock data - all features use actual database entries
- **Progressive Enhancement**: Core functionality works, then add enhancements

## Tech Stack
- **Next.js 15.1+** (App Router, Server Components)
- **Supabase** (Remote instance for auth, database, realtime)
- **shadcn/ui** (Latest components with Radix UI)
- **TypeScript 5.6+**
- **Tailwind CSS 3.4+**
- **React Hook Form + Zod**
- **TanStack Table v8**
- **Framer Motion** (for micro-interactions)

## Responsive Breakpoints Strategy
```css
/* Mobile First Approach */
- Base: 320px-639px (Mobile)
- sm: 640px+ (Large Mobile/Small Tablet)
- md: 768px+ (Tablet)
- lg: 1024px+ (Desktop)
- xl: 1280px+ (Large Desktop)
- 2xl: 1536px+ (Ultra Wide)
```

## Phase 1: Foundation Setup (Day 1)

### Chunk 1.1: Next.js Initialization (30 min)
```bash
# In final-agency folder (current directory)
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*"
```

**Files to create:**
- `.env.local` (Supabase credentials)
- `middleware.ts` (auth middleware)

**Test:** `npm run dev` - verify Next.js runs on localhost:3000

### Chunk 1.2: Supabase Remote Setup (45 min)
1. Create project at supabase.com
2. Get anon key and URL
3. Install dependencies:
```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Files to create:**
- `lib/supabase/client.ts` (browser client)
- `lib/supabase/server.ts` (server client)
- `lib/supabase/middleware.ts` (middleware client)

**Test:** Console.log supabase client connection

### Chunk 1.3: shadcn/ui Setup (30 min)
```bash
npx shadcn@latest init
npx shadcn@latest add button card form input label select badge
npx shadcn@latest add table tabs dialog dropdown-menu avatar
npx shadcn@latest add toast skeleton separator navigation-menu
```

**Files modified:**
- `components.json`
- `tailwind.config.ts`
- `app/globals.css`

**Test:** Create test page with Button component

### Chunk 1.4: Responsive Layout Shell (1 hour)
**Files to create:**
- `components/layout/responsive-nav.tsx`
- `components/layout/mobile-menu.tsx`
- `components/layout/sidebar.tsx`
- `app/layout.tsx` (responsive wrapper)

**Responsive Requirements:**
- Mobile: Bottom tab navigation
- Tablet: Collapsible sidebar
- Desktop: Fixed sidebar

**Test:** Resize browser from 320px to 1920px - verify smooth transitions

## Phase 2: Database Architecture (Day 1-2)

### Chunk 2.1: Core Schema Creation (1 hour)
**Supabase SQL Editor:**
```sql
-- Run in Supabase Dashboard SQL Editor
CREATE TYPE user_role AS ENUM ('admin', 'team_member', 'client');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role user_role NOT NULL DEFAULT 'client',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT,
  phone TEXT,
  address JSONB,
  industry TEXT,
  website TEXT,
  company_size TEXT,
  annual_revenue TEXT,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Test:** Insert test record via Supabase Dashboard

### Chunk 2.2: Services Schema (45 min)
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'planning',
  budget DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'pending',
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Test:** Create service with milestone and task via SQL

### Chunk 2.3: RLS Policies (1 hour)
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Admin sees everything
CREATE POLICY "Admins full access" ON profiles
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Clients see only their own data
CREATE POLICY "Clients see own profile" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'team_member'))
  );
```

**Test:** Login as different roles, verify data visibility

### Chunk 2.4: Database Types & Hooks (45 min)
**Files to create:**
- `types/database.types.ts` (generated from Supabase)
- `lib/hooks/use-user.ts`
- `lib/hooks/use-profile.ts`

```bash
npx supabase gen types typescript --project-id [your-project] > types/database.types.ts
```

**Test:** TypeScript compilation passes

## Phase 3: Authentication Flow (Day 2)

### Chunk 3.1: Auth Pages (1 hour)
**Files to create:**
- `app/(auth)/login/page.tsx` (responsive login form)
- `app/(auth)/signup/page.tsx` (with role selection)
- `app/(auth)/layout.tsx` (centered responsive layout)
- `components/auth/auth-form.tsx`

**Responsive Requirements:**
- Mobile: Full screen form
- Tablet/Desktop: Centered card (max-w-md)

**Test:** Login/signup flow works on all viewports

### Chunk 3.2: Auth Middleware (45 min)
**Files to create:**
- `middleware.ts` (role-based redirects)
- `lib/auth/get-user.ts`
- `lib/auth/role-guard.ts`

```typescript
// middleware.ts structure
export async function middleware(request: NextRequest) {
  // Check auth
  // Check role
  // Redirect based on role and path
}
```

**Test:** Unauthorized users redirected to login

### Chunk 3.3: Role-Based Navigation (1 hour)
**Files to create:**
- `components/navigation/role-menu.tsx`
- `config/navigation.ts` (role-specific menu items)

**Menu Structure:**
```typescript
const menuItems = {
  admin: ['Dashboard', 'Clients', 'Services', 'Team', 'Settings'],
  team_member: ['Dashboard', 'Clients', 'Services', 'Tasks'],
  client: ['Dashboard', 'My Services', 'Profile']
}
```

**Test:** Different menus appear for different roles

## Phase 4: Role-Specific Dashboards (Day 3)

### Chunk 4.1: Dashboard Layouts (1 hour)
**Files to create:**
- `app/(dashboard)/layout.tsx` (with responsive sidebar)
- `app/(dashboard)/admin/page.tsx`
- `app/(dashboard)/team/page.tsx`
- `app/(dashboard)/client/page.tsx`

**Responsive Grid:**
- Mobile: Single column
- Tablet: 2 columns
- Desktop: 3-4 columns

**Test:** Dashboards responsive from 320px-4K

### Chunk 4.2: Dashboard Widgets (2 hours)
**Components to create:**
- `components/dashboard/stats-card.tsx`
- `components/dashboard/recent-activity.tsx`
- `components/dashboard/task-widget.tsx`
- `components/dashboard/service-progress.tsx`
- `components/dashboard/chart-widget.tsx`

**Use Recharts for responsive charts:**
```bash
npm install recharts
```

**Test:** Each widget resizes properly

### Chunk 4.3: Real-Time Updates (1 hour)
**Files to create:**
- `lib/supabase/realtime.ts`
- `hooks/use-realtime.ts`

```typescript
// Subscribe to changes
const subscription = supabase
  .channel('dashboard-changes')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'services' 
  }, handleChange)
  .subscribe()
```

**Test:** Open two browser windows, verify updates sync

## Phase 5: Clients Management (Day 4)

### Chunk 5.1: Data Table Component (2 hours)
**Files to create:**
- `app/clients/page.tsx`
- `components/clients/data-table.tsx`
- `components/clients/columns.tsx`
- `components/clients/toolbar.tsx`

**Install TanStack Table:**
```bash
npm install @tanstack/react-table
```

**Responsive Table Strategy:**
- Mobile: Card view with key details
- Tablet: Simplified table (4-5 columns)
- Desktop: Full table with all columns

**Test:** Table transforms smoothly between viewports

### Chunk 5.2: Filtering & Search (1 hour)
**Components to add:**
- `components/clients/filter-sheet.tsx` (mobile filters)
- `components/clients/search-command.tsx`
- `components/ui/data-table-faceted-filter.tsx`

**Features:**
- Debounced search
- Multi-select filters
- Date range picker
- Status badges

**Test:** Filter 100+ clients smoothly on mobile

### Chunk 5.3: Client Actions (1 hour)
**Components:**
- `components/clients/client-actions.tsx`
- `components/clients/add-client-dialog.tsx`
- `components/clients/bulk-actions.tsx`

**Mobile UX:**
- Swipe actions on mobile
- Bottom sheet for actions
- Floating action button

**Test:** CRUD operations work on all devices

## Phase 6: Client Profiles (Day 5)

### Chunk 6.1: Profile Layout (1.5 hours)
**Files to create:**
- `app/clients/[id]/page.tsx`
- `app/clients/[id]/layout.tsx`
- `components/profiles/profile-header.tsx`
- `components/profiles/profile-tabs.tsx`

**Responsive Layout:**
- Mobile: Stacked layout with tabs
- Desktop: Sidebar + content layout

**Test:** Profile page responsive and loads client data

### Chunk 6.2: Profile Sections (2 hours)
**Components:**
- `components/profiles/basic-info.tsx`
- `components/profiles/contact-details.tsx`
- `components/profiles/company-info.tsx`
- `components/profiles/service-history.tsx`
- `components/profiles/documents.tsx`

**Edit Mode:**
- Inline editing with optimistic updates
- Form validation with Zod
- Auto-save functionality

**Test:** Edit fields, verify database updates

### Chunk 6.3: Role-Based Permissions (1 hour)
**Files to create:**
- `lib/permissions/profile-permissions.ts`
- `components/profiles/permission-guard.tsx`

```typescript
const permissions = {
  admin: ['view_all', 'edit_all', 'delete'],
  team_member: ['view_all', 'edit_assigned'],
  client: ['view_own', 'edit_basic']
}
```

**Test:** Login as client, verify limited edit access

## Phase 7: Services & Project Management (Day 6-7)

### Chunk 7.1: Services List View (1.5 hours)
**Files to create:**
- `app/services/page.tsx`
- `components/services/services-grid.tsx`
- `components/services/service-card.tsx`
- `components/services/create-service-dialog.tsx`

**Views:**
- Grid view (default)
- Kanban view
- Timeline view

**Test:** Toggle between views on different devices

### Chunk 7.2: Service Detail Page (2 hours)
**Files to create:**
- `app/services/[id]/page.tsx`
- `components/services/service-overview.tsx`
- `components/services/milestone-board.tsx`
- `components/services/task-list.tsx`

**Responsive Kanban:**
- Mobile: Single column with horizontal scroll
- Tablet: 2 columns
- Desktop: All columns visible

**Test:** Drag and drop works on touch devices

### Chunk 7.3: Task Management (2 hours)
**Components:**
- `components/tasks/task-card.tsx`
- `components/tasks/task-dialog.tsx`
- `components/tasks/task-assignee.tsx`
- `components/tasks/task-timeline.tsx`

**Features:**
- Drag between milestones
- Quick edit on hover/tap
- Bulk task operations
- Keyboard shortcuts (desktop)

**Test:** Create, move, edit tasks smoothly

### Chunk 7.4: Progress Visualization (1 hour)
**Components:**
- `components/services/gantt-chart.tsx`
- `components/services/burndown-chart.tsx`
- `components/services/progress-ring.tsx`

**Responsive Charts:**
- Use ResponsiveContainer from Recharts
- Simplified view on mobile
- Interactive tooltips

**Test:** Charts readable on 320px screen

## Phase 8: Settings & Admin (Day 8)

### Chunk 8.1: Settings Layout (1 hour)
**Files to create:**
- `app/settings/page.tsx`
- `app/settings/layout.tsx`
- `components/settings/settings-nav.tsx`

**Sections:**
- General
- Team Management
- Billing
- Integrations
- Security

**Test:** Settings navigation works on mobile

### Chunk 8.2: Team Management (1.5 hours)
**Files to create:**
- `app/settings/team/page.tsx`
- `components/settings/team-list.tsx`
- `components/settings/invite-member.tsx`
- `components/settings/role-manager.tsx`

**Features:**
- Invite via email
- Role assignment
- Permission matrix
- Activity logs

**Test:** Invite team member, verify email sent

### Chunk 8.3: App Configuration (1 hour)
**Components:**
- `components/settings/app-config.tsx`
- `components/settings/theme-switcher.tsx`
- `components/settings/notification-settings.tsx`

**Store settings in Supabase:**
```sql
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  key TEXT NOT NULL,
  value JSONB,
  UNIQUE(user_id, key)
);
```

**Test:** Change theme, verify persistence

## Phase 9: Polish & Optimization (Day 9)

### Chunk 9.1: Loading States (1 hour)
**Components:**
- `components/ui/skeleton-loader.tsx`
- `components/ui/spinner.tsx`
- `app/loading.tsx` (global loading)

**Implement Suspense boundaries:**
```typescript
<Suspense fallback={<TableSkeleton />}>
  <ClientsTable />
</Suspense>
```

**Test:** Slow 3G network simulation

### Chunk 9.2: Error Handling (1 hour)
**Files to create:**
- `app/error.tsx`
- `app/not-found.tsx`
- `components/error-boundary.tsx`
- `lib/error-handler.ts`

**Toast notifications:**
```typescript
toast({
  title: "Success",
  description: "Client updated successfully"
})
```

**Test:** Disconnect internet, verify graceful errors

### Chunk 9.3: Performance Optimization (1.5 hours)
**Optimizations:**
- Image optimization with next/image
- Bundle splitting
- Lazy loading components
- Virtual scrolling for long lists
- Debounced search inputs

**Test:** Lighthouse scores >90 on all metrics

### Chunk 9.4: Accessibility (1 hour)
**Requirements:**
- ARIA labels
- Keyboard navigation
- Focus management
- Screen reader support
- Color contrast (WCAG AA)

**Test:** Navigate entire app with keyboard only

## Phase 10: Testing & Deployment (Day 10)

### Chunk 10.1: Seed Data Script (45 min)
**Files to create:**
- `scripts/seed.ts`
- `scripts/reset-db.ts`

```typescript
// Creates test users:
// admin@agencyos.dev (Admin)
// john@agencyos.dev (Team Member)
// client@acme.com (Client)
// Plus 50+ clients with services
```

**Test:** Run seed script, verify data appears

### Chunk 10.2: E2E Testing Setup (1.5 hours)
**Install Playwright:**
```bash
npm init playwright@latest
```

**Test files:**
- `tests/auth.spec.ts`
- `tests/dashboard.spec.ts`
- `tests/clients.spec.ts`
- `tests/services.spec.ts`

**Test:** Run tests on multiple viewports

### Chunk 10.3: Environment Configuration (30 min)
**Files:**
- `.env.example`
- `README.md` (setup instructions)

**Environment variables:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

**Test:** Fresh clone and setup works

### Chunk 10.4: Deployment (1 hour)
**Vercel Deployment:**
```bash
npm install -g vercel
vercel
```

**Configure:**
- Environment variables
- Custom domain
- Preview deployments
- Analytics

**Test:** Production build works correctly

## Testing Strategy for Each Phase

### Quick Test Commands
```bash
# Development with hot reload
npm run dev

# Type checking
npm run type-check

# Responsive testing
npm run dev
# Open Chrome DevTools
# Toggle device toolbar (Ctrl+Shift+M)
# Test: iPhone SE (375px) to 4K (2560px)

# Database testing
# Go to Supabase Dashboard > SQL Editor
# Run queries to verify data

# Role testing
# Use incognito windows for different users
# Login with test accounts simultaneously
```

### Manual Test Checklist
- [ ] Mobile (320px): Navigation works, forms usable
- [ ] Tablet (768px): Layout adapts, sidebar visible
- [ ] Desktop (1920px): Full features accessible
- [ ] Touch: Swipe, drag, and tap work
- [ ] Keyboard: Tab navigation complete
- [ ] Screen reader: Announces properly
- [ ] Slow network: Loading states appear
- [ ] Offline: Error messages show

## Success Metrics
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- Lighthouse Performance > 90
- All viewports 320px-2560px supported
- Zero console errors
- TypeScript strict mode passes
- 100% RLS policy coverage

## Common Issues & Solutions

### Issue: Hydration Errors
**Solution:** Use dynamic imports for client components
```typescript
const ClientComponent = dynamic(() => import('./client-component'), {
  ssr: false
})
```

### Issue: Mobile Performance
**Solution:** Virtualize long lists
```typescript
npm install @tanstack/react-virtual
```

### Issue: Supabase Rate Limits
**Solution:** Implement request batching and caching

### Issue: Large Bundle Size
**Solution:** Analyze with @next/bundle-analyzer

## Next Steps After Implementation
1. Add email notifications (Resend/SendGrid)
2. Implement file uploads (Supabase Storage)
3. Add calendar integration
4. Build mobile app (React Native)
5. Add invoicing module
6. Implement time tracking
7. Add client portal

## Resources
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Next.js App Router](https://nextjs.org/docs/app)
- [TanStack Table](https://tanstack.com/table/latest)
- [Tailwind Responsive](https://tailwindcss.com/docs/responsive-design)