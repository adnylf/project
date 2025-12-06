"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "@/utils/cookies";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}: ProtectedRouteProps) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = getCookie("accessToken");
      
      // Redirect ke login jika tidak ada token
      if (!token) {
        router.push("/login");
        return;
      }

      // Jika ada allowedRoles, lakukan pengecekan role
      if (allowedRoles.length > 0) {
        const userCookie = getCookie("user");
        
        if (!userCookie) {
          router.push("/login");
          return;
        }

        try {
          const user = JSON.parse(decodeURIComponent(userCookie));
          const userRole = (user.role || user.user_role || "").toUpperCase();
          
          // Cek apakah role diizinkan
          const hasAccess = allowedRoles.some(allowedRole => 
            allowedRole.toUpperCase() === userRole
          );
          
          if (!hasAccess) {
            // Redirect ke dashboard sesuai role
            if (userRole === "ADMIN") {
              router.push("/admin/dashboard");
            } else if (userRole === "MENTOR") {
              router.push("/mentor/dashboard");
            } else {
              router.push("/user/dashboard");
            }
          }
        } catch (error) {
          console.error("Error parsing user data:", error);
          router.push("/login");
        }
      }
    };

    checkAuth();
  }, [router, allowedRoles]);

  return <>{children}</>;
}