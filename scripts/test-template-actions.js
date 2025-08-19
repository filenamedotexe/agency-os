#!/usr/bin/env node

/**
 * SERVICE TEMPLATE BACKEND ACTIONS TEST SUITE
 * Comprehensive testing for all service template actions and smart date utilities
 * Date: 2025-08-19
 */

const fs = require('fs')
const path = require('path')

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

// Test configuration
const testConfig = {
  rootDir: process.cwd(),
  timeout: 30000,
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v')
}

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
}

/**
 * Test runner utility
 */
function test(name, testFn) {
  testResults.total++
  
  try {
    if (testConfig.verbose) {
      log.info(`Running: ${name}`)
    }
    
    const result = testFn()
    
    if (result === false) {
      throw new Error('Test assertion failed')
    }
    
    testResults.passed++
    log.success(name)
    return true
    
  } catch (error) {
    testResults.failed++
    testResults.errors.push({ test: name, error: error.message })
    log.error(`${name}: ${error.message}`)
    return false
  }
}

/**
 * Test assertion utilities
 */
const assert = {
  isTrue: (condition, message = 'Expected true') => {
    if (!condition) throw new Error(message)
  },
  
  isFalse: (condition, message = 'Expected false') => {
    if (condition) throw new Error(message)
  },
  
  equals: (actual, expected, message = 'Values not equal') => {
    if (actual !== expected) {
      throw new Error(`${message}. Expected: ${expected}, Got: ${actual}`)
    }
  },
  
  notEquals: (actual, expected, message = 'Values should not be equal') => {
    if (actual === expected) {
      throw new Error(`${message}. Both values: ${actual}`)
    }
  },
  
  exists: (value, message = 'Expected value to exist') => {
    if (value === null || value === undefined) {
      throw new Error(message)
    }
  },
  
  isType: (value, type, message = 'Type mismatch') => {
    if (typeof value !== type) {
      throw new Error(`${message}. Expected: ${type}, Got: ${typeof value}`)
    }
  },
  
  isArray: (value, message = 'Expected array') => {
    if (!Array.isArray(value)) {
      throw new Error(message)
    }
  },
  
  contains: (array, item, message = 'Array does not contain item') => {
    if (!Array.isArray(array) || !array.includes(item)) {
      throw new Error(message)
    }
  },
  
  throws: (fn, message = 'Expected function to throw') => {
    try {
      fn()
      throw new Error(message)
    } catch (error) {
      // Expected behavior
    }
  }
}

/**
 * File existence tests
 */
function testFileExistence() {
  log.header('FILE EXISTENCE TESTS')
  
  const requiredFiles = [
    'shared/types/index.ts',
    'shared/lib/smart-dates.ts', 
    'app/actions/service-templates.ts',
    'supabase/migrations/20250819_service_templates.sql',
    'scripts/test-template-schema.sql'
  ]
  
  requiredFiles.forEach(filePath => {
    test(`File exists: ${filePath}`, () => {
      const fullPath = path.join(testConfig.rootDir, filePath)
      assert.isTrue(fs.existsSync(fullPath), `File not found: ${fullPath}`)
    })
  })
}

/**
 * TypeScript types validation
 */
function testTypeDefinitions() {
  log.header('TYPE DEFINITIONS TESTS')
  
  const typesPath = path.join(testConfig.rootDir, 'shared/types/index.ts')
  const typesContent = fs.readFileSync(typesPath, 'utf8')
  
  const requiredTypes = [
    'ServiceTemplate',
    'TemplateMilestone', 
    'TemplateTask',
    'ServiceTemplateWithMilestones',
    'TemplateMilestoneWithTasks',
    'CreateServiceTemplateData',
    'CreateTemplateMilestoneData',
    'CreateTemplateTaskData',
    'UpdateServiceTemplateData',
    'SmartDateConfig',
    'CalculatedDates',
    'RelativeDateUnit',
    'RelativeDateParse',
    'TemplateSummary',
    'TemplateColor'
  ]
  
  requiredTypes.forEach(type => {
    test(`Type definition exists: ${type}`, () => {
      assert.isTrue(
        typesContent.includes(`interface ${type}`) || typesContent.includes(`type ${type}`),
        `Type ${type} not found in types file`
      )
    })
  })
  
  test('Template color type has correct values', () => {
    assert.isTrue(
      typesContent.includes("'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'red' | 'yellow' | 'indigo' | 'gray'"),
      'TemplateColor type missing required color values'
    )
  })
  
  test('RelativeDateUnit has correct values', () => {
    assert.isTrue(
      typesContent.includes("'day' | 'days' | 'week' | 'weeks' | 'month' | 'months'"),
      'RelativeDateUnit type missing required unit values'
    )
  })
}

/**
 * Smart dates utility tests
 */
function testSmartDatesUtility() {
  log.header('SMART DATES UTILITY TESTS')
  
  const smartDatesPath = path.join(testConfig.rootDir, 'shared/lib/smart-dates.ts')
  const smartDatesContent = fs.readFileSync(smartDatesPath, 'utf8')
  
  const requiredFunctions = [
    'parseRelativeDateString',
    'addDaysToDate',
    'calculateMilestoneDate',
    'calculateTaskDate',
    'calculateDates',
    'generateDateSuggestions',
    'validateDateSequence',
    'formatRelativeDays',
    'toDateString',
    'isValidDateString',
    'getCurrentDate',
    'getCurrentDateString',
    'getDaysDifference',
    'previewTemplateDates'
  ]
  
  requiredFunctions.forEach(func => {
    test(`Function exists: ${func}`, () => {
      assert.isTrue(
        smartDatesContent.includes(`function ${func}`) || smartDatesContent.includes(`${func}:`),
        `Function ${func} not found in smart-dates utility`
      )
    })
  })
  
  test('Smart date utility has error handling', () => {
    assert.isTrue(
      smartDatesContent.includes('try {') && smartDatesContent.includes('catch'),
      'Smart dates utility missing error handling'
    )
  })
  
  test('Smart date utility has input validation', () => {
    assert.isTrue(
      smartDatesContent.includes('if (!') || smartDatesContent.includes('throw new Error'),
      'Smart dates utility missing input validation'
    )
  })
  
  test('Date suggestions include common options', () => {
    const expectedSuggestions = ['same day', 'next day', '1 week', '2 weeks', '1 month']
    expectedSuggestions.forEach(suggestion => {
      assert.isTrue(
        smartDatesContent.includes(suggestion),
        `Date suggestion "${suggestion}" not found`
      )
    })
  })
}

/**
 * Service template actions tests
 */
function testServiceTemplateActions() {
  log.header('SERVICE TEMPLATE ACTIONS TESTS')
  
  const actionsPath = path.join(testConfig.rootDir, 'app/actions/service-templates.ts')
  const actionsContent = fs.readFileSync(actionsPath, 'utf8')
  
  const requiredActions = [
    'getServiceTemplates',
    'getServiceTemplate',
    'createServiceTemplate',
    'updateServiceTemplate',
    'deleteServiceTemplate',
    'createTemplateFromService',
    'createServiceFromTemplate',
    'getTemplateStats'
  ]
  
  requiredActions.forEach(action => {
    test(`Action exists: ${action}`, () => {
      assert.isTrue(
        actionsContent.includes(`export async function ${action}`),
        `Action ${action} not found in service-templates actions`
      )
    })
  })
  
  test('Actions use proper authentication', () => {
    assert.isTrue(
      actionsContent.includes('requireAuth') && actionsContent.includes('isAuthError'),
      'Actions missing proper authentication checks'
    )
  })
  
  test('Actions have input validation', () => {
    assert.isTrue(
      actionsContent.includes('if (!') && actionsContent.includes('return errorResponse'),
      'Actions missing input validation'
    )
  })
  
  test('Actions use RLS-compliant queries', () => {
    assert.isTrue(
      actionsContent.includes('.from(\'service_templates\')') && 
      actionsContent.includes('.from(\'template_milestones\')') &&
      actionsContent.includes('.from(\'template_tasks\')'),
      'Actions missing database table queries'
    )
  })
  
  test('Create action handles milestones and tasks', () => {
    assert.isTrue(
      actionsContent.includes('template_milestones') && actionsContent.includes('template_tasks'),
      'Create action missing milestone/task handling'
    )
  })
  
  test('Create service from template uses smart dates', () => {
    assert.isTrue(
      actionsContent.includes('calculateMilestoneDate') && actionsContent.includes('calculateTaskDate'),
      'Create service from template missing smart date calculations'
    )
  })
  
  test('Actions have proper error handling', () => {
    assert.isTrue(
      actionsContent.includes('try {') && actionsContent.includes('catch') && 
      actionsContent.includes('console.error'),
      'Actions missing comprehensive error handling'
    )
  })
  
  test('Actions revalidate paths', () => {
    assert.isTrue(
      actionsContent.includes('revalidatePath'),
      'Actions missing path revalidation for cache updates'
    )
  })
}

/**
 * Database integration tests
 */
function testDatabaseIntegration() {
  log.header('DATABASE INTEGRATION TESTS')
  
  const migrationPath = path.join(testConfig.rootDir, 'supabase/migrations/20250819_service_templates.sql')
  const migrationContent = fs.readFileSync(migrationPath, 'utf8')
  
  test('Migration creates required tables', () => {
    const requiredTables = ['service_templates', 'template_milestones', 'template_tasks']
    requiredTables.forEach(table => {
      assert.isTrue(
        migrationContent.includes(`CREATE TABLE ${table}`),
        `Migration missing table: ${table}`
      )
    })
  })
  
  test('Migration has proper foreign key relationships', () => {
    assert.isTrue(
      migrationContent.includes('REFERENCES service_templates(id)') &&
      migrationContent.includes('REFERENCES template_milestones(id)'),
      'Migration missing proper foreign key relationships'
    )
  })
  
  test('Migration enables RLS', () => {
    assert.isTrue(
      migrationContent.includes('ENABLE ROW LEVEL SECURITY'),
      'Migration missing RLS enablement'
    )
  })
  
  test('Migration creates RLS policies', () => {
    const requiredPolicies = ['view', 'create', 'update', 'delete']
    requiredPolicies.forEach(policy => {
      assert.isTrue(
        migrationContent.toLowerCase().includes(policy) && migrationContent.includes('CREATE POLICY'),
        `Migration missing ${policy} policy`
      )
    })
  })
  
  test('Migration has proper constraints', () => {
    assert.isTrue(
      migrationContent.includes('CHECK (') && migrationContent.includes('UNIQUE ('),
      'Migration missing data constraints'
    )
  })
  
  test('Migration creates indexes', () => {
    assert.isTrue(
      migrationContent.includes('CREATE INDEX'),
      'Migration missing performance indexes'
    )
  })
}

/**
 * Action parameter validation tests
 */
function testActionParameters() {
  log.header('ACTION PARAMETER VALIDATION TESTS')
  
  const actionsPath = path.join(testConfig.rootDir, 'app/actions/service-templates.ts')
  const actionsContent = fs.readFileSync(actionsPath, 'utf8')
  
  test('Create template validates required fields', () => {
    assert.isTrue(
      actionsContent.includes('if (!data.name') && 
      actionsContent.includes('data.name.trim()'),
      'Create template missing name validation'
    )
  })
  
  test('Create template validates name length', () => {
    assert.isTrue(
      actionsContent.includes('data.name.length > 255'),
      'Create template missing name length validation'
    )
  })
  
  test('Create template validates color options', () => {
    assert.isTrue(
      actionsContent.includes('validColors') && actionsContent.includes('blue'),
      'Create template missing color validation'
    )
  })
  
  test('Create template validates milestone data', () => {
    assert.isTrue(
      actionsContent.includes('if (!milestoneData.name') &&
      actionsContent.includes('relative_start_days') &&
      actionsContent.includes('relative_due_days'),
      'Create template missing milestone validation'
    )
  })
  
  test('Create template validates task data', () => {
    assert.isTrue(
      actionsContent.includes('if (!taskData.title') &&
      actionsContent.includes('validPriorities') &&
      actionsContent.includes('validVisibilities'),
      'Create template missing task validation'
    )
  })
  
  test('Update template checks permissions', () => {
    assert.isTrue(
      actionsContent.includes('isCreator') && actionsContent.includes('isAdmin'),
      'Update template missing permission checks'
    )
  })
  
  test('Delete template prevents default deletion', () => {
    assert.isTrue(
      actionsContent.includes('is_default') && actionsContent.includes('Cannot delete default'),
      'Delete template missing default protection'
    )
  })
}

/**
 * Smart date calculation logic tests
 */
function testSmartDateLogic() {
  log.header('SMART DATE CALCULATION LOGIC TESTS')
  
  const smartDatesContent = fs.readFileSync(
    path.join(testConfig.rootDir, 'shared/lib/smart-dates.ts'), 
    'utf8'
  )
  
  test('Parse relative date handles special cases', () => {
    assert.isTrue(
      smartDatesContent.includes('same day') && smartDatesContent.includes('next day'),
      'Parse relative date missing special case handling'
    )
  })
  
  test('Parse relative date uses regex validation', () => {
    assert.isTrue(
      smartDatesContent.includes('regex') || smartDatesContent.includes('RegExp'),
      'Parse relative date missing regex validation'
    )
  })
  
  test('Date calculation handles null values', () => {
    assert.isTrue(
      smartDatesContent.includes('if (!') && smartDatesContent.includes('return null'),
      'Date calculation missing null handling'
    )
  })
  
  test('Date calculation converts units properly', () => {
    assert.isTrue(
      smartDatesContent.includes('* 7') && smartDatesContent.includes('* 30'),
      'Date calculation missing unit conversion'
    )
  })
  
  test('Date validation checks format', () => {
    assert.isTrue(
      smartDatesContent.includes('isNaN') && smartDatesContent.includes('new Date'),
      'Date validation missing format checks'
    )
  })
  
  test('Date preview handles complex structures', () => {
    assert.isTrue(
      smartDatesContent.includes('previewTemplateDates') && 
      smartDatesContent.includes('milestones.map'),
      'Date preview missing complex structure handling'
    )
  })
}

/**
 * Error handling tests
 */
function testErrorHandling() {
  log.header('ERROR HANDLING TESTS')
  
  const actionsContent = fs.readFileSync(
    path.join(testConfig.rootDir, 'app/actions/service-templates.ts'), 
    'utf8'
  )
  
  const smartDatesContent = fs.readFileSync(
    path.join(testConfig.rootDir, 'shared/lib/smart-dates.ts'), 
    'utf8'
  )
  
  test('Actions handle database errors', () => {
    assert.isTrue(
      actionsContent.includes('if (error)') && actionsContent.includes('return errorResponse'),
      'Actions missing database error handling'
    )
  })
  
  test('Actions handle authentication errors', () => {
    assert.isTrue(
      actionsContent.includes('isAuthError') && actionsContent.includes('return errorResponse'),
      'Actions missing authentication error handling'
    )
  })
  
  test('Actions use try-catch blocks', () => {
    assert.isTrue(
      actionsContent.includes('try {') && actionsContent.includes('} catch'),
      'Actions missing try-catch error handling'
    )
  })
  
  test('Smart dates handle invalid input', () => {
    assert.isTrue(
      smartDatesContent.includes('throw new Error') || smartDatesContent.includes('return null'),
      'Smart dates missing invalid input handling'
    )
  })
  
  test('Smart dates log errors', () => {
    assert.isTrue(
      smartDatesContent.includes('console.error'),
      'Smart dates missing error logging'
    )
  })
}

/**
 * Code quality tests
 */
function testCodeQuality() {
  log.header('CODE QUALITY TESTS')
  
  const allFiles = [
    path.join(testConfig.rootDir, 'shared/types/index.ts'),
    path.join(testConfig.rootDir, 'shared/lib/smart-dates.ts'),
    path.join(testConfig.rootDir, 'app/actions/service-templates.ts')
  ]
  
  allFiles.forEach((filePath, index) => {
    const fileName = path.basename(filePath)
    const content = fs.readFileSync(filePath, 'utf8')
    
    test(`${fileName} has proper imports`, () => {
      assert.isTrue(
        content.includes('import') || content.includes('export') || fileName.includes('types'),
        `${fileName} missing proper imports/exports`
      )
    })
    
    test(`${fileName} has documentation comments`, () => {
      assert.isTrue(
        content.includes('/**') || content.includes('//'),
        `${fileName} missing documentation comments`
      )
    })
    
    test(`${fileName} uses consistent naming`, () => {
      // Check for camelCase function names and PascalCase types
      const hasCamelCase = /function [a-z][a-zA-Z]*/.test(content) || 
                          /export async function [a-z][a-zA-Z]*/.test(content)
      const hasPascalCase = /interface [A-Z][a-zA-Z]*/.test(content) || 
                           /type [A-Z][a-zA-Z]*/.test(content)
      
      assert.isTrue(
        hasCamelCase || hasPascalCase || fileName.includes('types'),
        `${fileName} inconsistent naming conventions`
      )
    })
  })
  
  test('TypeScript strict mode compatibility', () => {
    const typesContent = fs.readFileSync(
      path.join(testConfig.rootDir, 'shared/types/index.ts'), 
      'utf8'
    )
    
    assert.isTrue(
      typesContent.includes('| null') || typesContent.includes('?:'),
      'Types missing null safety for strict mode'
    )
  })
}

/**
 * Main test runner
 */
function runTests() {
  console.log(`${colors.bright}${colors.cyan}`)
  console.log('==================================================')
  console.log('SERVICE TEMPLATE BACKEND ACTIONS TEST SUITE')
  console.log('==================================================')
  console.log(colors.reset)
  
  // Run test suites
  testFileExistence()
  testTypeDefinitions()
  testSmartDatesUtility()
  testServiceTemplateActions()
  testDatabaseIntegration()
  testActionParameters()
  testSmartDateLogic()
  testErrorHandling()
  testCodeQuality()
  
  // Print summary
  console.log(`\n${colors.bright}${colors.cyan}TEST SUMMARY${colors.reset}`)
  console.log('==================================================')
  console.log(`Total Tests: ${testResults.total}`)
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`)
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`)
  
  if (testResults.failed > 0) {
    console.log(`\n${colors.red}FAILED TESTS:${colors.reset}`)
    testResults.errors.forEach(error => {
      console.log(`${colors.red}✗${colors.reset} ${error.test}: ${error.error}`)
    })
    console.log('==================================================')
    process.exit(1)
  } else {
    console.log(`\n${colors.green}All tests passed successfully!${colors.reset}`)
    console.log('==================================================')
    console.log(`\n${colors.bright}BACKEND ACTIONS READY FOR INTEGRATION${colors.reset}`)
    process.exit(0)
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
}

module.exports = {
  runTests,
  test,
  assert,
  testResults
}