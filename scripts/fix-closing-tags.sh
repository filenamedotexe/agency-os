#!/bin/bash

# Fix all incorrect closing tags with className attributes

echo "Fixing incorrect closing tags..."

# Fix CardContent closing tags
find . -name "*.tsx" -type f -exec sed -i '' 's|</CardContent className="[^"]*">|</CardContent>|g' {} \;

# Fix CardHeader closing tags  
find . -name "*.tsx" -type f -exec sed -i '' 's|</CardHeader className="[^"]*">|</CardHeader>|g' {} \;

# Fix any other duplicate className patterns (gap-3 sm:p-4 sm:p-4 -> gap-3 sm:p-4)
find . -name "*.tsx" -type f -exec sed -i '' 's|sm:p-4 sm:p-4|sm:p-4|g' {} \;
find . -name "*.tsx" -type f -exec sed -i '' 's|gap-3 sm:p-4 sm:p-4|gap-3 sm:p-4|g' {} \;
find . -name "*.tsx" -type f -exec sed -i '' 's|p-3 sm:p-4 sm:p-4|p-3 sm:p-4|g' {} \;
find . -name "*.tsx" -type f -exec sed -i '' 's|px-3 sm:px-4 sm:px-4|px-3 sm:px-4|g' {} \;

# Fix duplicate imports
find . -name "*.tsx" -type f -exec sed -i '' '/^import {$/N;/^import {\nimport { designSystem as ds }/d' {} \;

echo "✅ Fixed closing tags and duplicate patterns"