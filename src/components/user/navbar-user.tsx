// NavbarUser.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  UserCircle,
  Settings,
  LayoutGrid,
  LogOut,
  Menu
} from 'lucide-react';
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

interface NavbarUserProps {
  toggleSidebar: () => void;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  disability_type: string;
  role: string;
}

export default function NavbarUser({ toggleSidebar }: NavbarUserProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Get access token from localStorage
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        console.warn("No access token found");
        clearAuthData();
        return;
      }

      // Send logout request to backend
      const response = await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Logout failed with status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Logout successful:", result);

    } catch (error) {
      console.error("Error during logout:", error);
      // Even if logout fails, clear local data
    } finally {
      // Always clear local storage and redirect
      clearAuthData();
      setIsLoggingOut(false);
    }
  };

  const clearAuthData = () => {
    // Remove all auth-related data from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Redirect to login page
    router.push('/login');
  };

  const getUserData = (): UserData | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  };

  const userData = getUserData();

  return (
    <header className="bg-transparent">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* User info (optional - show on desktop) */}
            {userData && (
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {userData.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {userData.role.toLowerCase()}
                </span>
              </div>
            )}

            <AnimatedThemeToggler />

            <DropdownMenu>
              <DropdownMenuTrigger 
                disabled={isLoggingOut}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50"
              >
                <UserCircle className="h-8 w-8 text-[#005EB8]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                {/* User info in dropdown */}
                {userData && (
                  <>
                    <div className="px-2 py-1.5 text-sm border-b border-gray-200 dark:border-gray-700">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{userData.name}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">{userData.email}</p>
                    </div>
                    <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                  </>
                )}
                
                <DropdownMenuItem asChild className="focus:bg-gray-100 dark:focus:bg-gray-700">
                  <Link
                    href="/user/profile"
                    className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"
                  >
                    <UserCircle className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-gray-100 dark:focus:bg-gray-700">
                  <Link
                    href="/user/learn"
                    className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span>My Courses</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-gray-100 dark:focus:bg-gray-700">
                  <Link
                    href="/user/settings"
                    className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <>
                      <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
    </header>
  );
}