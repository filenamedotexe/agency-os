# AgencyOS Refactoring Plan - Detailed Implementation Guide

## Overview
This document provides step-by-step instructions for refactoring the AgencyOS codebase to improve performance, maintainability, and developer experience. Each task is designed to be completed in 1-3 hour chunks with immediate testing.

## Pre-Refactoring Checklist
- [ ] Ensure all tests pass (`node scripts/comprehensive-debug.js`)
- [ ] Backup current branch (`git checkout -b refactor-backup`)
- [ ] Create working branch (`git checkout -b refactor-implementation`)
- [ ] Server running on localhost:3000

---

## PHASE 1: FOUNDATION IMPROVEMENTS (Week 1-2)

### Task 1.1: Centralize Supabase Client Management
**Estimated Time**: 2-3 hours
**Priority**: Critical
**Files to Create/Modify**:
- `shared/hooks/use-supabase-client.ts` (new)
- `shared/lib/supabase/client-manager.ts` (new)

**Implementation Steps**:

1. **Create Supabase Client Hook**
```typescript
// shared/hooks/use-supabase-client.ts
import { useMemo } from 'react'
import { createClient } from '@/shared/lib/supabase/client'

export function useSupabaseClient() {
  return useMemo(() => createClient(), [])
}

export function useSupabaseQuery<T>(
  queryFn: (client: ReturnType<typeof createClient>) => Promise<T>,
  deps: any[] = []
) {
  const client = useSupabaseClient()
  // Add loading/error state management
}
```

2. **Create Client Manager Service**
```typescript
// shared/lib/supabase/client-manager.ts
let clientInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createClient()
  }
  return clientInstance
}
```

3. **Update Components (Start with these files)**:
   - `features/chat/components/new-message-modal.tsx`
   - `features/clients/components/clients-data-table.tsx`
   - `features/dashboard/components/recent-activity.tsx`

4. **Testing**:
   - Run app, ensure no console errors
   - Test message creation, client filtering
   - Run `node scripts/test-message-flow.js`

**Success Criteria**: No functionality changes, reduced client creation calls

---

### Task 1.2: Extract UserAvatar Component
**Estimated Time**: 1-2 hours
**Files to Create/Modify**:
- `shared/components/ui/user-avatar.tsx` (new)
- Update all components using avatar patterns

**Implementation Steps**:

1. **Create UserAvatar Component**
```typescript
// shared/components/ui/user-avatar.tsx
interface UserAvatarProps {
  firstName?: string
  lastName?: string
  avatarUrl?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showTooltip?: boolean
}

export function UserAvatar({ 
  firstName, 
  lastName, 
  avatarUrl, 
  size = 'md',
  className,
  showTooltip = true
}: UserAvatarProps) {
  // Implementation with consistent sizing, fallback initials
  // Use existing Avatar component as base
}
```

2. **Update Components Using Avatar Pattern**:
   - `features/chat/components/conversation-item.tsx`
   - `features/chat/components/message-item.tsx`
   - `features/clients/components/client-row.tsx`
   - `shared/components/layout/app-sidebar.tsx`

3. **Add to shared/components/ui/index.ts**

**Testing**:
- Visual regression test on all avatar instances
- Check responsive behavior
- Test tooltip functionality

**Success Criteria**: Consistent avatar appearance across app, reduced code duplication

---

### Task 1.3: Create SearchInput Component
**Estimated Time**: 1 hour
**Files to Create/Modify**:
- `shared/components/ui/search-input.tsx` (new)

**Implementation Steps**:

1. **Create SearchInput Component**
```typescript
// shared/components/ui/search-input.tsx
interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
  onClear?: () => void
}

export function SearchInput({ 
  value, 
  onChange, 
  placeholder = "Search...",
  debounceMs = 300,
  className,
  onClear 
}: SearchInputProps) {
  // Implementation with debouncing, clear button
}
```

2. **Update Components**:
   - `features/clients/components/clients-data-table.tsx`
   - `features/chat/components/new-message-modal.tsx`

**Testing**:
- Test search functionality in clients table
- Test search in message modal client selection
- Verify debouncing works

**Success Criteria**: Consistent search behavior, better UX

---

### Task 1.4: Centralize Database Types
**Estimated Time**: 2 hours
**Files to Create/Modify**:
- `types/database.ts` (enhance existing)
- `types/api.ts` (new)

**Implementation Steps**:

1. **Enhance Database Types**
```typescript
// types/database.ts
export interface DatabaseProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'team' | 'client'
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface DatabaseClientProfile {
  id: string
  user_id: string
  company_name: string
  industry?: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
}

// ... all other database tables
```

2. **Create API Response Types**
```typescript
// types/api.ts
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  success: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  limit: number
}
```

3. **Update Server Actions**:
   - `app/actions/clients.ts`
   - `app/actions/chat.ts`
   - `app/actions/email.ts`

**Testing**:
- TypeScript compilation should pass
- No runtime errors in type usage

**Success Criteria**: Consistent typing across app, better IDE support

---

## PHASE 2: PERFORMANCE OPTIMIZATIONS (Week 3)

### Task 2.1: Add React.memo to List Components
**Estimated Time**: 2 hours
**Files to Modify**:
- `features/clients/components/client-row.tsx`
- `features/chat/components/conversation-item.tsx`
- `features/chat/components/message-item.tsx`

**Implementation Steps**:

1. **Optimize ClientRow Component**
```typescript
// features/clients/components/client-row.tsx
interface ClientRowProps {
  client: DatabaseProfile & { client_profiles: DatabaseClientProfile }
  onUpdate?: () => void
}

export const ClientRow = React.memo(({ client, onUpdate }: ClientRowProps) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison if needed
  return prevProps.client.updated_at === nextProps.client.updated_at
})

ClientRow.displayName = 'ClientRow'
```

2. **Optimize Other List Components**:
   - Apply same pattern to conversation items
   - Apply to message items

3. **Add Performance Monitoring**:
```typescript
// shared/hooks/use-performance.ts
export function usePerformance(componentName: string) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.time(`${componentName} render`)
      return () => console.timeEnd(`${componentName} render`)
    }
  })
}
```

**Testing**:
- Use React DevTools Profiler to measure improvements
- Load clients page with many records
- Test conversation list performance

**Success Criteria**: Measurable render performance improvement

---

### Task 2.2: Optimize Supabase Queries
**Estimated Time**: 2-3 hours
**Files to Create/Modify**:
- `shared/lib/database/query-builder.ts` (new)
- Update existing query patterns

**Implementation Steps**:

1. **Create Query Builder Service**
```typescript
// shared/lib/database/query-builder.ts
export class ClientQueries {
  static getClientsWithProfiles(
    supabase: SupabaseClient,
    options: {
      search?: string
      limit?: number
      offset?: number
    } = {}
  ) {
    let query = supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        avatar_url,
        created_at,
        client_profiles!inner(
          company_name,
          industry,
          phone
        )
      `)
      .eq('role', 'client')

    if (options.search) {
      query = query.or(`
        first_name.ilike.%${options.search}%,
        last_name.ilike.%${options.search}%,
        email.ilike.%${options.search}%,
        client_profiles.company_name.ilike.%${options.search}%
      `)
    }

    if (options.limit) {
      query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1)
    }

    return query.order('created_at', { ascending: false })
  }
}

export class ConversationQueries {
  static getConversationsWithParticipants(supabase: SupabaseClient, userId: string) {
    // Optimized conversation queries
  }
}
```

2. **Update Components to Use Query Builder**:
   - `features/clients/components/clients-data-table.tsx`
   - `features/chat/components/conversation-list.tsx`

3. **Add Pagination Support**:
```typescript
// shared/hooks/use-pagination.ts
export function usePagination<T>(
  fetchFn: (offset: number, limit: number) => Promise<T[]>,
  pageSize = 20
) {
  // Pagination hook implementation
}
```

**Testing**:
- Test with large datasets
- Verify search performance
- Check pagination functionality

**Success Criteria**: Faster query response times, reduced data transfer

---

### Task 2.3: Create State Management Layer
**Estimated Time**: 3-4 hours
**Files to Create**:
- `shared/store/use-app-store.ts`
- `shared/store/slices/user-slice.ts`
- `shared/store/slices/conversation-slice.ts`

**Implementation Steps**:

1. **Install Zustand** (if needed):
```bash
npm install zustand
```

2. **Create App Store**
```typescript
// shared/store/use-app-store.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface AppState {
  // User state
  currentUser: DatabaseProfile | null
  setCurrentUser: (user: DatabaseProfile | null) => void
  
  // Conversations state
  conversations: Conversation[]
  setConversations: (conversations: Conversation[]) => void
  addConversation: (conversation: Conversation) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => void
  
  // UI state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // State implementation
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      
      conversations: [],
      setConversations: (conversations) => set({ conversations }),
      addConversation: (conversation) => set((state) => ({
        conversations: [conversation, ...state.conversations]
      })),
      updateConversation: (id, updates) => set((state) => ({
        conversations: state.conversations.map(conv =>
          conv.id === id ? { ...conv, ...updates } : conv
        )
      })),
      
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open })
    }),
    { name: 'app-store' }
  )
)
```

3. **Create Specialized Slices**
```typescript
// shared/store/slices/user-slice.ts
export interface UserSlice {
  currentUser: DatabaseProfile | null
  isLoading: boolean
  fetchCurrentUser: () => Promise<void>
  logout: () => void
}

export const createUserSlice: StateCreator<UserSlice> = (set, get) => ({
  // User-specific state and actions
})
```

4. **Update Components to Use Store**:
   - `shared/components/layout/app-sidebar.tsx`
   - `features/chat/components/conversation-list.tsx`

**Testing**:
- Test state persistence across navigation
- Verify real-time updates work
- Check dev tools integration

**Success Criteria**: Consistent state management, better real-time updates

---

## PHASE 3: ARCHITECTURE IMPROVEMENTS (Week 4-5)

### Task 3.1: Create Modal Component System
**Estimated Time**: 2-3 hours
**Files to Create**:
- `shared/components/ui/modal/modal.tsx`
- `shared/components/ui/modal/modal-context.tsx`

**Implementation Steps**:

1. **Create Base Modal Component**
```typescript
// shared/components/ui/modal/modal.tsx
interface ModalProps {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlay?: boolean
}

export function Modal({
  children,
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnOverlay = true
}: ModalProps) {
  // Implementation using existing Dialog component
}

export function ModalHeader({ children }: { children: React.ReactNode }) {
  // Modal header component
}

export function ModalBody({ children }: { children: React.ReactNode }) {
  // Modal body component
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
  // Modal footer component
}
```

2. **Create Modal Context for Management**
```typescript
// shared/components/ui/modal/modal-context.tsx
interface ModalContextType {
  openModal: (id: string, component: React.ReactNode) => void
  closeModal: (id: string) => void
  closeAllModals: () => void
}

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Modal management implementation
}
```

3. **Refactor Existing Modals**:
   - `features/chat/components/new-message-modal.tsx`
   - Any other modal components

**Testing**:
- Test modal opening/closing
- Verify overlay behavior
- Test accessibility (focus management)

**Success Criteria**: Consistent modal behavior, reduced code duplication

---

### Task 3.2: Create Form Component System
**Estimated Time**: 3-4 hours
**Files to Create**:
- `shared/components/forms/form.tsx`
- `shared/components/forms/form-field.tsx`
- `shared/components/forms/form-validation.ts`

**Implementation Steps**:

1. **Create Form System**
```typescript
// shared/components/forms/form.tsx
interface FormProps<T> {
  initialValues: T
  validationSchema?: any // Zod schema
  onSubmit: (values: T) => Promise<void>
  children: React.ReactNode
}

export function Form<T>({
  initialValues,
  validationSchema,
  onSubmit,
  children
}: FormProps<T>) {
  // Form implementation with validation
}

export function FormField({
  name,
  label,
  type = 'text',
  required = false,
  children
}: FormFieldProps) {
  // Field component with error handling
}
```

2. **Add Validation**
```bash
npm install zod react-hook-form @hookform/resolvers
```

3. **Create Validation Schemas**
```typescript
// shared/lib/validation/schemas.ts
import { z } from 'zod'

export const clientProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  company_name: z.string().min(1, 'Company name is required'),
})
```

**Testing**:
- Test form validation
- Test form submission
- Verify error handling

**Success Criteria**: Consistent form behavior, better validation

---

### Task 3.3: Error Boundary System
**Estimated Time**: 1-2 hours
**Files to Create**:
- `shared/components/error-boundary/feature-error-boundary.tsx`
- `shared/components/error-boundary/global-error-boundary.tsx`

**Implementation Steps**:

1. **Create Feature Error Boundary**
```typescript
// shared/components/error-boundary/feature-error-boundary.tsx
interface FeatureErrorBoundaryProps {
  feature: string
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error }>
}

export class FeatureErrorBoundary extends React.Component<
  FeatureErrorBoundaryProps,
  { hasError: boolean; error?: Error }
> {
  // Error boundary implementation
}
```

2. **Update App Layout**:
   - Wrap features with error boundaries
   - Add to `app/layout.tsx`

**Testing**:
- Trigger errors to test boundaries
- Verify error reporting

**Success Criteria**: Better error handling, improved user experience

---

## PHASE 4: TESTING & CLEANUP (Week 6)

### Task 4.1: Add Unit Tests
**Estimated Time**: 4-6 hours
**Files to Create**:
- `shared/lib/__tests__/helpers.test.ts`
- `shared/hooks/__tests__/use-supabase-client.test.ts`
- `shared/components/ui/__tests__/user-avatar.test.tsx`

**Implementation Steps**:

1. **Set up Testing**
```bash
npm install @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

2. **Create Test Configuration**
```typescript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = createJestConfig(customJestConfig)
```

3. **Write Tests for Utilities**
```typescript
// shared/lib/__tests__/helpers.test.ts
import { formatDate, getInitials } from '../helpers'

describe('helpers', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      // Test implementation
    })
  })
  
  describe('getInitials', () => {
    it('should return correct initials', () => {
      // Test implementation
    })
  })
})
```

**Testing**:
- Run `npm test`
- Verify all tests pass
- Check coverage reports

**Success Criteria**: Good test coverage for utilities and hooks

---

### Task 4.2: Performance Audit
**Estimated Time**: 2-3 hours

**Implementation Steps**:

1. **Bundle Analysis**
```bash
npm run build && npm run analyze
```

2. **Performance Testing**
   - Lighthouse audit
   - Core Web Vitals measurement
   - Bundle size analysis

3. **Optimize Based on Results**
   - Code splitting where needed
   - Image optimization
   - Font optimization

**Success Criteria**: Improved performance metrics

---

### Task 4.3: Documentation Updates
**Estimated Time**: 1-2 hours
**Files to Update**:
- `CLAUDE.md`
- `README.md` (if exists)

**Implementation Steps**:

1. **Update CLAUDE.md**
   - Document new patterns
   - Update component usage
   - Add refactoring notes

2. **Create Component Documentation**
   - Document new shared components
   - Add usage examples
   - Document props interfaces

**Success Criteria**: Up-to-date documentation

---

## POST-REFACTORING VALIDATION

### Final Testing Checklist
- [ ] All existing E2E tests pass
- [ ] New unit tests pass
- [ ] Performance metrics improved
- [ ] Bundle size reduced or maintained
- [ ] TypeScript compilation clean
- [ ] No console errors in development
- [ ] All features work as before

### Performance Metrics to Track
- **Before/After Bundle Size**
- **Before/After Lighthouse Scores**
- **Before/After Time to Interactive**
- **Before/After First Contentful Paint**

### Git Strategy
```bash
# After each task
git add .
git commit -m "refactor: [task description]"

# After each phase
git push origin refactor-implementation

# Final merge
git checkout main
git merge refactor-implementation
git push origin main
```

---

## ROLLBACK PLAN

If any refactoring breaks functionality:

1. **Immediate Rollback**
```bash
git checkout refactor-backup
git checkout -b refactor-rollback-[timestamp]
```

2. **Identify Issue**
   - Run diagnostic tests
   - Check error logs
   - Identify specific commit

3. **Selective Revert**
```bash
git revert [commit-hash]
```

4. **Re-approach**
   - Smaller increments
   - More testing
   - Different strategy

---

## NOTES & REMINDERS

- **Test after each task** - Don't accumulate issues
- **Keep commits atomic** - One logical change per commit
- **Monitor performance** - Use React DevTools profiler
- **Check TypeScript** - Run `npm run type-check` frequently
- **Update tests** - Modify existing tests as components change
- **Document decisions** - Note why certain approaches were chosen

**Estimated Total Time**: 4-6 weeks (working in small chunks)
**Risk Level**: Low-Medium (incremental changes with rollback plan)
**Impact**: High (improved performance, maintainability, developer experience)