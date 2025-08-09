# AgencyOS Testing Strategy

## Overview
We use **Playwright** for end-to-end (E2E) testing to ensure our application works correctly across different browsers and viewports.

## Why Playwright?
- **Cross-browser testing**: Test on Chromium, Firefox, and WebKit
- **Mobile testing**: Built-in device emulation for mobile and tablet viewports
- **Parallel execution**: Fast test execution out of the box
- **Auto-waiting**: Automatically waits for elements to be ready
- **Great debugging**: Time-travel debugging, screenshots, and videos

## Test Commands

```bash
# Run all tests
npm test

# Run tests with UI mode (recommended for development)
npm run test:ui

# Debug tests interactively
npm run test:debug

# Run tests in headed mode (see browser)
npm run test:headed

# View test report after running tests
npm run test:report
```

## Test Coverage

### 1. Authentication (`e2e/auth.spec.ts`)
- ✅ Redirect to login when not authenticated
- ✅ Login with admin credentials
- ✅ Login with client credentials
- ✅ Show error with invalid credentials
- ✅ Navigate between login and signup

### 2. Clients Page (`e2e/clients.spec.ts`)
- ✅ Display clients table
- ✅ Search functionality
- ✅ Column visibility toggle
- ✅ Action menu positioning (right-aligned, non-draggable)
- ✅ Drag and drop column reordering
- ✅ Column order persistence in localStorage
- ✅ Add client dialog validation
- ✅ Edit client dialog functionality
- ✅ Responsive design (mobile, tablet, desktop, 4K)
- ✅ Duda integration fields

## Automated Testing Workflow

### Before Each Feature
1. Write E2E tests for the feature
2. Run tests to ensure they fail (TDD approach)
3. Implement the feature
4. Run tests to ensure they pass

### Before Each Commit
```bash
# Run build to check TypeScript
npm run build

# Run all tests
npm test

# If tests pass, commit changes
git add .
git commit -m "feat: your feature description"
```

### Testing Checklist for New Features

#### 1. Functionality Tests
- [ ] Core functionality works as expected
- [ ] Edge cases are handled
- [ ] Error states show appropriate messages
- [ ] Loading states are displayed
- [ ] Form validation works correctly

#### 2. Responsive Design Tests
- [ ] Mobile (375px) - Card/compact view
- [ ] Tablet (768px) - Adjusted layout
- [ ] Desktop (1920px) - Full layout
- [ ] 4K (3840px) - No stretching/breaking

#### 3. Interaction Tests
- [ ] Click interactions work
- [ ] Keyboard navigation works
- [ ] Drag and drop (if applicable)
- [ ] Form submissions
- [ ] Modal/dialog interactions

#### 4. Data Persistence Tests
- [ ] Changes save to database
- [ ] LocalStorage (if used) persists correctly
- [ ] Page refresh maintains state
- [ ] Navigation maintains state

#### 5. Performance Tests
- [ ] Page loads quickly
- [ ] Interactions are responsive
- [ ] No memory leaks
- [ ] Efficient API calls

## Writing New Tests

### Test Structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/login');
    // ... login steps
  });

  test('should do something specific', async ({ page }) => {
    // Arrange
    await page.goto('/your-page');
    
    // Act
    await page.click('button:has-text("Action")');
    
    // Assert
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

### Best Practices
1. **Use semantic selectors**: Prefer text content, roles, and data-testid
2. **Wait for elements**: Use Playwright's auto-waiting, add explicit waits only when needed
3. **Test user journeys**: Test complete workflows, not just individual components
4. **Clean test data**: Each test should be independent
5. **Descriptive test names**: Test names should describe what is being tested

## Continuous Integration

### GitHub Actions (Future Enhancement)
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging Failed Tests

1. **Run specific test**:
   ```bash
   npx playwright test e2e/clients.spec.ts:45
   ```

2. **Use UI mode** for step-by-step debugging:
   ```bash
   npm run test:ui
   ```

3. **Check screenshots/videos** in `test-results/` folder

4. **Use debug mode**:
   ```bash
   npm run test:debug
   ```

## Performance Monitoring (Future Enhancement)

Consider adding:
- **Sentry** for production error monitoring
- **Lighthouse CI** for performance metrics
- **Bundle size tracking** with size-limit

## Quick Test Commands

```bash
# Test authentication only
npx playwright test auth

# Test clients page only
npx playwright test clients

# Test specific browser
npx playwright test --project=chromium

# Test mobile only
npx playwright test --project="Mobile Chrome"
```

## Maintenance

- Review and update tests when features change
- Add new tests for new features
- Remove tests for deprecated features
- Keep test data up-to-date
- Regular test suite performance review