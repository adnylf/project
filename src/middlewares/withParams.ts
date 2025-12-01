// middlewares/withParams.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "./auth.middleware";
import { AuthenticatedUser } from "./auth.middleware";

/**
 * Middleware untuk menggabungkan params dan user dalam handler
 */
export const withParams = (
  handler: (
    request: NextRequest,
    context: { params: any; user: AuthenticatedUser }
  ) => Promise<NextResponse>
) => {
  return async (request: NextRequest, context: { params: any }) => {
    const authHandler = requireAuth(
      async (req: NextRequest, { user }: { user: AuthenticatedUser }) => {
        return handler(req, { ...context, user });
      }
    );
    return authHandler(request);
  };
};
