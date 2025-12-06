"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Add this import
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Key, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import UserLayout from "@/components/user/user-layout";
import SweetAlert, { AlertType } from "@/components/ui/sweet-alert";
import ProtectedRoute from "@/components/ui/protected-route";
export default function UserSettings() {
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    courseUpdates: true,
    promotions: false,
    weeklyDigest: true,
    assignmentReminders: true,
    certificateAlerts: true,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    general: "",
  });
  const [isLoading, setIsLoading] = useState(false);
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
  const router = useRouter(); // Initialize router here

  useEffect(() => {
    // Validate passwords whenever they change
    validatePasswords();
  }, [
    passwordData.newPassword,
    passwordData.confirmPassword,
    passwordData.currentPassword,
  ]);

  const validatePasswords = () => {
    const errors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      general: "",
    };
    // Validate new password criteria
    if (passwordData.newPassword) {
      const criteria = [
        {
          test: passwordData.newPassword.length >= 8,
          message: "Minimal 8 karakter",
        },
        {
          test: /[A-Z]/.test(passwordData.newPassword),
          message: "Huruf kapital",
        },
        {
          test: /[a-z]/.test(passwordData.newPassword),
          message: "Huruf kecil",
        },
        { test: /[0-9]/.test(passwordData.newPassword), message: "Angka" },
        {
          test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
            passwordData.newPassword
          ),
          message: "Simbol",
        },
      ];
      const failedCriteria = criteria.filter((c) => !c.test);
      if (failedCriteria.length > 0) {
        errors.newPassword = `Password tidak memenuhi kriteria (${failedCriteria
          .map((c) => c.message)
          .join(", ")})`;
      }
    }
    // Check if new password matches confirmation
    if (passwordData.newPassword && passwordData.confirmPassword) {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        errors.confirmPassword = "Password baru dan konfirmasi tidak cocok";
      }
    }
    // Check if old and new password are the same
    if (passwordData.currentPassword && passwordData.newPassword) {
      if (passwordData.currentPassword === passwordData.newPassword) {
        errors.general = "Password lama dan baru tidak boleh sama";
      }
    }
    setPasswordErrors(errors);
    return !errors.general && !errors.newPassword && !errors.confirmPassword;
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePasswordChange = async () => {
    // Reset general error
    setPasswordErrors((prev) => ({ ...prev, general: "" }));
    // Validate form
    if (!validatePasswords()) {
      return;
    }
    // Validate current password is filled
    if (!passwordData.currentPassword.trim()) {
      setPasswordErrors((prev) => ({
        ...prev,
        currentPassword: "Password lama harus diisi",
      }));
      return;
    }
    if (!passwordData.newPassword.trim()) {
      setPasswordErrors((prev) => ({
        ...prev,
        newPassword: "Password baru harus diisi",
      }));
      return;
    }
    setIsLoading(true);
    try {
      // Get token from localStorage or cookies
      let token = localStorage.getItem("accessToken");

      // Fallback to cookie if not found in localStorage
      if (!token) {
        const cookieMatch = document.cookie.match(
          /(?:^|;)\s*accessToken\s*=\s*([^;]+)/
        );
        if (cookieMatch && cookieMatch[1]) {
          token = decodeURIComponent(cookieMatch[1]);
        }
      }

      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login ulang.");
      }

      const response = await fetch(
        "http://localhost:3000/api/auth/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = "Terjadi kesalahan saat mengubah password";
        // Map specific error messages
        if (
          data.message?.includes("Current password is incorrect") ||
          data.error?.includes("Current password is incorrect")
        ) {
          errorMessage = "Password lama salah";
          setPasswordErrors((prev) => ({
            ...prev,
            currentPassword: errorMessage,
          }));
        } else if (
          data.message?.includes(
            "Password must be at least 8 characters long"
          ) ||
          data.error?.includes("Password must be at least 8 characters long")
        ) {
          errorMessage = "Password baru tidak memenuhi kriteria keamanan";
          setPasswordErrors((prev) => ({ ...prev, newPassword: errorMessage }));
        } else if (
          data.message?.includes("User not found") ||
          data.error?.includes("User not found")
        ) {
          errorMessage = "Akun tidak ditemukan";
        } else if (
          data.message?.includes(
            "Current password and new password are required"
          ) ||
          data.error?.includes("Current password and new password are required")
        ) {
          if (!passwordData.currentPassword) {
            setPasswordErrors((prev) => ({
              ...prev,
              currentPassword: "Password lama harus diisi",
            }));
          }
          if (!passwordData.newPassword) {
            setPasswordErrors((prev) => ({
              ...prev,
              newPassword: "Password baru harus diisi",
            }));
          }
        } else {
          // Try to get more specific error from the API response
          errorMessage =
            data.message ||
            data.error ||
            "Terjadi kesalahan saat mengubah password";
          setPasswordErrors((prev) => ({ ...prev, general: errorMessage }));
        }
        throw new Error(errorMessage);
      }

      // Show success notification
      showSweetAlert(
        "success",
        "Password Berhasil Diubah!",
        "Password Anda telah berhasil diubah."
      );

      // Reset form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Clear errors
      setPasswordErrors({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        general: "",
      });
    } catch (err) {
      console.error("Password change failed:", err);
      // Type-safe error handling
      let errorMessage = "Terjadi kesalahan saat mengubah password";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else if (typeof err === "object" && err !== null && "message" in err) {
        errorMessage = String(err.message);
      }

      // Only show alert if it's not a field-specific error
      if (
        !passwordErrors.currentPassword &&
        !passwordErrors.newPassword &&
        !passwordErrors.confirmPassword &&
        !passwordErrors.general
      ) {
        showSweetAlert("error", "Gagal Mengubah Password", errorMessage);
      }

      // If token is invalid/expired, clear it and redirect to login
      if (
        errorMessage.includes("Token tidak ditemukan") ||
        errorMessage.includes("invalid token") ||
        errorMessage.includes("Token expired")
      ) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        document.cookie = "accessToken=; path=/; max-age=0";
        document.cookie = "refreshToken=; path=/; max-age=0";
        showSweetAlert(
          "error",
          "Sesi Habis",
          "Anda akan dialihkan ke halaman login"
        );
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = () => {
    console.log("Saving settings...");
    // Implement notification settings save logic here
  };

  const showSweetAlert = (type: AlertType, title: string, message: string) => {
    setAlertConfig({ type, title, message });
    setShowAlert(true);
  };

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="space-y-8">
          <div className="animate-fadeIn">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Pengaturan
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Kelola preferensi akun dan keamanan Anda
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Card Notifikasi */}
            <div className="flex">
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn flex-1 flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-[#005EB8]" />
                    <CardTitle className="text-xl font-bold">
                      Notifikasi
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Atur preferensi notifikasi Anda
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 flex flex-col">
                  <div className="space-y-6 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Email Notifikasi</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Terima notifikasi melalui email
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(value) =>
                          handleNotificationChange("emailNotifications", value)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Update Kursus</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Notifikasi materi baru
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.courseUpdates}
                        onCheckedChange={(value) =>
                          handleNotificationChange("courseUpdates", value)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">
                          Promosi & Penawaran
                        </Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Info promo dan diskon
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.promotions}
                        onCheckedChange={(value) =>
                          handleNotificationChange("promotions", value)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">
                          Ringkasan Mingguan
                        </Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Laporan progress mingguan
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.weeklyDigest}
                        onCheckedChange={(value) =>
                          handleNotificationChange("weeklyDigest", value)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Pengingat Tugas</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Reminder deadline tugas
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.assignmentReminders}
                        onCheckedChange={(value) =>
                          handleNotificationChange("assignmentReminders", value)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Alert Sertifikat</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Notifikasi sertifikat siap
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.certificateAlerts}
                        onCheckedChange={(value) =>
                          handleNotificationChange("certificateAlerts", value)
                        }
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSaveSettings}
                    className="w-full bg-[#005EB8] hover:bg-[#004A93] mt-auto"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Simpan Notifikasi
                  </Button>
                </CardContent>
              </Card>
            </div>
            {/* Card Keamanan */}
            <div className="flex">
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-100 flex-1 flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-[#005EB8]" />
                    <CardTitle className="text-xl font-bold">
                      Keamanan
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Ubah password dan tingkatkan keamanan akun
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 flex flex-col">
                  <div className="space-y-6 flex-1">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Password Saat Ini</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                        onBlur={() => {
                          if (!passwordData.currentPassword.trim()) {
                            setPasswordErrors((prev) => ({
                              ...prev,
                              currentPassword: "Password lama harus diisi",
                            }));
                          } else {
                            setPasswordErrors((prev) => ({
                              ...prev,
                              currentPassword: "",
                            }));
                          }
                        }}
                        placeholder="Masukkan password saat ini"
                        className={
                          passwordErrors.currentPassword ? "border-red-500" : ""
                        }
                      />
                      {passwordErrors.currentPassword && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {passwordErrors.currentPassword}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Password Baru</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        onBlur={() => {
                          if (!passwordData.newPassword.trim()) {
                            setPasswordErrors((prev) => ({
                              ...prev,
                              newPassword: "Password baru harus diisi",
                            }));
                          }
                        }}
                        placeholder="Masukkan password baru"
                        className={
                          passwordErrors.newPassword ? "border-red-500" : ""
                        }
                      />
                      {passwordErrors.newPassword && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {passwordErrors.newPassword}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Konfirmasi Password Baru
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        onBlur={() => {
                          if (
                            passwordData.newPassword &&
                            passwordData.confirmPassword &&
                            passwordData.newPassword !==
                              passwordData.confirmPassword
                          ) {
                            setPasswordErrors((prev) => ({
                              ...prev,
                              confirmPassword:
                                "Password baru dan konfirmasi tidak cocok",
                            }));
                          }
                        }}
                        placeholder="Konfirmasi password baru"
                        className={
                          passwordErrors.confirmPassword ? "border-red-500" : ""
                        }
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {passwordErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                    {passwordErrors.general && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {passwordErrors.general}
                        </p>
                      </div>
                    )}
                    <Card className="rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Password harus memenuhi syarat:
                        </p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                          <li>Minimal 8 karakter</li>
                          <li>Kombinasi huruf besar dan kecil</li>
                          <li>Minimal 1 angka</li>
                          <li>Minimal 1 karakter spesial</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                  <Button
                    onClick={handlePasswordChange}
                    disabled={isLoading}
                    className="w-full bg-[#D93025] hover:bg-[#B71C1C] mt-auto flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Mengubah Password...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Ubah Password
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          {/* SweetAlert Component */}
          <SweetAlert
            type={alertConfig.type}
            title={alertConfig.title}
            message={alertConfig.message}
            show={showAlert}
            onClose={() => setShowAlert(false)}
            duration={alertConfig.type === "success" ? 3000 : 5000}
            showCloseButton={true}
          />
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}
