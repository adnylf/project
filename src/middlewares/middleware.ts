import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { USER_STATUS, USER_ROLES } from "@/lib/constants";

// Daftar route publik yang tidak memerlukan autentikasi
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

// Prefix route berdasarkan role
const protectedPrefixes = {
  admin: "/admin",
  mentor: "/mentor",
  student: "/user",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Izinkan akses ke route publik
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 2. Ambil token dari cookies
  const token = request.cookies.get("accessToken")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // 3. Verifikasi token
    const payload = verifyAccessToken(token);

    // 4. Ambil data user dari database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, status: true },
    });

    // 5. Validasi user
    if (!user || user.status !== USER_STATUS.ACTIVE) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // 6. Proteksi berdasarkan role dan route
    const role = user.role.toUpperCase();
    const isStudentRoute = pathname.startsWith(protectedPrefixes.student);
    const isMentorRoute = pathname.startsWith(protectedPrefixes.mentor);
    const isAdminRoute = pathname.startsWith(protectedPrefixes.admin);

    // Cek akses berdasarkan role
    if (
      (isStudentRoute && role !== USER_ROLES.STUDENT) ||
      (isMentorRoute &&
        ![USER_ROLES.MENTOR, USER_ROLES.ADMIN].includes(role)) ||
      (isAdminRoute && role !== USER_ROLES.ADMIN)
    ) {
      // Redirect ke login untuk semua kasus unauthorized
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// Konfigurasi matcher untuk middleware
export const config = {
  matcher: [
    /*
     * Match semua route kecuali:
     * - API routes (/api/)
     * - File statis (_next/static, _next/image, favicon.ico)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
