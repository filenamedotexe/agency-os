/**
 * AgencyOS Design System v2.0
 * Ultra-thin, modern, consistent design tokens
 * August 2025 - Following latest shadcn/ui best practices
 */

// ============================================
// SPACING SYSTEM
// ============================================
export const spacing = {
  // Page-level spacing
  page: {
    container: "mx-auto max-w-7xl",
    padding: "px-4 sm:px-6 lg:px-8",
    paddingY: "py-6 sm:py-8",
    gap: "space-y-6",
  },
  
  // Section spacing
  section: {
    gap: "space-y-4",
    padding: "p-4 sm:p-6",
    paddingX: "px-4 sm:px-6",
    paddingY: "py-4 sm:py-6",
  },
  
  // Component spacing
  component: {
    gap: "space-y-3",
    padding: "p-3 sm:p-4",
    paddingCompact: "p-2 sm:p-3",
  },
  
  // Form spacing
  form: {
    gap: "space-y-4",
    fieldGap: "space-y-2",
    groupGap: "space-y-6",
  },
  
  // Grid gaps
  grid: {
    tight: "gap-2",
    default: "gap-4",
    relaxed: "gap-6",
    loose: "gap-8",
  },
} as const

// ============================================
// TYPOGRAPHY SYSTEM
// ============================================
export const typography = {
  // Page headers
  page: {
    title: "text-2xl sm:text-3xl font-semibold tracking-tight",
    subtitle: "text-sm text-muted-foreground",
    description: "text-base text-muted-foreground",
  },
  
  // Section headers
  section: {
    title: "text-lg sm:text-xl font-semibold",
    subtitle: "text-sm text-muted-foreground",
  },
  
  // Component text
  component: {
    title: "text-base font-medium",
    subtitle: "text-sm text-muted-foreground",
    label: "text-sm font-medium",
    body: "text-sm",
    small: "text-xs text-muted-foreground",
  },
  
  // Table text
  table: {
    header: "text-xs font-medium text-muted-foreground uppercase tracking-wider",
    cell: "text-sm",
  },
} as const

// ============================================
// COMPONENT VARIANTS
// ============================================
export const variants = {
  // Button patterns
  button: {
    primary: "default",
    secondary: "secondary",
    ghost: "ghost",
    danger: "destructive",
    link: "link",
  },
  
  // Card patterns
  card: {
    default: "",
    interactive: "transition-colors hover:bg-muted/50 cursor-pointer",
    elevated: "shadow-sm hover:shadow-md transition-shadow",
  },
  
  // Badge patterns
  badge: {
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
    error: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    default: "default",
    secondary: "secondary",
  },
} as const

// ============================================
// LAYOUT PATTERNS
// ============================================
export const layout = {
  // Dashboard layouts
  dashboard: {
    container: "flex flex-1 flex-col",
    header: "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
    content: "flex-1",
  },
  
  // Grid layouts
  grid: {
    stats: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
    twoColumn: "grid gap-6 lg:grid-cols-2",
    threeColumn: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
    sidebar: "grid gap-6 lg:grid-cols-7",
  },
  
  // Flex layouts
  flex: {
    between: "flex items-center justify-between",
    center: "flex items-center justify-center",
    start: "flex items-center",
    end: "flex items-center justify-end",
    col: "flex flex-col",
  },
} as const

// ============================================
// RESPONSIVE BREAKPOINTS
// ============================================
export const breakpoints = {
  mobile: "sm:hidden",
  tablet: "sm:block lg:hidden",
  desktop: "lg:block",
  mobileOnly: "max-sm:block sm:hidden",
  tabletUp: "sm:block",
  desktopUp: "lg:block",
} as const

// ============================================
// ANIMATION PATTERNS
// ============================================
export const animation = {
  // Transitions
  transition: {
    default: "transition-all duration-200 ease-in-out",
    fast: "transition-all duration-150 ease-in-out",
    slow: "transition-all duration-300 ease-in-out",
  },
  
  // Hover effects
  hover: {
    scale: "hover:scale-[1.02]",
    opacity: "hover:opacity-80",
    shadow: "hover:shadow-md",
  },
} as const

// ============================================
// UTILITY CLASSES
// ============================================
export const utilities = {
  // Text utilities
  truncate: "truncate",
  nowrap: "whitespace-nowrap",
  
  // Visual utilities
  divider: "h-px bg-border",
  ring: "ring-2 ring-ring ring-offset-2",
  
  // State utilities
  disabled: "opacity-50 cursor-not-allowed",
  loading: "animate-pulse",
} as const

// ============================================
// COMPOSITE PATTERNS
// ============================================
export const patterns = {
  // Page header pattern
  pageHeader: `${spacing.page.padding} ${spacing.page.paddingY} border-b`,
  
  // Page content pattern
  pageContent: `${spacing.page.padding} ${spacing.page.paddingY} ${spacing.page.gap}`,
  
  // Card content pattern
  cardContent: `${spacing.section.padding} ${spacing.section.gap}`,
  
  // Form pattern
  formSection: `${spacing.form.gap}`,
  
  // Table container pattern
  tableContainer: "rounded-md border",
  
  // Dialog content pattern
  dialogContent: `${spacing.section.padding} ${spacing.form.groupGap}`,
} as const

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Combine multiple class strings with proper spacing
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Get responsive padding classes
 */
export function getResponsivePadding(size: 'sm' | 'md' | 'lg' = 'md'): string {
  const paddingMap = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  }
  return paddingMap[size]
}

/**
 * Get responsive text size classes
 */
export function getResponsiveText(size: 'sm' | 'md' | 'lg' = 'md'): string {
  const textMap = {
    sm: 'text-sm',
    md: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl lg:text-2xl',
  }
  return textMap[size]
}

// ============================================
// EXPORTS
// ============================================
export const designSystem = {
  spacing,
  typography,
  variants,
  layout,
  breakpoints,
  animation,
  utilities,
  patterns,
} as const

export default designSystem