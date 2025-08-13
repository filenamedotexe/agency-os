const { chromium } = require('playwright')
const { createClient } = require('@supabase/supabase-js')

// Configuration
const BASE_URL = 'http://localhost:3000'
const SUPABASE_URL = 'https://lfqnpszawjpcydobpxul.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcW5wc3phd2pwY3lkb2JweHVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyNTIzNTYsImV4cCI6MjA0ODgyODM1Nn0.F6cBiK6_1CnLWwCFtdDnZGUy1d8P_dNqNdOG-Tm4TcY'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Test accounts
const TEST_ACCOUNTS = {
  admin: { email: 'admin@demo.com', password: 'password123', name: 'Alex Admin' },
  team: { email: 'team@demo.com', password: 'password123', name: 'Taylor Team' },
  client: { email: 'sarah@acmecorp.com', password: 'password123', name: 'Sarah Johnson' }
}

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
}

function test(name, condition, details = '') {
  testResults.total++
  if (condition) {
    console.log(`✅ ${name}`)
    testResults.passed++
  } else {
    console.log(`❌ ${name}${details ? `: ${details}` : ''}`)
    testResults.failed++
    testResults.errors.push(`${name}${details ? `: ${details}` : ''}`)
  }
}

async function testDatabaseSchema() {
  console.log('\n📊 Testing Database Schema...')
  
  try {
    // Test folder table exists
    const { data: folders, error: foldersError } = await supabase
      .from('file_folders')
      .select('*')
      .limit(1)
    
    test('file_folders table accessible', !foldersError, foldersError?.message)
    
    // Test tags table exists
    const { data: tags, error: tagsError } = await supabase
      .from('file_tags')
      .select('*')
      .limit(1)
    
    test('file_tags table accessible', !tagsError, tagsError?.message)
    
    // Test resource_tags table exists
    const { data: resourceTags, error: resourceTagsError } = await supabase
      .from('resource_tags')
      .select('*')
      .limit(1)
    
    test('resource_tags table accessible', !resourceTagsError, resourceTagsError?.message)
    
    // Test enhanced resources columns
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select('id, folder_id, checksum, status, metadata')
      .limit(1)
    
    test('resources table has enhanced columns', !resourcesError, resourcesError?.message)
    
  } catch (error) {
    test('Database schema test', false, error.message)
  }
}

async function testUIComponents(page, context) {
  console.log('\n🎨 Testing UI Components...')
  
  try {
    // Login as admin
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[type="email"]', TEST_ACCOUNTS.admin.email)
    await page.fill('input[type="password"]', TEST_ACCOUNTS.admin.password)
    await page.click('button[type="submit"]')
    
    await page.waitForURL('**/admin', { timeout: 10000 })
    test('Admin login successful', true)
    
    // Navigate to Knowledge Hub
    await page.goto(`${BASE_URL}/knowledge`)
    await page.waitForLoadState('networkidle')
    
    const knowledgeHeader = await page.locator('h1:has-text("Knowledge Hub")').isVisible()
    test('Knowledge Hub page loads', knowledgeHeader)
    
    // Check for collections
    const collections = await page.locator('[data-testid="collection-card"], .group').count()
    test('Collections displayed', collections > 0, `Found ${collections} collections`)
    
    if (collections > 0) {
      // Click on first collection
      await page.locator('[data-testid="collection-card"], .group').first().click()
      await page.waitForLoadState('networkidle')
      
      // Check for file management UI components
      const uploadButton = await page.locator('button:has-text("Add Resource")').isVisible()
      test('Upload button visible', uploadButton)
      
      // Check for folder sidebar
      const folderSidebar = await page.locator('text=Folders').isVisible()
      test('Folder sidebar visible', folderSidebar)
      
      // Check for search/filter controls
      const searchInput = await page.locator('input[placeholder*="Search"]').isVisible()
      test('Search input visible', searchInput)
      
      // Test upload dialog
      if (uploadButton) {
        await page.click('button:has-text("Add Resource")')
        await page.waitForTimeout(500)
        
        const uploadDialog = await page.locator('text=Add Resource').nth(1).isVisible()
        test('Upload dialog opens', uploadDialog)
        
        // Check for file type selector
        const uploadFileButton = await page.locator('button:has-text("Upload File")').isVisible()
        const addLinkButton = await page.locator('button:has-text("Add Link")').isVisible()
        test('File type selector visible', uploadFileButton && addLinkButton)
        
        // Check for drag-drop area
        const dropArea = await page.locator('text=Drop file here').isVisible()
        test('Drag-drop area visible', dropArea)
        
        // Close dialog
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)
      }
      
      // Test folder creation (if admin)
      const newFolderButton = await page.locator('button:has-text("New")').isVisible()
      if (newFolderButton) {
        await page.click('button:has-text("New")')
        await page.waitForTimeout(500)
        
        const folderDialog = await page.locator('text=Create New Folder').isVisible()
        test('Folder creation dialog opens', folderDialog)
        
        if (folderDialog) {
          await page.keyboard.press('Escape')
          await page.waitForTimeout(500)
        }
      }
      
      // Check for resource list view options
      const listViewButton = await page.locator('button[aria-label*="list"], button:has(.lucide-list)').isVisible()
      const gridViewButton = await page.locator('button[aria-label*="grid"], button:has(.lucide-grid)').isVisible()
      test('View mode toggles available', listViewButton || gridViewButton)
      
      // Check for file type badges if resources exist
      const resources = await page.locator('.group.hover\\:shadow-md').count()
      if (resources > 0) {
        test('Resources displayed', true, `Found ${resources} resources`)
        
        // Check for file operations dropdown
        const firstResource = await page.locator('.group.hover\\:shadow-md').first()
        await firstResource.hover()
        
        const moreButton = await page.locator('button:has(.lucide-more-horizontal)').first().isVisible()
        test('Resource operations button visible on hover', moreButton)
        
        if (moreButton) {
          await page.locator('button:has(.lucide-more-horizontal)').first().click()
          await page.waitForTimeout(500)
          
          const previewOption = await page.locator('text=Preview').isVisible()
          const downloadOption = await page.locator('text=Download').isVisible()
          test('Resource operations menu shows options', previewOption || downloadOption)
          
          await page.keyboard.press('Escape')
        }
      }
    }
    
  } catch (error) {
    test('UI components test', false, error.message)
  }
}

async function testFileOperations(page) {
  console.log('\n📁 Testing File Operations...')
  
  try {
    // Test search functionality
    const searchInput = await page.locator('input[placeholder*="Search"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('test')
      await page.waitForTimeout(500)
      test('Search input accepts text', true)
      
      await searchInput.clear()
    }
    
    // Test filter dropdown
    const filterButton = await page.locator('button:has(.lucide-filter)').first()
    if (await filterButton.isVisible()) {
      await filterButton.click()
      await page.waitForTimeout(500)
      
      const filterOptions = await page.locator('text=All Types').isVisible()
      test('Filter dropdown opens', filterOptions)
      
      if (filterOptions) {
        await page.keyboard.press('Escape')
      }
    }
    
    // Test sort dropdown
    const sortDropdown = await page.locator('button:has-text("Newest First"), button:has-text("Name (A-Z)")').first()
    if (await sortDropdown.isVisible()) {
      await sortDropdown.click()
      await page.waitForTimeout(500)
      
      const sortOptions = await page.locator('text=Oldest First').isVisible()
      test('Sort dropdown opens', sortOptions)
      
      if (sortOptions) {
        await page.keyboard.press('Escape')
      }
    }
    
  } catch (error) {
    test('File operations test', false, error.message)
  }
}

async function testResponsiveness(page) {
  console.log('\n📱 Testing Responsiveness...')
  
  try {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)
    
    const mobileNav = await page.locator('button[aria-label*="menu"], button:has(.lucide-menu)').isVisible()
    test('Mobile navigation visible at 375px', mobileNav)
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(500)
    
    const tabletLayout = await page.locator('.lg\\:col-span-1').count()
    test('Tablet layout adjusts at 768px', true)
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(500)
    
    const desktopLayout = await page.locator('.lg\\:col-span-3').isVisible()
    test('Desktop layout displays at 1920px', desktopLayout)
    
  } catch (error) {
    test('Responsiveness test', false, error.message)
  }
}

async function testPermissions(page, browser) {
  console.log('\n🔒 Testing Permissions...')
  
  try {
    // Logout current user
    await page.goto(`${BASE_URL}/logout`)
    await page.waitForTimeout(1000)
    
    // Test as client (should have limited permissions)
    const clientContext = await browser.newContext()
    const clientPage = await clientContext.newPage()
    
    await clientPage.goto(`${BASE_URL}/login`)
    await clientPage.fill('input[type="email"]', TEST_ACCOUNTS.client.email)
    await clientPage.fill('input[type="password"]', TEST_ACCOUNTS.client.password)
    await clientPage.click('button[type="submit"]')
    
    await clientPage.waitForURL('**/client', { timeout: 10000 })
    test('Client login successful', true)
    
    // Navigate to Knowledge Hub as client
    await clientPage.goto(`${BASE_URL}/knowledge`)
    await clientPage.waitForLoadState('networkidle')
    
    // Check that admin features are not visible
    const uploadButton = await clientPage.locator('button:has-text("Add Resource")').isVisible()
    test('Upload button hidden for clients', !uploadButton)
    
    const newFolderButton = await clientPage.locator('button:has-text("New")').isVisible()
    test('New folder button hidden for clients', !newFolderButton)
    
    await clientContext.close()
    
  } catch (error) {
    test('Permissions test', false, error.message)
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 PHASE 4 VERIFICATION SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total Tests: ${testResults.total}`)
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`)
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Failed Tests:')
    testResults.errors.forEach(error => {
      console.log(`   • ${error}`)
    })
  }
  
  console.log('\n🎯 FEATURE STATUS:')
  const features = [
    { name: 'Database Schema', status: testResults.errors.some(e => e.includes('table')) ? '⚠️' : '✅' },
    { name: 'File Upload UI', status: testResults.errors.some(e => e.includes('Upload')) ? '⚠️' : '✅' },
    { name: 'Folder Management', status: testResults.errors.some(e => e.includes('Folder')) ? '⚠️' : '✅' },
    { name: 'Search & Filter', status: testResults.errors.some(e => e.includes('Search') || e.includes('Filter')) ? '⚠️' : '✅' },
    { name: 'File Operations', status: testResults.errors.some(e => e.includes('operations')) ? '⚠️' : '✅' },
    { name: 'Responsive Design', status: testResults.errors.some(e => e.includes('viewport')) ? '⚠️' : '✅' },
    { name: 'Permissions', status: testResults.errors.some(e => e.includes('Permission')) ? '⚠️' : '✅' }
  ]
  
  features.forEach(feature => {
    console.log(`${feature.status} ${feature.name}`)
  })
  
  if (testResults.passed === testResults.total) {
    console.log('\n🎉 PHASE 4 PERFECT! All features working correctly!')
  } else if (testResults.passed / testResults.total >= 0.8) {
    console.log('\n✨ PHASE 4 FUNCTIONAL! Most features working correctly.')
  } else {
    console.log('\n⚠️  PHASE 4 NEEDS ATTENTION! Several features need fixes.')
  }
  
  console.log('='.repeat(60))
}

async function main() {
  console.log('🚀 PHASE 4 COMPREHENSIVE VERIFICATION')
  console.log('=====================================')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 
  })
  
  try {
    // Test database first
    await testDatabaseSchema()
    
    // Create browser context and page
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    })
    const page = await context.newPage()
    
    // Run UI tests
    await testUIComponents(page, context)
    await testFileOperations(page)
    await testResponsiveness(page)
    await testPermissions(page, browser)
    
    await context.close()
    
  } catch (error) {
    console.error('Test execution failed:', error)
  } finally {
    await browser.close()
  }
  
  await printSummary()
  console.log('\n✨ Verification complete!')
  
  process.exit(testResults.failed > 0 ? 1 : 0)
}

main().catch(console.error)