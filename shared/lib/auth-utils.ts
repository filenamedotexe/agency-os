import { createClient } from './supabase/server'
import { createServiceClient } from './supabase/service'

type UserRole = 'admin' | 'team_member' | 'client'

interface AuthResult {
  user: {
    id: string
    email?: string
    role: UserRole
  }
  supabase: Awaited<ReturnType<typeof createClient>>
  serviceClient: ReturnType<typeof createServiceClient>
}

interface AuthError {
  error: string
  code?: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND'
}

/**
 * Centralized auth check for server actions
 * Returns user, role, and database clients or error
 */
export async function requireAuth(
  allowedRoles?: UserRole[]
): Promise<AuthResult | AuthError> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'Not authenticated', code: 'UNAUTHORIZED' }
  }
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profileError || !profile) {
    return { error: 'Profile not found', code: 'NOT_FOUND' }
  }
  
  // Check role permissions if specified
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return { error: 'Insufficient permissions', code: 'FORBIDDEN' }
  }
  
  return {
    user: {
      id: user.id,
      email: user.email,
      role: profile.role
    },
    supabase,
    serviceClient: createServiceClient()
  }
}

/**
 * Type guard to check if result is an error
 */
export function isAuthError(result: AuthResult | AuthError): result is AuthError {
  return 'error' in result
}

/**
 * Helper to check if user has admin/team privileges
 */
export function isAdminOrTeam(role: UserRole): boolean {
  return role === 'admin' || role === 'team_member'
}

/**
 * Consistent error response format
 */
export function errorResponse(message: string, code?: string) {
  return {
    error: message,
    code,
    timestamp: new Date().toISOString()
  }
}

/**
 * Success response wrapper
 */
export function successResponse<T>(data: T, message?: string) {
  return {
    data,
    success: true,
    message,
    timestamp: new Date().toISOString()
  }
}