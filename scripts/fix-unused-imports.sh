#!/bin/bash

# Remove unused 'ds' imports from files that don't use it
echo "Removing unused design system imports..."

# Files with unused 'ds' import
files=(
  "app/(dashboard)/admin/emails/components/email-logs-table.tsx"
  "app/(dashboard)/admin/emails/components/email-template-preview.tsx"
  "app/(dashboard)/admin/emails/components/test-email-form.tsx"
  "app/(dashboard)/admin/emails/page.tsx"
  "app/(dashboard)/admin/settings/components/sms-settings.tsx"
  "app/(dashboard)/admin/settings/page.tsx"
  "app/(dashboard)/clients/loading.tsx"
  "app/(dashboard)/error.tsx"
  "app/(dashboard)/layout.tsx"
  "app/(dashboard)/messages/page.tsx"
  "app/layout.tsx"
  "app/welcome/page.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Remove the ds import line if ds is not used in the file
    if ! grep -q "ds\." "$file" 2>/dev/null; then
      sed -i '' '/import { designSystem as ds } from "@\/shared\/lib\/design-system"/d' "$file"
      echo "  ✓ Cleaned $file"
    fi
  fi
done

# Fix unused Shield import in sms-settings.tsx
sed -i '' 's/, Shield//g' "app/(dashboard)/admin/settings/components/sms-settings.tsx"

echo "✅ Unused imports removed"