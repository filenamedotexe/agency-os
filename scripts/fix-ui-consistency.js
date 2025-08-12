#!/usr/bin/env node

/**
 * Fix UI Consistency Issues
 * Apply design system tokens consistently across all pages
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

console.log('🔧 Fixing UI Consistency Issues');
console.log('================================\n');

const FIXES = {
  // Fix non-responsive grids
  'grid grid-cols-2': 'grid grid-cols-1 sm:grid-cols-2',
  'grid grid-cols-3': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  'grid grid-cols-4': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  'grid-cols-5': 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  'grid-cols-6': 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  
  // Fix inconsistent padding
  'p-2': 'p-3 sm:p-4',
  'p-3': 'p-3 sm:p-4',
  'p-5': 'p-4 sm:p-6',
  'p-8': 'p-6 sm:p-8',
  'px-2': 'px-3 sm:px-4',
  'px-3': 'px-3 sm:px-4',
  'py-2': 'py-3 sm:py-4',
  'py-3': 'py-3 sm:py-4',
  
  // Fix inconsistent spacing
  'space-y-2': 'space-y-3',
  'space-y-8': 'space-y-6',
  'gap-2': 'gap-3',
  'gap-8': 'gap-6',
  
  // Fix text sizes for responsiveness
  'text-3xl': 'text-2xl sm:text-3xl',
  'text-4xl': 'text-3xl sm:text-4xl',
  'text-5xl': 'text-3xl sm:text-4xl lg:text-5xl',
  
  // Fix card padding inconsistencies
  'CardContent>': 'CardContent className="p-4 sm:p-6">',
  'CardHeader>': 'CardHeader className="space-y-1">',
};

const DESIGN_SYSTEM_IMPORTS = `import { designSystem as ds } from "@/shared/lib/design-system"`;

async function findFiles(pattern) {
  return await glob(pattern, { ignore: ['node_modules/**', '.next/**', 'scripts/**'] });
}

async function fixFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    let modified = false;
    const changes = [];
    
    // Apply fixes
    for (const [pattern, replacement] of Object.entries(FIXES)) {
      const regex = new RegExp(pattern, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, replacement);
        changes.push(`  - Fixed: ${pattern} → ${replacement}`);
        modified = true;
      }
    }
    
    // Add design system import if not present and file uses className
    if (content.includes('className=') && !content.includes('design-system')) {
      const hasImports = content.includes('import ');
      if (hasImports && !content.includes(DESIGN_SYSTEM_IMPORTS)) {
        // Add after last import
        const lastImportIndex = content.lastIndexOf('import ');
        const nextLineIndex = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, nextLineIndex + 1) + 
                  DESIGN_SYSTEM_IMPORTS + '\n' +
                  content.slice(nextLineIndex + 1);
        changes.push('  - Added design system import');
        modified = true;
      }
    }
    
    // Fix specific patterns for better consistency
    // Replace hardcoded spacing with design system tokens
    const spacingPatterns = [
      { 
        pattern: /className="([^"]*\s)?p-\d+(\s[^"]*)?"/g,
        check: (match) => !match.includes('sm:'),
        fix: (match) => {
          return match.replace(/p-\d+/, 'p-4 sm:p-6');
        }
      },
      {
        pattern: /className="([^"]*\s)?gap-\d+(\s[^"]*)?"/g,
        check: (match) => !match.includes('sm:') && !match.includes('grid'),
        fix: (match) => {
          return match.replace(/gap-\d+/, 'gap-4');
        }
      }
    ];
    
    for (const { pattern, check, fix } of spacingPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          if (check(match)) {
            const fixed = fix(match);
            content = content.replace(match, fixed);
            changes.push(`  - Applied responsive spacing pattern`);
            modified = true;
          }
        }
      }
    }
    
    if (modified) {
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`✅ Fixed: ${path.basename(filePath)}`);
      if (changes.length > 0) {
        changes.forEach(change => console.log(change));
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  const patterns = [
    'app/**/*.tsx',
    'features/**/*.tsx',
    'shared/components/**/*.tsx'
  ];
  
  let totalFiles = 0;
  let fixedFiles = 0;
  
  for (const pattern of patterns) {
    const files = await findFiles(pattern);
    totalFiles += files.length;
    
    console.log(`\n📁 Processing ${files.length} files matching ${pattern}\n`);
    
    for (const file of files) {
      const wasFixed = await fixFile(file);
      if (wasFixed) fixedFiles++;
    }
  }
  
  console.log('\n📊 SUMMARY');
  console.log('==========');
  console.log(`Total files scanned: ${totalFiles}`);
  console.log(`Files fixed: ${fixedFiles}`);
  
  if (fixedFiles > 0) {
    console.log('\n✅ UI consistency fixes applied successfully!');
    console.log('\n🔄 Next steps:');
    console.log('1. Run "npm run dev" to restart the development server');
    console.log('2. Test all viewports (320px, 768px, 1024px, 1920px)');
    console.log('3. Run the audit script again to verify fixes');
  } else {
    console.log('\n✅ No fixes needed - UI is already consistent!');
  }
}

main().catch(console.error);