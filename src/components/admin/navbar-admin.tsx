// components/navbar/NavbarAdmin.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserCircle,
  Users,
  Users2,
  Settings,
  LogOut,
  Search,
  Menu,
} from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import SweetAlert, { AlertType } from "@/components/ui/sweet-alert";

interface NavbarAdminProps {
  toggleSidebar: () => void;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function NavbarAdmin({ toggleSidebar }: NavbarAdminProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    type: AlertType;
    title: string;
    message: string;
  }>({
    type: "success",
    title: "",
    message: "",
  });
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // Get access token from localStorage
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        console.warn("No access token found");
        clearAuthData();
        return;
      }

      // Send logout request to backend
      const response = await fetch("http://localhost:3000/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Logout failed with status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Logout successful:", result);

      // Show success notification
      showSweetAlert(
        "success",
        "Logout Berhasil!",
        "Logout berhasil! Sampai jumpa kembali."
      );

      // Clear auth data after delay for notification
      setTimeout(() => {
        clearAuthData();
      }, 2000);
    } catch (error) {
      console.error("Error during logout:", error);
      let errorMessage = "Gagal logout. Silakan coba lagi.";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error
      ) {
        errorMessage = String(error.message);
      }

      showSweetAlert("error", "Logout Gagal", errorMessage);

      // Still clear auth data on error to ensure security
      clearAuthData();
    } finally {
      setIsLoggingOut(false);
      setShowConfirmModal(false);
    }
  };

  const clearAuthData = () => {
    // Remove all auth-related data from localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    // Remove auth cookies
    document.cookie =
      "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    // Redirect to login page
    router.push("/login");
  };

  const getUserData = (): UserData | null => {
    if (typeof window === "undefined") return null;

    try {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  };

  const userData = getUserData();

  const showSweetAlert = (type: AlertType, title: string, message: string) => {
    setAlertConfig({ type, title, message });
    setShowAlert(true);
  };

  const confirmLogout = () => {
    setShowConfirmModal(true);
  };

  return (
    <>
      {/* SweetAlert Component */}
      <SweetAlert
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        show={showAlert}
        onClose={() => setShowAlert(false)}
        duration={alertConfig.type === "success" ? 2000 : 5000}
        showCloseButton={true}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleLogout}
        title="Konfirmasi Logout"
        message="Apakah Anda yakin ingin logout dari akun Admin? Anda akan diarahkan ke halaman login."
        confirmText="Ya, Logout"
        cancelText="Batal"
        isLoading={isLoggingOut}
      />

      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link
                href="/admin/dashboard"
                className="text-xl font-bold text-gray-900 dark:text-white"
              >
                AdminPanel
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {/* Search Input */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari data..."
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-transparent"
                />
              </div>

              <AnimatedThemeToggler />

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={isLoggingOut}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50"
                >
                  <UserCircle className="h-8 w-8 text-[#005EB8]" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  {/* User info in dropdown */}
                  {userData && (
                    <>
                      <div className="px-2 py-1.5 text-sm border-b border-gray-200 dark:border-gray-700">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {userData.name}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          {userData.email}
                        </p>
                      </div>
                      <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                    </>
                  )}

                  <DropdownMenuItem
                    asChild
                    className="focus:bg-gray-100 dark:focus:bg-gray-700"
                  >
                    <Link
                      href="/admin/users"
                      className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"
                    >
                      <Users className="h-4 w-4" />
                      <span>Users</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-gray-100 dark:focus:bg-gray-700"
                  >
                    <Link
                      href="/admin/mentors"
                      className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"
                    >
                      <Users2 className="h-4 w-4" />
                      <span>Mentors</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-gray-100 dark:focus:bg-gray-700"
                  >
                    <Link
                      href="/admin/settings"
                      className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                  <DropdownMenuItem
                    onClick={confirmLogout}
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
    </>
  );
}
