# Assignee System Implementation Plan

## Overview
Implement a comprehensive assignee system for services, milestones, and tasks with role-based visibility and seamless UI/UX interactions.

## Current State Analysis
- ✅ Tasks have `assigned_to` field in database
- ❌ Milestones lack assignee field
- ❌ No UI for assigning tasks/milestones
- ❌ Milestone sidebar and kanban toggles not synchronized
- ❌ Edit milestone button non-functional
- ❌ Client task visibility not implemented

## Implementation Phases

### Phase 1: Database Schema Updates (30 mins)
**Goal:** Add assignee support to milestones table

#### Step 1.1: Create Migration File
```sql
-- Add assignee_id to milestones table
ALTER TABLE milestones 
ADD COLUMN assignee_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_milestones_assignee ON milestones(assignee_id);

-- Add visibility field to tasks for client visibility control
ALTER TABLE tasks
ADD COLUMN visibility text DEFAULT 'internal' 
CHECK (visibility IN ('internal', 'client'));

-- Update existing tasks: if assigned to client, make visible
UPDATE tasks t
SET visibility = 'client'
FROM profiles p
WHERE t.assigned_to = p.id AND p.role = 'client';
```

#### Step 1.2: Update RLS Policies
```sql
-- Policy for clients to see their assigned tasks
CREATE POLICY "Clients can view assigned tasks"
ON tasks FOR SELECT
TO authenticated
USING (
  assigned_to = auth.uid() 
  OR 
  visibility = 'client' AND EXISTS (
    SELECT 1 FROM milestones m
    JOIN services s ON m.service_id = s.id
    WHERE m.id = tasks.milestone_id
    AND s.client_id = auth.uid()
  )
);
```

#### Testing Checklist:
- [ ] Migration runs successfully
- [ ] Existing data preserved
- [ ] RLS policies work correctly
- [ ] Indexes created

---

### Phase 2: Type System Updates (20 mins)
**Goal:** Update TypeScript types to match database schema

#### Step 2.1: Update shared/types/index.ts
```typescript
// Update Milestone interface
export interface Milestone {
  id: string
  service_id: string
  title: string
  description: string | null
  due_date: string | null
  status: MilestoneStatus
  order_index: number | null
  assignee_id: string | null // Add this
  created_at: string
  assignee?: Profile // Add relation
}

// Update Task interface
export interface Task {
  // ... existing fields
  visibility: 'internal' | 'client' // Add this
}

// Create extended types for UI
export interface MilestoneWithAssignee extends Milestone {
  assignee: Profile | null
}

export interface TaskWithAssignee extends Task {
  assigned_to: Profile | null
}
```

#### Testing Checklist:
- [ ] TypeScript builds without errors
- [ ] No type mismatches
- [ ] Autocomplete works in IDE

---

### Phase 3: Backend Actions Updates (45 mins)
**Goal:** Add assignee management to server actions

#### Step 3.1: Update app/actions/milestones.ts
```typescript
// Add assignee support to createMilestone
export async function createMilestone(data: {
  service_id: string
  name: string
  description?: string
  due_date?: string
  assignee_id?: string // Add this
  position?: number
})

// Add updateMilestone function
export async function updateMilestone(
  id: string,
  data: {
    name?: string
    description?: string
    due_date?: string
    assignee_id?: string | null
    status?: MilestoneStatus
  }
)

// Update getMilestones to include assignee
.select(`
  *,
  assignee:profiles!assignee_id(
    id,
    full_name,
    email,
    avatar_url,
    role
  ),
  tasks(...)
`)
```

#### Step 3.2: Update app/actions/tasks.ts
```typescript
// Add assignTask function
export async function assignTask(
  taskId: string,
  assigneeId: string | null,
  visibility?: 'internal' | 'client'
) {
  // Validate assignee is valid user
  // Update task assignment
  // If assigning to client, set visibility = 'client'
  // Revalidate paths
}

// Update createTask to handle visibility
export async function createTask(data: {
  // ... existing fields
  visibility?: 'internal' | 'client'
})
```

#### Step 3.3: Create app/actions/assignments.ts
```typescript
// Get assignable users for a service
export async function getAssignableUsers(serviceId: string) {
  // Get all team members and admins
  // Get the client for this service
  // Return formatted list for UI
}

// Bulk assign tasks
export async function bulkAssignTasks(
  taskIds: string[],
  assigneeId: string | null
)
```

#### Testing Checklist:
- [ ] All CRUD operations work
- [ ] Role-based access enforced
- [ ] Error handling complete
- [ ] Optimistic updates work

---

### Phase 4: Assignment UI Components (1 hour)
**Goal:** Create reusable assignment components

#### Step 4.1: Create shared/components/ui/assignee-selector.tsx
```typescript
interface AssigneeSelectorProps {
  value: string | null
  onChange: (userId: string | null) => void
  users: Profile[]
  allowClient?: boolean
  placeholder?: string
}

// Features:
// - Search users by name/email
// - Show role badges
// - Avatar preview
// - Clear selection option
// - Loading states
```

#### Step 4.2: Create shared/components/ui/assignee-avatar.tsx
```typescript
interface AssigneeAvatarProps {
  user: Profile | null
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  onClick?: () => void
  editable?: boolean
}

// Features:
// - Click to assign (if editable)
// - Tooltip with user info
// - Empty state with dashed border
// - Role indicator
```

#### Step 4.3: Update task-card.tsx
```typescript
// Add assignment functionality
const handleAssignment = async () => {
  // Open assignee selector popover
  // Update task assignment
  // Show loading state
  // Handle errors
}

// Replace static avatar with:
<AssigneeAvatar
  user={task.assigned_to}
  size="sm"
  editable={true}
  onClick={handleAssignment}
/>
```

#### Testing Checklist:
- [ ] Components render correctly
- [ ] Assignment UI intuitive
- [ ] Loading states work
- [ ] Error handling present
- [ ] Responsive on all devices

---

### Phase 5: Milestone-Kanban Synchronization (45 mins)
**Goal:** Sync milestone selection between sidebar and kanban

#### Step 5.1: Create shared context/service-context.tsx
```typescript
interface ServiceContextValue {
  selectedMilestoneId: string | null
  setSelectedMilestone: (id: string | null) => void
  milestones: MilestoneWithAssignee[]
  serviceId: string
}

// Wrap service detail page with provider
// Both sidebar and kanban use same context
```

#### Step 5.2: Update milestone-sidebar.tsx
```typescript
// Use context for selection
const { selectedMilestoneId, setSelectedMilestone } = useServiceContext()

// Add milestone assignee display
// Add edit milestone button functionality
// Highlight selected milestone
// Sync with kanban selection
```

#### Step 5.3: Update kanban-board.tsx
```typescript
// Use context for selection
// Add milestone toggle pills
// Sync with sidebar selection
// Show milestone assignee in header
```

#### Testing Checklist:
- [ ] Selection syncs bidirectionally
- [ ] Visual feedback clear
- [ ] Smooth transitions
- [ ] Mobile responsive

---

### Phase 6: Client View Implementation (45 mins)
**Goal:** Show assigned tasks to clients appropriately

#### Step 6.1: Update client-timeline.tsx
```typescript
// Add assigned tasks section
// Show only client-visible tasks
// Group by milestone
// Show task status and due dates
// Add progress indicators
```

#### Step 6.2: Create client-tasks.tsx component
```typescript
// Display assigned tasks
// Show task details
// Allow status updates (if permitted)
// Show attachments/comments
```

#### Step 6.3: Update client dashboard
```typescript
// Add "My Tasks" widget
// Show task count badges
// Quick access to assigned items
```

#### Testing Checklist:
- [ ] Clients see only their tasks
- [ ] Internal tasks hidden
- [ ] UI appropriate for clients
- [ ] Mobile responsive

---

### Phase 7: Edit Milestone Functionality (30 mins)
**Goal:** Fix and enhance milestone editing

#### Step 7.1: Create edit-milestone-dialog.tsx
```typescript
// Full milestone edit form
// Assignee selector
// Status updates
// Due date picker
// Description editor
```

#### Step 7.2: Update milestone-sidebar.tsx
```typescript
// Add edit button to each milestone
// Open edit dialog on click
// Handle updates optimistically
// Show loading states
```

#### Testing Checklist:
- [ ] Edit dialog opens correctly
- [ ] All fields editable
- [ ] Validation works
- [ ] Updates reflect immediately

---

### Phase 8: Comprehensive Testing (1 hour)
**Goal:** Ensure everything works perfectly

#### Step 8.1: Create Playwright Tests
```javascript
// test-assignee-system.js
// Test scenarios:
// 1. Admin assigns task to team member
// 2. Admin assigns task to client
// 3. Client views their assigned tasks
// 4. Team member assigns milestone to admin
// 5. Milestone-kanban sync works
// 6. Edit milestone functionality
// 7. Bulk assignment operations
// 8. Permission checks (negative tests)
```

#### Step 8.2: Test All Viewports
```javascript
// Test on:
// - Mobile (320px, 375px)
// - Tablet (768px)
// - Desktop (1024px, 1920px)
// - Check touch interactions
// - Verify drag-drop with assignments
```

#### Step 8.3: Test All Roles
```javascript
// Admin flow:
// - Can assign anyone
// - Sees all tasks
// - Can edit all milestones

// Team flow:
// - Can assign tasks
// - Cannot assign milestones to clients
// - Sees all tasks

// Client flow:
// - Sees only assigned tasks
// - Cannot assign tasks
// - Limited milestone visibility
```

#### Testing Checklist:
- [ ] All user flows work
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Accessibility standards met
- [ ] Real-time updates work

---

## Implementation Order

1. **Database & Types** (50 mins)
   - Run migrations
   - Update TypeScript types
   - Test with psql

2. **Backend Actions** (45 mins)
   - Update server actions
   - Add assignment functions
   - Test with Postman/curl

3. **Assignment Components** (1 hour)
   - Build assignee selector
   - Create assignee avatar
   - Test in isolation

4. **Integrate with Tasks** (30 mins)
   - Update task cards
   - Add assignment UI
   - Test assignment flow

5. **Milestone Features** (45 mins)
   - Add milestone assignees
   - Fix edit functionality
   - Test milestone management

6. **Synchronization** (45 mins)
   - Implement service context
   - Sync sidebar and kanban
   - Test selection states

7. **Client Features** (45 mins)
   - Update client views
   - Add task visibility
   - Test client experience

8. **Final Testing** (1 hour)
   - Run Playwright suite
   - Test all viewports
   - Verify all roles

**Total Time: ~6 hours**

## Success Criteria

### Functionality
- ✅ Tasks can be assigned to any user
- ✅ Milestones can be assigned to team/admin only
- ✅ Clients see only their assigned tasks
- ✅ Milestone selection syncs between UI elements
- ✅ Edit milestone button works
- ✅ Person icon clicks to assign

### User Experience
- ✅ Assignment is intuitive (single click)
- ✅ Visual feedback immediate
- ✅ Loading states clear
- ✅ Error messages helpful
- ✅ Mobile experience smooth

### Performance
- ✅ Assignments update < 500ms
- ✅ No UI blocking
- ✅ Optimistic updates work
- ✅ Real-time sync functional

### Security
- ✅ RLS policies enforced
- ✅ Role permissions correct
- ✅ No data leakage
- ✅ Client isolation complete

## Risk Mitigation

### Potential Issues & Solutions

1. **RLS Policy Conflicts**
   - Test policies in isolation first
   - Use Supabase dashboard for debugging
   - Have rollback migration ready

2. **Type Mismatches**
   - Update types incrementally
   - Use strict TypeScript
   - Test build after each change

3. **UI State Management**
   - Use React Context for shared state
   - Implement optimistic updates
   - Handle race conditions

4. **Mobile Interactions**
   - Test touch events early
   - Provide alternative interactions
   - Use larger touch targets

5. **Performance Issues**
   - Index foreign keys
   - Limit query depth
   - Implement pagination if needed

## Notes for Implementation

### Key Principles
1. **Keep it simple** - Don't over-engineer
2. **Test incrementally** - Verify each step
3. **User-first** - Prioritize UX over features
4. **Real data only** - No mocks or workarounds
5. **Mobile-first** - Design for small screens

### API Considerations
- Use Supabase's built-in relations
- Leverage RLS for security
- Keep queries efficient
- Handle errors gracefully

### UI/UX Guidelines
- Immediate visual feedback
- Clear affordances for clickable elements
- Consistent interaction patterns
- Accessible color contrasts
- Keyboard navigation support

### Testing Strategy
- Unit test server actions
- Integration test with real database
- E2E test complete user flows
- Visual regression testing
- Performance profiling

## Completion Checklist

### Pre-Implementation
- [ ] Review plan with team
- [ ] Backup database
- [ ] Create feature branch
- [ ] Set up test environment

### During Implementation
- [ ] Follow plan sequentially
- [ ] Test after each phase
- [ ] Document any deviations
- [ ] Keep commits atomic

### Post-Implementation
- [ ] Run full test suite
- [ ] Update documentation
- [ ] Create demo video
- [ ] Deploy to staging
- [ ] Monitor for issues

## Emergency Rollback Plan

If critical issues arise:
1. Revert database migration
2. Restore previous code version
3. Clear cache and rebuild
4. Notify team of rollback
5. Document issues for fix

---

*This plan provides a comprehensive, step-by-step approach to implementing the assignee system while maintaining code quality, user experience, and system stability.*