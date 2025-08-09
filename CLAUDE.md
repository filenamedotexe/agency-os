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

#### "Column with id 'X' does not exist"
- **Cause**: TanStack Table can't find accessor
- **Fix**: Check column definition has correct `accessorKey` or `id`
- **Example**: Changed from `accessorKey: "email"` to `id: "name"` with custom filter

#### "Hydration mismatch"
- **Cause**: Server/client render differently
- **Fix**: Use `dynamic(() => import(...), { ssr: false })` or check date/time rendering

#### "Module not found"
- **Cause**: Missing dependency or wrong import path
- **Fix**: Check package.json, run `npm install`, verify import paths start with `@/`

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

### Database Testing
```bash
# Connect to database
psql "postgresql://postgres:agency-final@db.lfqnpszawjpcydobpxul.supabase.co:5432/postgres"

# Check tables
\dt

# Test query
SELECT * FROM profiles LIMIT 1;
```

## Project Structure

### Authentication Flow
1. User hits any protected route
2. Middleware checks auth status
3. Redirects to /login if not authenticated
4. After login, redirects to /dashboard
5. /dashboard checks role and redirects:
   - Admin → /admin
   - Team → /team
   - Client → /client

### Database Schema
- `profiles` - Base user data (extends auth.users)
- `client_profiles` - Extended client data
- `services` - Projects/services
- `milestones` - Service milestones
- `tasks` - Milestone tasks

### Test Accounts
```
All accounts use password: password123

Admin:    admin@agencyos.dev
Team:     john@agencyos.dev
Client:   client1@acme.com
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

### Before Committing
- [ ] All TypeScript errors resolved
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors
- [ ] Responsive design works

## Key Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production

# Database
psql $DATABASE_URL      # Connect to database
npm run seed            # Run seed script (when created)

# Debugging
rm -rf .next            # Clear Next.js cache
npm run type-check      # Check TypeScript

# Testing API
curl [API_ENDPOINT]     # Test Supabase endpoints
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://lfqnpszawjpcydobpxul.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[from dashboard]
SUPABASE_SERVICE_ROLE_KEY=[from dashboard]
DATABASE_URL=postgresql://postgres:agency-final@db.lfqnpszawjpcydobpxul.supabase.co:5432/postgres
```

## Refactoring Methodology

### When to Refactor (Do this regularly!):
1. **After completing each phase** - Clean up before moving on
2. **When you see duplicate code** - Extract to utilities immediately
3. **Before committing** - Quick review for improvements
4. **When errors reveal bad patterns** - Fix the pattern, not just the error

### Refactoring Checklist:
```
1. Extract Types
   - [ ] Move interfaces/types to types/index.ts
   - [ ] Use consistent naming (Profile, not ProfileType)
   - [ ] Export and reuse across components

2. Consolidate Constants
   - [ ] Routes → lib/constants.ts ROUTES object
   - [ ] Error messages → ERROR_MESSAGES
   - [ ] Status mappings → STATUS_COLORS
   - [ ] Remove ALL magic strings/numbers

3. Create Helper Functions
   - [ ] Date formatting → lib/helpers.ts
   - [ ] Common calculations → helpers
   - [ ] Repeated UI logic → helpers
   - [ ] Remove duplicate functions

4. Improve Error Handling
   - [ ] Add error boundaries
   - [ ] Use consistent error messages
   - [ ] Add proper try/catch blocks
   - [ ] Log errors appropriately

5. Add Loading States
   - [ ] Create loading.tsx for async routes
   - [ ] Add skeleton components
   - [ ] Show loading during data fetches
   - [ ] Improve perceived performance
```

### Code Organization Standards:
```
/types
  index.ts         # All shared TypeScript types

/lib
  constants.ts     # Routes, messages, configs
  helpers.ts       # Utility functions
  /supabase       # Database utilities
    client.ts
    server.ts

/components
  /ui             # Reusable UI components
  /layout         # Layout components
  /dashboard      # Dashboard-specific
  /clients        # Feature-specific

/app
  /(auth)         # Auth routes group
  /(dashboard)    # Protected routes group
  error.tsx       # Global error boundary
  loading.tsx     # Global loading state
```

## IMPORTANT REMINDERS

1. **NO MOCK DATA** - Always use real database
2. **FIX ERRORS IMMEDIATELY** - Don't proceed with errors
3. **TEST EVERYTHING** - Every change needs testing
4. **STAY RESPONSIVE** - Check all viewports
5. **CLEAN BUILDS** - When in doubt, clear cache and rebuild
6. **REFACTOR REGULARLY** - Don't let technical debt accumulate
7. **DOCUMENT PATTERNS** - Update this file with new solutions

## Current Status

### ✅ Completed
- Next.js 15 with TypeScript setup
- Supabase connection configured
- Database schema with RLS policies
- Test users seeded (password123)
- Authentication flow complete
- Responsive navigation (mobile/desktop)
- Role-specific dashboards
- Clients data table with search
- Error boundaries and loading states
- Refactored code organization

### 🔄 In Progress
- Enhanced filtering for clients
- Client actions (add/edit/delete)

### ⏳ Next Up
- Client profile pages
- Services management
- Task tracking system
- Settings panel