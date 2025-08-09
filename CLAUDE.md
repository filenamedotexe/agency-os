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
2. **READ** - Read the full error message
3. **IDENTIFY** - Identify the root cause
4. **FIX** - Fix the actual issue
5. **CLEAN** - Clear cache and rebuild if needed:
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   npm run build
   npm run dev
   ```
6. **TEST** - Verify the fix works

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
4. After login, redirects based on role:
   - Admin → /dashboard/admin
   - Team → /dashboard/team
   - Client → /dashboard/client

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

## IMPORTANT REMINDERS

1. **NO MOCK DATA** - Always use real database
2. **FIX ERRORS IMMEDIATELY** - Don't proceed with errors
3. **TEST EVERYTHING** - Every change needs testing
4. **STAY RESPONSIVE** - Check all viewports
5. **CLEAN BUILDS** - When in doubt, clear cache and rebuild

## Current Status

- ✅ Next.js 15 with TypeScript setup
- ✅ Supabase connection configured
- ✅ Database schema created
- ✅ Test users seeded
- ✅ Authentication pages created
- ✅ Responsive navigation built
- 🔄 Dashboard pages in progress
- 🔄 Client management in progress
- 🔄 Services/Tasks UI in progress