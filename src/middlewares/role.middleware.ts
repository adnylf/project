import { NextRequest, NextResponse } from "next/server";
import { authMiddleware, AuthenticatedUser } from "./auth.middleware";
import { forbiddenResponse } from "@/utils/response.util";
import { USER_ROLES } from "@/lib/constants";

/**
 * Role-based Access Control Middleware
 */
export function requireRole(
  allowedRoles: string[]
): (
  handler: (
    request: NextRequest,
    user: AuthenticatedUser
  ) => Promise<NextResponse>
) => (request: NextRequest) => Promise<NextResponse> {
  return (handler) => {
    return async (request: NextRequest) => {
      // First authenticate the user
      const authResult = await authMiddleware(request);

      if (authResult instanceof NextResponse) {
        return authResult;
      }

      const user = authResult;

      // Check if user has required role
      if (!allowedRoles.includes(user.role)) {
        return forbiddenResponse("Insufficient permissions");
      }

      // User has required role, proceed to handler
      return handler(request, user);
    };
  };
}

/**
 * Require Admin role
 */
export function requireAdmin(
  handler: (
    request: NextRequest,
    user: AuthenticatedUser
  ) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return requireRole([USER_ROLES.ADMIN])(handler);
}

/**
 * Require Mentor role
 */
export function requireMentor(
  handler: (
    request: NextRequest,
    user: AuthenticatedUser
  ) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return requireRole([USER_ROLES.MENTOR, USER_ROLES.ADMIN])(handler);
}

/**
 * Require Student role (any authenticated user)
 */
export function requireStudent(
  handler: (
    request: NextRequest,
    user: AuthenticatedUser
  ) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return requireRole([USER_ROLES.STUDENT, USER_ROLES.MENTOR, USER_ROLES.ADMIN])(
    handler
  );
}

/**
 * Check if user is owner of resource
 */
export async function isResourceOwner(
  request: NextRequest,
  resourceUserId: string
): Promise<boolean> {
  const authResult = await authMiddleware(request);

  if (authResult instanceof NextResponse) {
    return false;
  }

  const user = authResult;

  // Admin can access any resource
  if (user.role === USER_ROLES.ADMIN) {
    return true;
  }

  // Check if user is the owner
  return user.userId === resourceUserId;
}

/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  const authResult = await authMiddleware(request);

  if (authResult instanceof NextResponse) {
    return null;
  }

  return authResult;
}
