# CLAUDE.md - AgencyOS Development Guidelines

## Core Development Principles

### 1. NO MOCK DATA OR WORKAROUNDS
- **ALWAYS** use real database entries
- **NEVER** create demo/mock modes
- **ALWAYS** address issues head-on
- **DO NOT** move past errors until they're fixed

### 2. RESPONSIVE DESIGN FROM START
- **ALWAYS** test on all viewports (320px to 4K)
- Mobile-first approach
- Test breakpoints: 320px, 768px, 1024px, 1920px

### 3. SMALL CHUNKS WITH TESTING
- Work in ~30min-2hr chunks
- Test after each chunk
- Use todo list to track progress

### 4. COMPREHENSIVE E2E TESTING
- Use Playwright for real browser testing
- Test all user roles and permissions
- Test complete workflows end-to-end
- Debug until 100% success rate achieved

## Error Debugging Sequence

### When encountering an error:

1. **STOP** - Don't create workarounds
2. **READ** - Read the full error message and stack trace
3. **IDENTIFY** - Identify the root cause (not symptoms)
4. **FIX** - Fix the actual issue at its source
5. **CLEAN** - Clear cache and rebuild if needed:
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   npm run build
   npm run dev
   ```
6. **TEST** - Verify the fix works on all viewports
7. **DOCUMENT** - Update this file if it's a new pattern

### Common Error Patterns & Fixes

#### "Cannot coerce the result to a single JSON object" (PGRST116)
- **Cause**: Using `.single()` on Supabase query that returns 0 rows
- **Fix**: Use `.maybeSingle()` instead of `.single()` when result might not exist
- **Example**: `getOrCreateConversation` function - conversation might not exist yet

#### "New row violates row-level security policy"
- **Cause**: RLS policy too restrictive or not matching server action context
- **Fix**: Create appropriate RLS policy that works with authenticated users
- **Example**: `CREATE POLICY "Authenticated users can create conversations" ON conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);`

#### "Hydration mismatch"
- **Cause**: Server/client render differently (dates, random values, window checks)
- **Fix**: Use consistent formatting utilities or `typeof window !== 'undefined'` checks
- **Example**: Date formatting with `formatDate()` utility function

#### "Module not found"
- **Cause**: Missing dependency or wrong import path
- **Fix**: Check package.json, run `npm install`, verify import paths start with `@/`

#### "Dashboard redirect 404 errors"
- **Cause**: Middleware and page both trying to redirect
- **Fix**: Handle redirects in middleware only, include `/dashboard` in redirect logic

## Common Issues & Solutions

### Supabase Connection Issues
```bash
# Test API key
curl -X GET "https://lfqnpszawjpcydobpxul.supabase.co/rest/v1/profiles?select=*&limit=1" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# If "Invalid API key" error:
# Get correct key from: https://supabase.com/dashboard/project/lfqnpszawjpcydobpxul/settings/api
```

### RLS Policy Management
```sql
-- Check existing policies
SELECT schemaname, tablename, policyname, cmd, roles, qual FROM pg_policies WHERE tablename = 'table_name';

-- Create authenticated user policy
CREATE POLICY "policy_name" ON table_name FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Temporarily disable RLS for testing
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

### Server Restart Sequence
```bash
# Kill existing process
# Clear cache
rm -rf .next
rm -rf node_modules/.cache
# Rebuild
npm run build
# Start fresh
npm run dev
```

### Database Testing & Management
```bash
# Connect to database
psql "postgresql://postgres:agency-final@db.lfqnpszawjpcydobpxul.supabase.co:5432/postgres"

# Check tables
\dt

# Test query
SELECT * FROM profiles LIMIT 1;

# Clean up old users
DELETE FROM profiles WHERE email LIKE '%old_pattern%';
```

## Project Structure

### Authentication Flow
1. User hits any protected route
2. Middleware checks auth status
3. Redirects to /login if not authenticated
4. After login, middleware redirects based on role:
   - Admin → /admin
   - Team → /team  
   - Client → /client
5. No server-side redirects in dashboard pages (handled by middleware)

### Database Schema
- `profiles` - Base user data (extends auth.users)
- `client_profiles` - Extended client data
- `services` - Projects/services
- `milestones` - Service milestones
- `tasks` - Milestone tasks
- `conversations` - Message conversations
- `messages` - Individual messages
- `conversation_participants` - Many-to-many relationship for conversation access

### Message System Architecture
- **One conversation per client** - Enforced at database/application level
- **Role-based access** - Admin/Team can message clients, clients see only their conversations
- **Real-time updates** - Using Supabase realtime subscriptions
- **File attachments** - Stored in Supabase Storage with public URLs
- **Participant management** - Automatic addition of relevant team members

## Test Accounts (Updated & Clean)

```
All accounts use password: password123

Admin:    admin@demo.com         (Alex Admin)
Team:     team@demo.com          (Taylor Team)
Client:   sarah@acmecorp.com     (Sarah Johnson - Acme Corp)
Client:   mike@techstartup.co    (Mike Chen - Tech Startup Co)
Client:   lisa@retailplus.com    (Lisa Rodriguez - RetailPlus)
```

## Development Checklist

### Before Starting Work
- [ ] Server running (`npm run dev`)
- [ ] Database connected (check with curl test above)
- [ ] Clear any previous build artifacts if issues

### After Making Changes
- [ ] Test on mobile viewport (375px)
- [ ] Test on tablet viewport (768px)
- [ ] Test on desktop viewport (1920px)
- [ ] Check console for errors
- [ ] Verify database operations work
- [ ] Run E2E tests with Playwright

### Before Committing
- [ ] All TypeScript errors resolved
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors
- [ ] Responsive design works
- [ ] E2E tests passing

## Testing Methodology

### Playwright E2E Testing
```bash
# Run comprehensive tests
node scripts/comprehensive-debug.js

# Debug specific functionality
node scripts/debug-new-conversation.js

# Test message flow
node scripts/test-message-flow.js
```

### Test Patterns
1. **Authentication Testing** - Test all user roles
2. **Permission Testing** - Verify role-based access
3. **Database Operations** - Test CRUD operations
4. **UI Interactions** - Test buttons, forms, navigation
5. **Error Handling** - Test error scenarios
6. **Cross-viewport** - Test on mobile/tablet/desktop

## Key Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production

# Database
psql $DATABASE_URL      # Connect to database

# Testing
node scripts/comprehensive-debug.js    # Full E2E test suite
node scripts/create-demo-users.js      # Create test users
node scripts/create-demo-conversations.js # Create test data

# Debugging
rm -rf .next            # Clear Next.js cache
npm run type-check      # Check TypeScript
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://lfqnpszawjpcydobpxul.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[from dashboard]
SUPABASE_SERVICE_ROLE_KEY=[from dashboard]
DATABASE_URL=postgresql://postgres:agency-final@db.lfqnpszawjpcydobpxul.supabase.co:5432/postgres
```

## Code Organization Standards

```
/app
  /(auth)         # Auth routes group
  /(dashboard)    # Protected routes group
  /actions        # Server actions
  error.tsx       # Global error boundary
  loading.tsx     # Global loading state

/features         # Feature-based organization
  /chat           # Message system
    /components
  /clients        # Client management
    /components
  /dashboard      # Dashboard features
    /components

/shared           # Shared utilities
  /components/ui  # Reusable UI components
  /hooks          # Custom React hooks
  /lib            # Utility functions
    constants.ts  # Routes, messages, configs
    helpers.ts    # Utility functions
    format-date.ts # Date formatting utilities
    /supabase     # Database utilities

/scripts          # Testing and utility scripts
  comprehensive-debug.js
  create-demo-users.js
  test-*.js

/types            # TypeScript definitions
  index.ts        # All shared types
```

## Server Actions Best Practices

### Authentication Patterns
```typescript
export async function serverAction() {
  const supabase = await createClient()
  
  // Always check authentication first
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  
  // Your logic here
}
```

### Database Query Patterns
```typescript
// Use .maybeSingle() when record might not exist
const { data: existing, error } = await supabase
  .from('table')
  .select('*')
  .eq('id', id)
  .maybeSingle()

// Use .single() only when you're certain record exists
const { data: record, error } = await supabase
  .from('table')
  .select('*')
  .eq('id', id)
  .single()
```

### Error Handling Patterns
```typescript
// Consistent error returns
if (error) return { error }
if (!data) return { error: 'Record not found' }

// Client-side error handling
const result = await serverAction()
if (result.error) {
  toast({
    title: "Error",
    description: typeof result.error === 'string' ? result.error : result.error.message,
    variant: "destructive"
  })
  return
}
```

## UI/UX Patterns

### Date Formatting
```typescript
import { formatDate } from '@/shared/lib/format-date'

// Consistent server/client date rendering
<p>Joined {formatDate(user.created_at)}</p>
```

### Modal Patterns
```typescript
// Modal with client selection
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    {/* Search functionality */}
    {/* List with loading states */}
    {/* Proper error handling */}
  </DialogContent>
</Dialog>
```

### Accessibility Patterns
```tsx
// Always include aria-labels for buttons without text
<Button aria-label="Send message">
  <Send className="h-4 w-4" />
</Button>

// Stop event propagation when needed
<Button onClick={(e) => {
  e.stopPropagation();
  handleAction();
}}>
```

## IMPORTANT REMINDERS

1. **NO MOCK DATA** - Always use real database
2. **FIX ERRORS IMMEDIATELY** - Don't proceed with errors
3. **TEST EVERYTHING** - Every change needs E2E testing
4. **STAY RESPONSIVE** - Check all viewports
5. **CLEAN BUILDS** - When in doubt, clear cache and rebuild
6. **REFACTOR REGULARLY** - Don't let technical debt accumulate
7. **DOCUMENT PATTERNS** - Update this file with new solutions
8. **USE .maybeSingle()** - When records might not exist
9. **TEST WITH REAL DATA** - Use Playwright for comprehensive testing
10. **VALIDATE WITH 100%** - Don't accept partial functionality

## Current Status - PRODUCTION READY ✅

### ✅ Completed & Deployed
- Next.js 15 with TypeScript setup
- Supabase connection configured
- Database schema with proper RLS policies
- Clean test users with realistic data
- Complete authentication flow with role-based redirects
- Responsive navigation (mobile/desktop)
- Role-specific dashboards (admin/team/client)
- **COMPLETE MESSAGE SYSTEM:**
  - Real-time conversation creation and management
  - New message modal with client selection
  - Message sending with file attachments
  - One conversation per client constraint
  - Role-based access control
  - Client profile message buttons
  - Proper error handling and RLS policies
- Clients data table with search and filtering
- Draggable column reordering
- Error boundaries and loading states
- Comprehensive E2E testing suite
- Build process optimized and error-free

### 🎯 System Health: 100% 
- All builds passing
- All E2E tests successful  
- No console errors
- Responsive across all viewports
- Database operations fully functional
- Authentication and authorization working
- Real-time features operational

### 🚀 Ready for Production Use
The system is fully functional with professional-grade messaging, client management, and user authentication. All major features tested and verified with real database operations.