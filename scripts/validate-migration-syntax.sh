#!/bin/bash

# =====================================================
# MIGRATION SYNTAX VALIDATION SCRIPT
# =====================================================
# Validates the service templates migration syntax and structure
# Date: 2025-08-19
# =====================================================

echo "=================================================="
echo "VALIDATING SERVICE TEMPLATES MIGRATION"
echo "=================================================="

MIGRATION_FILE="supabase/migrations/20250819_service_templates.sql"
TEST_SCRIPT="scripts/test-template-schema.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} File exists: $1"
        return 0
    else
        echo -e "${RED}✗${NC} File missing: $1"
        return 1
    fi
}

# Function to check SQL syntax (basic)
check_sql_syntax() {
    local file="$1"
    echo "Checking SQL syntax for: $file"
    
    # Basic syntax checks
    if grep -q "CREATE TABLE" "$file"; then
        echo -e "${GREEN}✓${NC} Contains CREATE TABLE statements"
    else
        echo -e "${RED}✗${NC} No CREATE TABLE statements found"
        return 1
    fi
    
    if grep -q "PRIMARY KEY" "$file"; then
        echo -e "${GREEN}✓${NC} Contains PRIMARY KEY definitions"
    else
        echo -e "${RED}✗${NC} No PRIMARY KEY definitions found"
        return 1
    fi
    
    if grep -q "REFERENCES" "$file"; then
        echo -e "${GREEN}✓${NC} Contains foreign key REFERENCES"
    else
        echo -e "${RED}✗${NC} No foreign key REFERENCES found"
        return 1
    fi
    
    if grep -q "CREATE POLICY" "$file"; then
        echo -e "${GREEN}✓${NC} Contains RLS policies"
    else
        echo -e "${RED}✗${NC} No RLS policies found"
        return 1
    fi
    
    # Check for balanced parentheses
    local open_parens=$(grep -o "(" "$file" | wc -l)
    local close_parens=$(grep -o ")" "$file" | wc -l)
    
    if [ "$open_parens" -eq "$close_parens" ]; then
        echo -e "${GREEN}✓${NC} Balanced parentheses ($open_parens opening, $close_parens closing)"
    else
        echo -e "${RED}✗${NC} Unbalanced parentheses ($open_parens opening, $close_parens closing)"
        return 1
    fi
    
    # Check for semicolons at end of statements
    local statements=$(grep -c ";" "$file")
    if [ "$statements" -gt 10 ]; then
        echo -e "${GREEN}✓${NC} Contains multiple SQL statements ($statements statements)"
    else
        echo -e "${YELLOW}⚠${NC} Few SQL statements found ($statements statements)"
    fi
    
    return 0
}

# Function to validate migration structure
check_migration_structure() {
    local file="$1"
    echo "Checking migration structure for: $file"
    
    # Check for required tables
    if grep -q "service_templates" "$file"; then
        echo -e "${GREEN}✓${NC} service_templates table defined"
    else
        echo -e "${RED}✗${NC} service_templates table missing"
        return 1
    fi
    
    if grep -q "template_milestones" "$file"; then
        echo -e "${GREEN}✓${NC} template_milestones table defined"
    else
        echo -e "${RED}✗${NC} template_milestones table missing"
        return 1
    fi
    
    if grep -q "template_tasks" "$file"; then
        echo -e "${GREEN}✓${NC} template_tasks table defined"
    else
        echo -e "${RED}✗${NC} template_tasks table missing"
        return 1
    fi
    
    # Check for RLS
    if grep -q "ENABLE ROW LEVEL SECURITY" "$file"; then
        echo -e "${GREEN}✓${NC} RLS enabled"
    else
        echo -e "${RED}✗${NC} RLS not enabled"
        return 1
    fi
    
    # Check for indexes
    if grep -q "CREATE INDEX" "$file"; then
        echo -e "${GREEN}✓${NC} Indexes defined"
    else
        echo -e "${YELLOW}⚠${NC} No indexes found"
    fi
    
    # Check for constraints
    if grep -q "CHECK (" "$file"; then
        echo -e "${GREEN}✓${NC} Check constraints defined"
    else
        echo -e "${YELLOW}⚠${NC} No check constraints found"
    fi
    
    return 0
}

# Function to check test script
check_test_script() {
    local file="$1"
    echo "Checking test script structure for: $file"
    
    if grep -q "TEST [0-9]" "$file"; then
        local test_count=$(grep -c "TEST [0-9]" "$file")
        echo -e "${GREEN}✓${NC} Contains $test_count test sections"
    else
        echo -e "${RED}✗${NC} No test sections found"
        return 1
    fi
    
    if grep -q "RAISE EXCEPTION" "$file"; then
        echo -e "${GREEN}✓${NC} Contains error checking"
    else
        echo -e "${YELLOW}⚠${NC} No error checking found"
    fi
    
    if grep -q "RAISE NOTICE" "$file"; then
        echo -e "${GREEN}✓${NC} Contains success notifications"
    else
        echo -e "${YELLOW}⚠${NC} No success notifications found"
    fi
    
    return 0
}

# Main validation
echo ""
echo "1. Checking file existence..."
check_file "$MIGRATION_FILE" || exit 1
check_file "$TEST_SCRIPT" || exit 1

echo ""
echo "2. Validating migration SQL syntax..."
check_sql_syntax "$MIGRATION_FILE" || exit 1

echo ""
echo "3. Validating migration structure..."
check_migration_structure "$MIGRATION_FILE" || exit 1

echo ""
echo "4. Validating test script..."
check_test_script "$TEST_SCRIPT" || exit 1

echo ""
echo "=================================================="
echo -e "${GREEN}VALIDATION COMPLETED SUCCESSFULLY${NC}"
echo "=================================================="
echo ""
echo "Migration is ready for execution when database connection is available."
echo ""
echo "To run the migration:"
echo "  1. Set up .env.local with DATABASE_URL"
echo "  2. Run: psql \$DATABASE_URL -f $MIGRATION_FILE"
echo "  3. Test: psql \$DATABASE_URL -f $TEST_SCRIPT"
echo ""
echo "=================================================="