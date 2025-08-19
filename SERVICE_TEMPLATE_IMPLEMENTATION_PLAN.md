# Service Template Implementation Plan

## Overview
Implement a simple, effective service template system that allows users to create reusable service configurations with smart date handling and comprehensive testing coverage.

## Phase 1: Database Schema & Migration (Chunk 1)

### 1.1 Create Service Templates Table
```sql
-- supabase/migrations/YYYYMMDD_service_templates.sql
CREATE TABLE service_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(50) DEFAULT 'blue',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE service_templates ENABLE ROW LEVEL SECURITY;

-- Admin and team can see all templates, clients see none
CREATE POLICY "Admin and team can view all templates" ON service_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'team_member')
    )
  );

-- Only admin and team can create templates
CREATE POLICY "Admin and team can create templates" ON service_templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'team_member')
    )
  );

-- Only creator or admin can update templates
CREATE POLICY "Creator and admin can update templates" ON service_templates
  FOR UPDATE USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Only admin can delete templates
CREATE POLICY "Admin can delete templates" ON service_templates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
```

### 1.2 Create Template Milestones Table
```sql
CREATE TABLE template_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES service_templates(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  relative_start_days INTEGER DEFAULT 0, -- Days from service start
  relative_due_days INTEGER, -- Days from service start
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- No RLS needed - accessed through templates
```

### 1.3 Create Template Tasks Table
```sql
CREATE TABLE template_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_milestone_id UUID NOT NULL REFERENCES template_milestones(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  estimated_hours INTEGER,
  position INTEGER NOT NULL,
  relative_due_days INTEGER, -- Days from milestone start
  visibility VARCHAR(20) DEFAULT 'internal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- No RLS needed - accessed through templates
```

### 1.4 Testing Database Schema
**Test Cases:**
- [ ] Migration runs without errors
- [ ] RLS policies work correctly for each role
- [ ] Foreign key constraints prevent orphaned records
- [ ] Default values are applied correctly
- [ ] UUID generation works for primary keys

**Test Script:** `scripts/test-template-schema.sql`

---

## Phase 2: Backend Actions (Chunk 2)

### 2.1 Template CRUD Actions
Create: `app/actions/service-templates.ts`

```typescript
// Functions to implement:
- getServiceTemplates() // Get all templates for current user
- getServiceTemplate(id) // Get single template with milestones/tasks
- createServiceTemplate(data) // Create new template
- updateServiceTemplate(id, data) // Update existing template
- deleteServiceTemplate(id) // Delete template
- createServiceFromTemplate(templateId, serviceData) // Create service from template
```

### 2.2 Smart Date Calculation Utility
Create: `shared/lib/smart-dates.ts`

```typescript
// Functions to implement:
- calculateMilestoneDate(serviceStartDate, relativeDays)
- calculateTaskDate(milestoneDate, relativeDays)
- parseRelativeDateString("2 weeks", "1 month", etc.)
- generateDateSuggestions() // Return common relative dates
```

### 2.3 Testing Backend Actions
**Test Cases:**
- [ ] CRUD operations work for all user roles
- [ ] Error handling for invalid data
- [ ] Permission checks prevent unauthorized access
- [ ] Smart date calculations are accurate
- [ ] Template creation from existing service works
- [ ] Service creation from template works
- [ ] Cascade deletes work properly

**Test Script:** `scripts/test-template-actions.js`

---

## Phase 3: Frontend Components (Chunk 3)

### 3.1 Template Selector Component
Create: `app/(dashboard)/services/components/template-selector.tsx`

**Features:**
- Grid/list view of available templates
- Preview milestone structure
- Smart date preview
- Search/filter templates
- "Create from Template" action

### 3.2 Template Creation Dialog
Create: `app/(dashboard)/services/components/create-template-dialog.tsx`

**Features:**
- Save current service as template
- Name and description input
- Preview generated template
- Confirmation before saving

### 3.3 Enhanced Service Creation
Modify: `app/(dashboard)/services/components/create-service-button.tsx`

**Enhancements:**
- Add "Use Template" tab
- Template selection interface
- Smart date configuration
- Preview before creation

### 3.4 Template Management Page
Create: `app/(dashboard)/services/templates/page.tsx`

**Features:**
- List all templates
- Edit/delete templates
- Preview template structure
- Create new template from scratch

### 3.5 Testing Frontend Components
**Test Cases:**
- [ ] All buttons respond correctly
- [ ] Template selection updates preview
- [ ] Smart date inputs work properly
- [ ] Form validation prevents invalid submissions
- [ ] Loading states display correctly
- [ ] Error states show appropriate messages
- [ ] Mobile responsiveness works
- [ ] Keyboard navigation functions

**Test Script:** `scripts/test-template-ui.js`

---

## Phase 4: Smart Date System (Chunk 4)

### 4.1 Relative Date Parser
**Supported Formats:**
- "1 week", "2 weeks", "1 month", "2 months"
- "1 day", "3 days", "1 week later"
- "same day", "next day"

### 4.2 Date Calculation Engine
**Logic:**
- Service start date as anchor
- Milestone dates calculated from service start
- Task dates calculated from milestone start
- Weekend/holiday awareness (optional)

### 4.3 UI Date Inputs
**Components:**
- Relative date dropdown
- Custom date input
- Date preview display
- Validation feedback

### 4.4 Testing Smart Dates
**Test Cases:**
- [ ] All relative date formats parse correctly
- [ ] Date calculations are accurate across time zones
- [ ] Edge cases (leap years, month boundaries) work
- [ ] Invalid date strings show errors
- [ ] Date preview updates in real-time
- [ ] Generated dates respect business logic

**Test Script:** `scripts/test-smart-dates.js`

---

## Phase 5: Default Templates (Chunk 5)

### 5.1 Create Default Templates
**Templates to Create:**
1. **Website Project**
   - Discovery & Planning (0 days, due in 1 week)
   - Design (1 week, due in 3 weeks)
   - Development (3 weeks, due in 8 weeks)
   - Launch & Testing (8 weeks, due in 10 weeks)

2. **Marketing Campaign**
   - Planning & Strategy (0 days, due in 1 week)
   - Content Creation (1 week, due in 3 weeks)
   - Campaign Launch (3 weeks, due in 4 weeks)
   - Analysis & Reporting (4 weeks, due in 6 weeks)

3. **Consulting Engagement**
   - Client Onboarding (0 days, due in 3 days)
   - Needs Analysis (3 days, due in 1 week)
   - Strategy Development (1 week, due in 3 weeks)
   - Implementation Support (3 weeks, due in 8 weeks)

### 5.2 Template Seeding Script
Create: `scripts/seed-default-templates.js`

### 5.3 Testing Default Templates
**Test Cases:**
- [ ] Default templates are created correctly
- [ ] Templates contain proper milestone structure
- [ ] Smart dates are configured appropriately
- [ ] Templates are accessible to appropriate roles

---

## Phase 6: Role-Based Testing (Chunk 6)

### 6.1 Admin Role Testing
**Test Scenarios:**
- [ ] Can create templates
- [ ] Can edit any template
- [ ] Can delete any template
- [ ] Can create services from templates
- [ ] Can access template management page

### 6.2 Team Member Role Testing
**Test Scenarios:**
- [ ] Can view all templates
- [ ] Can create templates
- [ ] Can edit own templates only
- [ ] Cannot delete templates
- [ ] Can create services from templates

### 6.3 Client Role Testing
**Test Scenarios:**
- [ ] Cannot access templates
- [ ] Cannot see template creation options
- [ ] Template management redirects appropriately
- [ ] Services created from templates work normally

### 6.4 Testing Script
Create: `scripts/test-template-roles.js`

---

## Phase 7: End-to-End Testing (Chunk 7)

### 7.1 Complete Template Workflow
**Test Scenario 1: Create Template from Existing Service**
1. Login as admin
2. Create service with custom milestones
3. Navigate to service detail page
4. Click "Save as Template"
5. Fill template details
6. Verify template appears in template list
7. Test template preview functionality

**Test Scenario 2: Create Service from Template**
1. Login as team member
2. Navigate to services page
3. Click "New Service" → "Use Template"
4. Select template
5. Configure smart dates
6. Preview generated structure
7. Create service
8. Verify service matches template structure
9. Verify dates are calculated correctly

**Test Scenario 3: Template Management**
1. Login as admin
2. Navigate to template management
3. Create new template from scratch
4. Add milestones with smart dates
5. Add tasks with relative timing
6. Save template
7. Edit template details
8. Delete template
9. Verify all operations complete successfully

### 7.2 Error Handling Testing
**Test Scenarios:**
- [ ] Invalid template data submission
- [ ] Network errors during template operations
- [ ] Concurrent template editing
- [ ] Template deletion with dependent services
- [ ] Missing required fields
- [ ] Invalid date configurations

### 7.3 Performance Testing
**Test Scenarios:**
- [ ] Large number of templates (100+)
- [ ] Complex templates with many milestones/tasks
- [ ] Rapid template switching
- [ ] Bulk service creation from templates

### 7.4 Testing Scripts
- `scripts/test-template-e2e.js` - Main E2E tests
- `scripts/test-template-performance.js` - Performance tests
- `scripts/test-template-errors.js` - Error handling tests

---

## Phase 8: Integration & Polish (Chunk 8)

### 8.1 Navigation Updates
- Add template management to admin sidebar
- Add template creation shortcuts
- Update service creation flow

### 8.2 Documentation Updates
- Update CLAUDE.md with template system
- Add template best practices
- Document smart date formats

### 8.3 Final Testing Checklist
**Functionality:**
- [ ] All CRUD operations work
- [ ] Smart dates calculate correctly
- [ ] Role-based access enforced
- [ ] UI responsive on all devices
- [ ] Error messages are helpful
- [ ] Loading states prevent double-submission

**Data Integrity:**
- [ ] No orphaned template records
- [ ] Cascade deletes work properly
- [ ] Concurrent access safe
- [ ] Database constraints enforced

**User Experience:**
- [ ] Intuitive template selection
- [ ] Clear date configuration
- [ ] Helpful preview functionality
- [ ] Smooth creation workflow
- [ ] Accessible for all abilities

**Performance:**
- [ ] Template loading is fast
- [ ] Service creation responsive
- [ ] Database queries optimized
- [ ] No memory leaks in UI

---

## Testing Commands

```bash
# Schema testing
psql $DATABASE_URL -f scripts/test-template-schema.sql

# Backend testing
node scripts/test-template-actions.js
node scripts/test-smart-dates.js

# Role testing
node scripts/test-template-roles.js

# E2E testing
node scripts/test-template-e2e.js

# Performance testing
node scripts/test-template-performance.js

# Full test suite
npm run test:templates
```

---

## Success Criteria

### MVP Complete When:
1. ✅ Database schema created and tested
2. ✅ Basic CRUD operations working
3. ✅ Template selector in service creation
4. ✅ Smart date calculations functional
5. ✅ Default templates available
6. ✅ Role-based access working
7. ✅ All E2E tests passing

### Production Ready When:
1. ✅ All error cases handled gracefully
2. ✅ Performance tests pass
3. ✅ Mobile experience optimized
4. ✅ Documentation updated
5. ✅ Admin can manage templates
6. ✅ Users report positive experience

---

## Risk Mitigation

### High Risk Areas:
1. **Smart Date Logic** - Complex calculations, test thoroughly
2. **Role Permissions** - Security critical, verify each role
3. **Template Deletion** - Could affect multiple services
4. **Concurrent Access** - Multiple users editing same template

### Mitigation Strategies:
- Comprehensive test coverage for each risk area
- Gradual rollout with feature flags
- Database backups before migration
- User acceptance testing before full release