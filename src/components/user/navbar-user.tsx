// components/navbar/NavbarUser.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserCircle, Settings, LayoutGrid, LogOut, Menu } from "lucide-react";
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
        message="Apakah Anda yakin ingin logout dari akun Anda? Anda akan diarahkan ke halaman login."
        confirmText="Ya, Logout"
        cancelText="Batal"
        isLoading={isLoggingOut}
      />

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
                      href="/user/profile"
                      className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"
                    >
                      <UserCircle className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-gray-100 dark:focus:bg-gray-700"
                  >
                    <Link
                      href="/user/learn"
                      className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"
                    >
                      <LayoutGrid className="h-4 w-4" />
                      <span>My Courses</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-gray-100 dark:focus:bg-gray-700"
                  >
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
