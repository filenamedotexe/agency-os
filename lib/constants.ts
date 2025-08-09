import { UserRole } from "@/types"

// Route Constants
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
  ADMIN: "/admin",
  TEAM: "/team",
  CLIENT: "/client",
  CLIENTS: "/clients",
  SERVICES: "/services",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  TASKS: "/tasks",
} as const

// Role-based redirects
export const ROLE_REDIRECTS: Record<UserRole, string> = {
  admin: ROUTES.ADMIN,
  team_member: ROUTES.TEAM,
  client: ROUTES.CLIENT,
}

// Test Accounts
export const TEST_ACCOUNTS = {
  ADMIN: {
    email: "admin@agencyos.dev",
    password: "password123",
    role: "admin" as UserRole,
  },
  TEAM: {
    email: "john@agencyos.dev",
    password: "password123",
    role: "team_member" as UserRole,
  },
  CLIENT: {
    email: "client@agencyos.dev",
    password: "password123",
    role: "client" as UserRole,
  },
}

// UI Constants
export const BREAKPOINTS = {
  MOBILE: 320,
  MOBILE_LG: 640,
  TABLET: 768,
  DESKTOP: 1024,
  DESKTOP_LG: 1280,
  DESKTOP_XL: 1536,
  DESKTOP_2XL: 1920,
  DESKTOP_4K: 2560,
}

// Status Colors
export const STATUS_COLORS = {
  planning: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  on_hold: "bg-gray-100 text-gray-800",
  pending: "bg-orange-100 text-orange-800",
  todo: "bg-slate-100 text-slate-800",
}

// Priority Colors
export const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

// Table Page Sizes
export const PAGE_SIZES = [10, 20, 30, 40, 50]

// Date Formats
export const DATE_FORMAT = {
  SHORT: "MMM d, yyyy",
  LONG: "MMMM d, yyyy",
  WITH_TIME: "MMM d, yyyy h:mm a",
  ISO: "yyyy-MM-dd",
}

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: "An unexpected error occurred. Please try again.",
  AUTH_FAILED: "Invalid email or password.",
  NETWORK: "Network error. Please check your connection.",
  PERMISSION: "You don't have permission to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
}

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: "Welcome back! You've successfully logged in.",
  SIGNUP: "Account created! Please check your email to verify.",
  SAVED: "Changes saved successfully.",
  DELETED: "Item deleted successfully.",
  CREATED: "Item created successfully.",
}