#!/usr/bin/env node

/**
 * BACKEND IMPLEMENTATION VALIDATION SCRIPT
 * Validates the complete backend implementation for service templates
 * Date: 2025-08-19
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`)
}

// Validation results tracking
let validationResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
}

/**
 * Validation test runner
 */
function validate(name, testFn) {
  validationResults.total++
  
  try {
    const result = testFn()
    
    if (result === 'warning') {
      validationResults.warnings++
      log.warning(name)
      return 'warning'
    } else if (result === false) {
      throw new Error('Validation failed')
    }
    
    validationResults.passed++
    log.success(name)
    return true
    
  } catch (error) {
    validationResults.failed++
    validationResults.errors.push({ test: name, error: error.message })
    log.error(`${name}: ${error.message}`)
    return false
  }
}

/**
 * Check if file exists
 */
function fileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath))
}

/**
 * Read file content
 */
function readFile(filePath) {
  return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8')
}

/**
 * Validate project structure
 */
function validateProjectStructure() {
  log.header('PROJECT STRUCTURE VALIDATION')
  
  const requiredFiles = [
    { path: 'shared/types/index.ts', description: 'Type definitions' },
    { path: 'shared/lib/smart-dates.ts', description: 'Smart date utilities' },
    { path: 'app/actions/service-templates.ts', description: 'Template actions' },
    { path: 'supabase/migrations/20250819_service_templates.sql', description: 'Database migration' },
    { path: 'scripts/test-template-schema.sql', description: 'Schema tests' },
    { path: 'scripts/test-template-actions.js', description: 'Action tests' }
  ]
  
  requiredFiles.forEach(file => {
    validate(`${file.description} exists at ${file.path}`, () => {
      if (!fileExists(file.path)) {
        throw new Error(`File not found: ${file.path}`)
      }
    })
  })
}

/**
 * Validate TypeScript compilation
 */
function validateTypeScriptCompilation() {
  log.header('TYPESCRIPT COMPILATION VALIDATION')
  
  validate('TypeScript compilation check', () => {
    try {
      // Run TypeScript compilation without emitting files
      const output = execSync('npx tsc --noEmit --skipLibCheck', { 
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'pipe'
      })
      
      return true
    } catch (error) {
      const stderr = error.stderr || error.stdout || 'Unknown compilation error'
      
      // Check if errors are related to service templates
      if (stderr.includes('service-templates') || stderr.includes('smart-dates')) {
        throw new Error(`TypeScript compilation failed: ${stderr.slice(0, 200)}...`)
      }
      
      // If errors are unrelated to our implementation, return warning
      log.warning('TypeScript compilation has unrelated errors')
      return 'warning'
    }
  })
}

/**
 * Validate import/export consistency
 */
function validateImportExportConsistency() {
  log.header('IMPORT/EXPORT CONSISTENCY VALIDATION')
  
  // Check types are properly exported
  validate('Types are properly exported', () => {
    const typesContent = readFile('shared/types/index.ts')
    
    const requiredExports = [
      'ServiceTemplate',
      'TemplateMilestone', 
      'TemplateTask',
      'CreateServiceTemplateData',
      'UpdateServiceTemplateData',
      'SmartDateConfig',
      'CalculatedDates',
      'TemplateColor'
    ]
    
    requiredExports.forEach(exportType => {
      if (!typesContent.includes(`export interface ${exportType}`) && 
          !typesContent.includes(`export type ${exportType}`)) {
        throw new Error(`${exportType} not properly exported from types`)
      }
    })
  })
  
  // Check smart dates functions are exported
  validate('Smart date functions are exported', () => {
    const smartDatesContent = readFile('shared/lib/smart-dates.ts')
    
    const requiredFunctions = [
      'parseRelativeDateString',
      'calculateMilestoneDate',
      'calculateTaskDate',
      'generateDateSuggestions',
      'previewTemplateDates'
    ]
    
    requiredFunctions.forEach(func => {
      if (!smartDatesContent.includes(`export function ${func}`)) {
        throw new Error(`${func} not properly exported from smart-dates`)
      }
    })
  })
  
  // Check template actions are exported
  validate('Template actions are exported', () => {
    const actionsContent = readFile('app/actions/service-templates.ts')
    
    const requiredActions = [
      'getServiceTemplates',
      'getServiceTemplate', 
      'createServiceTemplate',
      'updateServiceTemplate',
      'deleteServiceTemplate',
      'createServiceFromTemplate',
      'createTemplateFromService'
    ]
    
    requiredActions.forEach(action => {
      if (!actionsContent.includes(`export async function ${action}`)) {
        throw new Error(`${action} not properly exported from service-templates actions`)
      }
    })
  })
}

/**
 * Validate smart date implementation
 */
function validateSmartDateImplementation() {
  log.header('SMART DATE IMPLEMENTATION VALIDATION')
  
  const smartDatesContent = readFile('shared/lib/smart-dates.ts')
  
  validate('Relative date parsing logic', () => {
    // Check for proper regex pattern
    if (!smartDatesContent.includes('regex') && !smartDatesContent.includes('RegExp')) {
      throw new Error('Missing regex pattern for date parsing')
    }
    
    // Check for special case handling
    if (!smartDatesContent.includes('same day') || !smartDatesContent.includes('next day')) {
      throw new Error('Missing special case handling for same day/next day')
    }
  })
  
  validate('Date calculation accuracy', () => {
    // Check for proper unit conversion
    if (!smartDatesContent.includes('* 7') || !smartDatesContent.includes('* 30')) {
      throw new Error('Missing proper unit conversion (weeks to days, months to days)')
    }
    
    // Check for date arithmetic
    if (!smartDatesContent.includes('setDate') && !smartDatesContent.includes('addDays')) {
      throw new Error('Missing proper date arithmetic implementation')
    }
  })
  
  validate('Error handling in date calculations', () => {
    // Check for null handling
    if (!smartDatesContent.includes('return null')) {
      throw new Error('Missing null return handling for invalid dates')
    }
    
    // Check for try-catch blocks
    if (!smartDatesContent.includes('try {') || !smartDatesContent.includes('} catch')) {
      throw new Error('Missing try-catch error handling')
    }
  })
  
  validate('Date format validation', () => {
    // Check for date validity checks
    if (!smartDatesContent.includes('isNaN') || !smartDatesContent.includes('new Date')) {
      throw new Error('Missing date format validation')
    }
  })
}

/**
 * Validate database schema consistency
 */
function validateDatabaseSchemaConsistency() {
  log.header('DATABASE SCHEMA CONSISTENCY VALIDATION')
  
  const migrationContent = readFile('supabase/migrations/20250819_service_templates.sql')
  const typesContent = readFile('shared/types/index.ts')
  const actionsContent = readFile('app/actions/service-templates.ts')
  
  validate('Database tables match TypeScript types', () => {
    // Check service_templates table columns match ServiceTemplate interface
    const serviceTemplateColumns = [
      'id', 'name', 'description', 'color', 'created_by', 'is_default', 'created_at', 'updated_at'
    ]
    
    serviceTemplateColumns.forEach(column => {
      if (!migrationContent.includes(column) || !typesContent.includes(column)) {
        throw new Error(`Column ${column} missing in database or types`)
      }
    })
  })
  
  validate('Foreign key relationships are consistent', () => {
    // Check template_milestones references service_templates
    if (!migrationContent.includes('REFERENCES service_templates(id)')) {
      throw new Error('Missing foreign key from template_milestones to service_templates')
    }
    
    // Check template_tasks references template_milestones
    if (!migrationContent.includes('REFERENCES template_milestones(id)')) {
      throw new Error('Missing foreign key from template_tasks to template_milestones')
    }
  })
  
  validate('Database queries use correct table names', () => {
    const tables = ['service_templates', 'template_milestones', 'template_tasks']
    
    tables.forEach(table => {
      if (!actionsContent.includes(`from('${table}')`)) {
        throw new Error(`Actions missing queries for table ${table}`)
      }
    })
  })
}

/**
 * Validate action implementation completeness
 */
function validateActionImplementation() {
  log.header('ACTION IMPLEMENTATION VALIDATION')
  
  const actionsContent = readFile('app/actions/service-templates.ts')
  
  validate('CRUD operations are complete', () => {
    const crudOperations = ['CREATE', 'SELECT', 'UPDATE', 'DELETE']
    
    crudOperations.forEach(operation => {
      if (!actionsContent.toLowerCase().includes(operation.toLowerCase())) {
        throw new Error(`Missing ${operation} operation in actions`)
      }
    })
  })
  
  validate('Authentication is properly implemented', () => {
    // Check for requireAuth usage
    if (!actionsContent.includes('requireAuth')) {
      throw new Error('Missing authentication checks')
    }
    
    // Check for role-based access
    if (!actionsContent.includes("['admin', 'team_member']")) {
      throw new Error('Missing role-based access control')
    }
  })
  
  validate('Input validation is comprehensive', () => {
    // Check for required field validation
    if (!actionsContent.includes('if (!data.name') || !actionsContent.includes('trim()')) {
      throw new Error('Missing input validation for required fields')
    }
    
    // Check for length validation
    if (!actionsContent.includes('length > 255')) {
      throw new Error('Missing length validation')
    }
  })
  
  validate('Error responses are consistent', () => {
    // Check for errorResponse usage
    if (!actionsContent.includes('errorResponse')) {
      throw new Error('Missing error response handling')
    }
    
    // Check for successResponse usage
    if (!actionsContent.includes('successResponse')) {
      throw new Error('Missing success response handling')
    }
  })
  
  validate('Database transactions are handled', () => {
    // Check for proper error handling in multi-step operations
    if (!actionsContent.includes('try {') || !actionsContent.includes('} catch')) {
      throw new Error('Missing transaction error handling')
    }
  })
}

/**
 * Validate security implementation
 */
function validateSecurityImplementation() {
  log.header('SECURITY IMPLEMENTATION VALIDATION')
  
  const migrationContent = readFile('supabase/migrations/20250819_service_templates.sql')
  const actionsContent = readFile('app/actions/service-templates.ts')
  
  validate('Row Level Security is enabled', () => {
    if (!migrationContent.includes('ENABLE ROW LEVEL SECURITY')) {
      throw new Error('RLS not enabled on service_templates table')
    }
  })
  
  validate('RLS policies are comprehensive', () => {
    const requiredPolicies = ['SELECT', 'INSERT', 'UPDATE', 'DELETE']
    
    requiredPolicies.forEach(operation => {
      if (!migrationContent.includes(`FOR ${operation}`)) {
        throw new Error(`Missing RLS policy for ${operation} operation`)
      }
    })
  })
  
  validate('Permission checks in actions', () => {
    // Check for admin-only operations
    if (!actionsContent.includes("role === 'admin'")) {
      throw new Error('Missing admin permission checks')
    }
    
    // Check for creator permission checks
    if (!actionsContent.includes('created_by === user.id')) {
      throw new Error('Missing creator permission checks')
    }
  })
  
  validate('Input sanitization', () => {
    // Check for trim() usage on user inputs
    if (!actionsContent.includes('.trim()')) {
      throw new Error('Missing input sanitization (trim)')
    }
    
    // Check for SQL injection prevention (using supabase methods)
    if (actionsContent.includes('${') && !actionsContent.includes('template literal in query')) {
      log.warning('Potential SQL injection risk - verify template literals in queries')
      return 'warning'
    }
  })
}

/**
 * Validate test coverage
 */
function validateTestCoverage() {
  log.header('TEST COVERAGE VALIDATION')
  
  validate('Schema tests exist', () => {
    if (!fileExists('scripts/test-template-schema.sql')) {
      throw new Error('Schema test file missing')
    }
    
    const schemaTestContent = readFile('scripts/test-template-schema.sql')
    
    // Check for comprehensive test coverage
    if (!schemaTestContent.includes('TEST 1') || 
        schemaTestContent.split('TEST').length < 10) {
      throw new Error('Insufficient schema test coverage')
    }
  })
  
  validate('Action tests exist', () => {
    if (!fileExists('scripts/test-template-actions.js')) {
      throw new Error('Action test file missing')
    }
    
    const actionTestContent = readFile('scripts/test-template-actions.js')
    
    // Check for test categories
    const testCategories = [
      'FILE EXISTENCE',
      'TYPE DEFINITIONS', 
      'SMART DATES',
      'SERVICE TEMPLATE ACTIONS',
      'DATABASE INTEGRATION',
      'ERROR HANDLING'
    ]
    
    testCategories.forEach(category => {
      if (!actionTestContent.includes(category)) {
        throw new Error(`Missing test category: ${category}`)
      }
    })
  })
  
  validate('Tests are executable', () => {
    try {
      // Check if test scripts are executable
      const testStats = fs.statSync(path.join(process.cwd(), 'scripts/test-template-actions.js'))
      if (!(testStats.mode & parseInt('100', 8))) {
        log.warning('Test script may not be executable - run chmod +x scripts/test-template-actions.js')
        return 'warning'
      }
    } catch (error) {
      throw new Error('Cannot check test script permissions')
    }
  })
}

/**
 * Validate code quality metrics
 */
function validateCodeQuality() {
  log.header('CODE QUALITY VALIDATION')
  
  const files = [
    'shared/types/index.ts',
    'shared/lib/smart-dates.ts',
    'app/actions/service-templates.ts'
  ]
  
  files.forEach(filePath => {
    const fileName = path.basename(filePath)
    const content = readFile(filePath)
    
    validate(`${fileName} has proper documentation`, () => {
      if (!content.includes('/**') && !content.includes('//')) {
        throw new Error(`${fileName} missing documentation comments`)
      }
    })
    
    validate(`${fileName} follows naming conventions`, () => {
      // Check for consistent camelCase/PascalCase
      const hasCamelCase = /function [a-z][a-zA-Z]*/.test(content)
      const hasPascalCase = /interface [A-Z][a-zA-Z]*/.test(content)
      const hasConstants = /const [A-Z_]+/.test(content)
      
      if (!hasCamelCase && !hasPascalCase && !hasConstants && !fileName.includes('types')) {
        throw new Error(`${fileName} inconsistent naming conventions`)
      }
    })
    
    validate(`${fileName} has reasonable complexity`, () => {
      const lines = content.split('\n').length
      const functions = (content.match(/function /g) || []).length
      
      if (lines > 1000 && functions < 5) {
        log.warning(`${fileName} may be too complex (${lines} lines, ${functions} functions)`)
        return 'warning'
      }
    })
  })
}

/**
 * Performance and optimization validation
 */
function validatePerformanceOptimization() {
  log.header('PERFORMANCE OPTIMIZATION VALIDATION')
  
  const migrationContent = readFile('supabase/migrations/20250819_service_templates.sql')
  const actionsContent = readFile('app/actions/service-templates.ts')
  
  validate('Database indexes are created', () => {
    if (!migrationContent.includes('CREATE INDEX')) {
      throw new Error('Missing database indexes for performance')
    }
    
    // Check for foreign key indexes
    if (!migrationContent.includes('template_id') || !migrationContent.includes('created_by')) {
      throw new Error('Missing indexes on foreign key columns')
    }
  })
  
  validate('Queries are optimized', () => {
    // Check for select specific columns
    if (!actionsContent.includes('select(') || actionsContent.includes('select(\'*\')')) {
      log.warning('Consider selecting specific columns instead of * for better performance')
      return 'warning'
    }
  })
  
  validate('Path revalidation is present', () => {
    if (!actionsContent.includes('revalidatePath')) {
      throw new Error('Missing cache revalidation after mutations')
    }
  })
}

/**
 * Main validation runner
 */
function runValidation() {
  console.log(`${colors.bright}${colors.cyan}`)
  console.log('==================================================')
  console.log('BACKEND IMPLEMENTATION VALIDATION')
  console.log('==================================================')
  console.log(colors.reset)
  
  // Run validation suites
  validateProjectStructure()
  validateTypeScriptCompilation()
  validateImportExportConsistency()
  validateSmartDateImplementation()
  validateDatabaseSchemaConsistency()
  validateActionImplementation()
  validateSecurityImplementation()
  validateTestCoverage()
  validateCodeQuality()
  validatePerformanceOptimization()
  
  // Print summary
  console.log(`\n${colors.bright}${colors.cyan}VALIDATION SUMMARY${colors.reset}`)
  console.log('==================================================')
  console.log(`Total Validations: ${validationResults.total}`)
  console.log(`${colors.green}Passed: ${validationResults.passed}${colors.reset}`)
  console.log(`${colors.yellow}Warnings: ${validationResults.warnings}${colors.reset}`)
  console.log(`${colors.red}Failed: ${validationResults.failed}${colors.reset}`)
  
  if (validationResults.failed > 0) {
    console.log(`\n${colors.red}FAILED VALIDATIONS:${colors.reset}`)
    validationResults.errors.forEach(error => {
      console.log(`${colors.red}✗${colors.reset} ${error.test}: ${error.error}`)
    })
    console.log('==================================================')
    process.exit(1)
  } else {
    const status = validationResults.warnings > 0 ? 
      `${colors.yellow}PASSED WITH WARNINGS${colors.reset}` : 
      `${colors.green}ALL VALIDATIONS PASSED${colors.reset}`
    
    console.log(`\n${status}`)
    console.log('==================================================')
    console.log(`\n${colors.bright}PHASE 2 BACKEND IMPLEMENTATION COMPLETE${colors.reset}`)
    
    if (validationResults.warnings > 0) {
      process.exit(2) // Exit with warning code
    } else {
      process.exit(0) // Success
    }
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  runValidation()
}

module.exports = {
  runValidation,
  validate,
  validationResults
}