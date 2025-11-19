"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Globe,
  Bell,
  Shield,
  Mail,
  CreditCard,
  Users,
  BookOpen,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import AdminLayout from "@/components/admin/admin-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define types for our settings
type Settings = {
  general: {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    adminEmail: string;
    supportEmail: string;
    defaultLanguage: string;
    timezone: string;
    dateFormat: string;
    maintenanceMode: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    userRegistrations: boolean;
    courseSubmissions: boolean;
    paymentNotifications: boolean;
    systemAlerts: boolean;
    weeklyReports: boolean;
    mentorApplications: boolean;
    certificateRequests: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireStrongPassword: boolean;
    ipWhitelist: string[];
    auditLogRetention: number;
  };
  payment: {
    currency: string;
    platformFee: number;
    payoutThreshold: number;
    payoutSchedule: string;
    autoApprovePayouts: boolean;
    paymentMethods: string[];
    taxRate: number;
    invoicePrefix: string;
  };
  courses: {
    autoApproveCourses: boolean;
    maxCourseDuration: number;
    minCoursePrice: number;
    maxCoursePrice: number;
    allowCoursePreviews: boolean;
    requireCourseApproval: boolean;
    courseCategories: string[];
    defaultCommission: number;
  };
};

type TabKey = "general" | "notifications" | "security" | "payment" | "courses";

export default function AdminSettings() {
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [settings, setSettings] = useState<Settings>({
    // General Settings
    general: {
      siteName: "Online Course Disabilitas",
      siteDescription: "Platform pembelajaran online inklusif untuk semua",
      siteUrl: "https://course-disabilitas.com",
      adminEmail: "admin@course-disabilitas.com",
      supportEmail: "support@course-disabilitas.com",
      defaultLanguage: "id",
      timezone: "Asia/Jakarta",
      dateFormat: "DD/MM/YYYY",
      maintenanceMode: false,
    },
    // Notification Settings
    notifications: {
      emailNotifications: true,
      userRegistrations: true,
      courseSubmissions: true,
      paymentNotifications: true,
      systemAlerts: true,
      weeklyReports: true,
      mentorApplications: true,
      certificateRequests: true,
    },
    // Security Settings
    security: {
      twoFactorAuth: true,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireStrongPassword: true,
      ipWhitelist: ["192.168.1.0/24"],
      auditLogRetention: 365,
    },
    // Payment Settings
    payment: {
      currency: "IDR",
      platformFee: 10,
      payoutThreshold: 100000,
      payoutSchedule: "weekly",
      autoApprovePayouts: false,
      paymentMethods: ["credit_card", "bank_transfer", "e_wallet"],
      taxRate: 0,
      invoicePrefix: "INV",
    },
    // Course Settings
    courses: {
      autoApproveCourses: false,
      maxCourseDuration: 12,
      minCoursePrice: 0,
      maxCoursePrice: 5000000,
      allowCoursePreviews: true,
      requireCourseApproval: true,
      courseCategories: ["Programming", "Design", "Business", "Lifestyle"],
      defaultCommission: 70,
    },
  });

  const [formData, setFormData] = useState<Settings>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleInputChange = <K extends keyof Settings>(
    section: K,
    field: keyof Settings[K],
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = () => {
    console.log("Saving settings:", formData);
    // API call: PUT /api/admin/settings
    setSettings(formData);
    setHasChanges(false);
    // Show success message
    alert("Pengaturan berhasil disimpan");
  };

  const handleResetSettings = () => {
    setFormData(settings);
    setHasChanges(false);
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="siteName">Nama Situs</Label>
          <Input
            id="siteName"
            value={formData.general.siteName}
            onChange={(e) =>
              handleInputChange("general", "siteName", e.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="siteUrl">URL Situs</Label>
          <Input
            id="siteUrl"
            value={formData.general.siteUrl}
            onChange={(e) =>
              handleInputChange("general", "siteUrl", e.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="adminEmail">Email Admin</Label>
          <Input
            id="adminEmail"
            type="email"
            value={formData.general.adminEmail}
            onChange={(e) =>
              handleInputChange("general", "adminEmail", e.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supportEmail">Email Support</Label>
          <Input
            id="supportEmail"
            type="email"
            value={formData.general.supportEmail}
            onChange={(e) =>
              handleInputChange("general", "supportEmail", e.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultLanguage">Bahasa Default</Label>
          <Select
            value={formData.general.defaultLanguage}
            onValueChange={(value) =>
              handleInputChange("general", "defaultLanguage", value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">Indonesia</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Zona Waktu</Label>
          <Select
            value={formData.general.timezone}
            onValueChange={(value) =>
              handleInputChange("general", "timezone", value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Asia/Jakarta">WIB (Jakarta)</SelectItem>
              <SelectItem value="Asia/Makassar">WITA (Makassar)</SelectItem>
              <SelectItem value="Asia/Jayapura">WIT (Jayapura)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="siteDescription">Deskripsi Situs</Label>
        <Textarea
          id="siteDescription"
          value={formData.general.siteDescription}
          onChange={(e) =>
            handleInputChange("general", "siteDescription", e.target.value)
          }
          rows={3}
        />
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div>
          <Label className="font-medium">Maintenance Mode</Label>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nonaktifkan akses publik ke situs
          </p>
        </div>
        <Switch
          checked={formData.general.maintenanceMode}
          onCheckedChange={(value) =>
            handleInputChange("general", "maintenanceMode", value)
          }
        />
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div>
          <Label className="font-medium">Email Notifications</Label>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Aktifkan semua notifikasi email
          </p>
        </div>
        <Switch
          checked={formData.notifications.emailNotifications}
          onCheckedChange={(value) =>
            handleInputChange("notifications", "emailNotifications", value)
          }
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div>
            <Label className="font-medium">Pendaftaran User Baru</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Notifikasi ketika user mendaftar
            </p>
          </div>
          <Switch
            checked={formData.notifications.userRegistrations}
            onCheckedChange={(value) =>
              handleInputChange("notifications", "userRegistrations", value)
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div>
            <Label className="font-medium">Pengajuan Kursus</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Notifikasi kursus baru menunggu persetujuan
            </p>
          </div>
          <Switch
            checked={formData.notifications.courseSubmissions}
            onCheckedChange={(value) =>
              handleInputChange("notifications", "courseSubmissions", value)
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div>
            <Label className="font-medium">Notifikasi Pembayaran</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Notifikasi transaksi pembayaran
            </p>
          </div>
          <Switch
            checked={formData.notifications.paymentNotifications}
            onCheckedChange={(value) =>
              handleInputChange("notifications", "paymentNotifications", value)
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div>
            <Label className="font-medium">System Alerts</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Notifikasi error dan warning sistem
            </p>
          </div>
          <Switch
            checked={formData.notifications.systemAlerts}
            onCheckedChange={(value) =>
              handleInputChange("notifications", "systemAlerts", value)
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div>
            <Label className="font-medium">Laporan Mingguan</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Kirim laporan mingguan ke email admin
            </p>
          </div>
          <Switch
            checked={formData.notifications.weeklyReports}
            onCheckedChange={(value) =>
              handleInputChange("notifications", "weeklyReports", value)
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div>
            <Label className="font-medium">Aplikasi Mentor</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Notifikasi aplikasi mentor baru
            </p>
          </div>
          <Switch
            checked={formData.notifications.mentorApplications}
            onCheckedChange={(value) =>
              handleInputChange("notifications", "mentorApplications", value)
            }
          />
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div>
          <Label className="font-medium">Two-Factor Authentication</Label>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Wajibkan 2FA untuk akses admin
          </p>
        </div>
        <Switch
          checked={formData.security.twoFactorAuth}
          onCheckedChange={(value) =>
            handleInputChange("security", "twoFactorAuth", value)
          }
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="sessionTimeout">Session Timeout (menit)</Label>
          <Input
            id="sessionTimeout"
            type="number"
            value={formData.security.sessionTimeout}
            onChange={(e) =>
              handleInputChange(
                "security",
                "sessionTimeout",
                parseInt(e.target.value)
              )
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
          <Input
            id="maxLoginAttempts"
            type="number"
            value={formData.security.maxLoginAttempts}
            onChange={(e) =>
              handleInputChange(
                "security",
                "maxLoginAttempts",
                parseInt(e.target.value)
              )
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="passwordMinLength">Minimal Panjang Password</Label>
          <Input
            id="passwordMinLength"
            type="number"
            value={formData.security.passwordMinLength}
            onChange={(e) =>
              handleInputChange(
                "security",
                "passwordMinLength",
                parseInt(e.target.value)
              )
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="auditLogRetention">Retensi Log (hari)</Label>
          <Input
            id="auditLogRetention"
            type="number"
            value={formData.security.auditLogRetention}
            onChange={(e) =>
              handleInputChange(
                "security",
                "auditLogRetention",
                parseInt(e.target.value)
              )
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div>
          <Label className="font-medium">Password Kuat</Label>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Wajibkan kombinasi huruf, angka, dan simbol
          </p>
        </div>
        <Switch
          checked={formData.security.requireStrongPassword}
          onCheckedChange={(value) =>
            handleInputChange("security", "requireStrongPassword", value)
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ipWhitelist">IP Whitelist</Label>
        <Textarea
          id="ipWhitelist"
          value={formData.security.ipWhitelist.join(", ")}
          onChange={(e) =>
            handleInputChange(
              "security",
              "ipWhitelist",
              e.target.value.split(",").map((ip) => ip.trim())
            )
          }
          placeholder="Masukkan IP addresses dipisahkan koma"
          rows={3}
        />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Hanya IP yang terdaftar yang bisa mengakses panel admin
        </p>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="currency">Mata Uang</Label>
          <Select
            value={formData.payment.currency}
            onValueChange={(value) =>
              handleInputChange("payment", "currency", value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="platformFee">Platform Fee (%)</Label>
          <Input
            id="platformFee"
            type="number"
            value={formData.payment.platformFee}
            onChange={(e) =>
              handleInputChange(
                "payment",
                "platformFee",
                parseFloat(e.target.value)
              )
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payoutThreshold">Minimum Payout</Label>
          <Input
            id="payoutThreshold"
            type="number"
            value={formData.payment.payoutThreshold}
            onChange={(e) =>
              handleInputChange(
                "payment",
                "payoutThreshold",
                parseInt(e.target.value)
              )
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payoutSchedule">Jadwal Payout</Label>
          <Select
            value={formData.payment.payoutSchedule}
            onValueChange={(value) =>
              handleInputChange("payment", "payoutSchedule", value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Harian</SelectItem>
              <SelectItem value="weekly">Mingguan</SelectItem>
              <SelectItem value="monthly">Bulanan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div>
          <Label className="font-medium">Auto Approve Payouts</Label>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Otomatis setujui payout yang memenuhi syarat
          </p>
        </div>
        <Switch
          checked={formData.payment.autoApprovePayouts}
          onCheckedChange={(value) =>
            handleInputChange("payment", "autoApprovePayouts", value)
          }
        />
      </div>
    </div>
  );

  const renderCourseSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div>
          <Label className="font-medium">Auto Approve Courses</Label>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Otomatis setujui kursus baru tanpa review
          </p>
        </div>
        <Switch
          checked={formData.courses.autoApproveCourses}
          onCheckedChange={(value) =>
            handleInputChange("courses", "autoApproveCourses", value)
          }
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="maxCourseDuration">
            Maksimal Durasi Kursus (bulan)
          </Label>
          <Input
            id="maxCourseDuration"
            type="number"
            value={formData.courses.maxCourseDuration}
            onChange={(e) =>
              handleInputChange(
                "courses",
                "maxCourseDuration",
                parseInt(e.target.value)
              )
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minCoursePrice">Harga Minimum Kursus</Label>
          <Input
            id="minCoursePrice"
            type="number"
            value={formData.courses.minCoursePrice}
            onChange={(e) =>
              handleInputChange(
                "courses",
                "minCoursePrice",
                parseInt(e.target.value)
              )
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxCoursePrice">Harga Maksimum Kursus</Label>
          <Input
            id="maxCoursePrice"
            type="number"
            value={formData.courses.maxCoursePrice}
            onChange={(e) =>
              handleInputChange(
                "courses",
                "maxCoursePrice",
                parseInt(e.target.value)
              )
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultCommission">Komisi Default Mentor (%)</Label>
          <Input
            id="defaultCommission"
            type="number"
            value={formData.courses.defaultCommission}
            onChange={(e) =>
              handleInputChange(
                "courses",
                "defaultCommission",
                parseInt(e.target.value)
              )
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div>
          <Label className="font-medium">Course Previews</Label>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Izinkan preview kursus untuk user belum login
          </p>
        </div>
        <Switch
          checked={formData.courses.allowCoursePreviews}
          onCheckedChange={(value) =>
            handleInputChange("courses", "allowCoursePreviews", value)
          }
        />
      </div>
    </div>
  );

  const tabContent: Record<TabKey, JSX.Element> = {
    general: renderGeneralSettings(),
    notifications: renderNotificationSettings(),
    security: renderSecuritySettings(),
    payment: renderPaymentSettings(),
    courses: renderCourseSettings(),
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="animate-fadeIn">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Pengaturan global sistem dan preferensi admin
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab("general")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === "general"
                        ? "bg-[#005EB8] text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Globe className="h-4 w-4" />
                    <span>General</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("notifications")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === "notifications"
                        ? "bg-[#005EB8] text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Bell className="h-4 w-4" />
                    <span>Notifications</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("security")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === "security"
                        ? "bg-[#005EB8] text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Security</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("payment")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === "payment"
                        ? "bg-[#005EB8] text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Payment</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("courses")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === "courses"
                        ? "bg-[#005EB8] text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Courses</span>
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide">
              <CardHeader>
                <CardTitle className="text-xl font-bold capitalize">
                  {activeTab} Settings
                </CardTitle>
                <CardDescription>
                  Kelola pengaturan {activeTab} untuk platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {tabContent[activeTab]}

                {/* Save Button */}
                <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={!hasChanges}
                    className="bg-[#005EB8] hover:bg-[#004A93]"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Perubahan
                  </Button>

                  {hasChanges && (
                    <Button
                      variant="outline"
                      onClick={handleResetSettings}
                      className="border-gray-300 dark:border-gray-600"
                    >
                      Reset
                    </Button>
                  )}

                  {!hasChanges && (
                    <div className="flex items-center gap-2 text-[#008A00]">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">
                        Semua perubahan telah disimpan
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
