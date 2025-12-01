// src/middlewares/auth.middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, extractTokenFromHeader } from "@/lib/auth";
import { HTTP_STATUS, USER_STATUS, USER_ROLES } from "@/lib/constants";
import prisma from "@/lib/prisma";

// Interface untuk user yang terautentikasi
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

export interface AuthContext {
  user: AuthenticatedUser;
}

type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<NextResponse>;

/**
 * Auth Middleware - Memeriksa dan memverifikasi token JWT
 */
export async function authMiddleware(
  request: NextRequest
): Promise<NextResponse | AuthenticatedUser> {
  try {
    // Extract token dari header
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      console.log("❌ No authorization header provided");
      return NextResponse.json(
        {
          success: false,
          message: "Authorization header required",
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      console.log("❌ No token provided");
      return NextResponse.json(
        {
          success: false,
          message: "Bearer token required",
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // Verify token
    let payload;
    try {
      payload = verifyAccessToken(token);
      console.log("✅ Token verified:", { userId: payload.userId });
    } catch (error) {
      console.log("❌ Token verification failed:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired token",
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      console.log("❌ User not found:", payload.userId);
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      console.log("❌ User not active:", user.status);
      return NextResponse.json(
        {
          success: false,
          message: "User account is suspended or inactive",
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    console.log("✅ User authenticated:", {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user object
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Authentication failed",
      },
      { status: HTTP_STATUS.UNAUTHORIZED }
    );
  }
}

/**
 * Require Auth Middleware - Versi dasar untuk handler tanpa params
 */
export function requireAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await authMiddleware(request);

    // Jika authResult adalah NextResponse (error), kembalikan error
    if (authResult instanceof NextResponse) {
      console.log("❌ Auth failed, returning:", authResult.status);
      return authResult;
    }

    // Jika authResult berisi user, panggil handler dengan user
    console.log("✅ Auth successful, proceeding to handler");
    const context: AuthContext = { user: authResult };
    return handler(request, context);
  };
}

/**
 * Require Auth dengan Params - Untuk handler yang membutuhkan params
 */
export function requireAuthWithParams(
  handler: (
    request: NextRequest,
    context: AuthContext & { params: any }
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context: { params: any }
  ): Promise<NextResponse> => {
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    return handler(request, { user: authResult, params: context.params });
  };
}

/**
 * Role-based Access Control Middleware
 */
export function requireRole(allowedRoles: string[]) {
  return (handler: AuthenticatedHandler) => {
    return requireAuth(async (request: NextRequest, context: AuthContext) => {
      const { user } = context;

      // Check if user has required role
      if (!allowedRoles.includes(user.role)) {
        console.log("❌ Insufficient permissions:", {
          userId: user.userId,
          role: user.role,
          allowedRoles,
        });
        return NextResponse.json(
          {
            success: false,
            message: "Insufficient permissions",
          },
          { status: HTTP_STATUS.FORBIDDEN }
        );
      }

      console.log("✅ Role check passed:", {
        userId: user.userId,
        role: user.role,
      });

      return handler(request, context);
    });
  };
}

/**
 * Require Admin role
 */
export function requireAdmin(handler: AuthenticatedHandler) {
  return requireRole([USER_ROLES.ADMIN])(handler);
}

/**
 * Require Mentor role
 */
export function requireMentor(handler: AuthenticatedHandler) {
  return requireRole([USER_ROLES.MENTOR, USER_ROLES.ADMIN])(handler);
}

/**
 * Require Student role (any authenticated user)
 */
export function requireStudent(handler: AuthenticatedHandler) {
  return requireRole([USER_ROLES.STUDENT, USER_ROLES.MENTOR, USER_ROLES.ADMIN])(
    handler
  );
}

/**
 * Helper function to get authenticated user from request
 */
export function getAuthenticatedUser(
  request: NextRequest
): AuthenticatedUser | null {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) return null;

    const payload = verifyAccessToken(token);
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

/**
 * Check if user is owner of resource
 */
export async function isResourceOwner(
  request: NextRequest,
  resourceUserId: string
): Promise<boolean> {
  const user = getAuthenticatedUser(request);

  if (!user) {
    return false;
  }

  // Admin can access any resource
  if (user.role === USER_ROLES.ADMIN) {
    return true;
  }

  // Check if user is the owner
  return user.userId === resourceUserId;
}

/**
 * Get user ID from request
 */
export async function getUserIdFromRequest(
  request: NextRequest
): Promise<string | null> {
  const user = getAuthenticatedUser(request);
  return user ? user.userId : null;
}

/**
 * Optional Auth Middleware - Auth tidak required, tapi jika ada token akan divalidasi
 */
export function optionalAuth(
  handler: (
    request: NextRequest,
    context: { user: AuthenticatedUser | null }
  ) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    try {
      const authResult = await authMiddleware(request);

      if (authResult instanceof NextResponse) {
        // Auth failed, but it's optional so continue with null user
        return handler(request, { user: null });
      }

      // Auth successful, continue with user
      return handler(request, { user: authResult });
    } catch (error) {
      // If any error occurs, continue with null user
      return handler(request, { user: null });
    }
  };
}

/**
 * Rate limiting by user ID
 */
const userRateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>();

export function rateLimitByUser(
  options: {
    windowMs?: number;
    maxRequests?: number;
  } = {}
) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const maxRequests = options.maxRequests || 100; // 100 requests per window

  return (
    handler: AuthenticatedHandler
  ): ((request: NextRequest) => Promise<NextResponse>) => {
    return requireAuth(async (request: NextRequest, context: AuthContext) => {
      const { user } = context;
      const now = Date.now();
      const key = `ratelimit:${user.userId}`;

      // Clean up expired entries periodically
      if (Math.random() < 0.01) {
        // 1% chance to clean up
        for (const [userKey, data] of userRateLimitStore.entries()) {
          if (now > data.resetTime) {
            userRateLimitStore.delete(userKey);
          }
        }
      }

      const userData = userRateLimitStore.get(key);

      if (!userData) {
        // First request
        userRateLimitStore.set(key, {
          count: 1,
          resetTime: now + windowMs,
        });
        return handler(request, context);
      }

      // Check if window has expired
      if (now > userData.resetTime) {
        userRateLimitStore.set(key, {
          count: 1,
          resetTime: now + windowMs,
        });
        return handler(request, context);
      }

      // Check if rate limit exceeded
      if (userData.count >= maxRequests) {
        return NextResponse.json(
          {
            success: false,
            error: "Too many requests. Please try again later.",
          },
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": Math.ceil(
                (userData.resetTime - now) / 1000
              ).toString(),
            },
          }
        );
      }

      // Increment counter
      userData.count++;
      userRateLimitStore.set(key, userData);

      // Add rate limit headers
      const response = await handler(request, context);
      response.headers.set("X-RateLimit-Limit", maxRequests.toString());
      response.headers.set(
        "X-RateLimit-Remaining",
        (maxRequests - userData.count).toString()
      );
      response.headers.set(
        "X-RateLimit-Reset",
        Math.ceil(userData.resetTime / 1000).toString()
      );

      return response;
    });
  };
}
