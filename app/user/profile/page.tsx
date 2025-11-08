"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  User,
  Camera,
  CheckCircle,
  Edit,
} from "lucide-react";
import UserLayout from "@/components/user/user-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "Ahmad Fauzi Rahman",
    email: "ahmad.fauzi@email.com",
    phone: "081234567890",
    birthDate: "1995-05-15",
    gender: "male",
    address: "Jl. Merdeka No. 123, Jakarta Pusat",
    bio: "Seorang pembelajar yang antusias dalam bidang teknologi dan pengembangan web. Saya percaya bahwa pendidikan adalah kunci untuk membuka peluang baru dalam hidup.",
    disabilityType: "none",
    accessibilityPreferences: {
      screenReader: false,
      subtitle: true,
      signLanguage: false,
      highContrast: false,
      textSize: "medium",
    },
  });

  const disabilityLabels = {
    none: "Tidak Ada",
    visual: "Tunanetra",
    hearing: "Tunarungu",
    physical: "Tunadaksa",
    cognitive: "Kognitif",
    other: "Lainnya",
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAccessibilityChange = (
    field: string,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      accessibilityPreferences: {
        ...prev.accessibilityPreferences,
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    console.log("Saving profile data:", formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleAvatarUpload = () => {
    console.log("Upload avatar");
  };

  return (
    <UserLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeIn">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Profile Saya
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Kelola informasi pribadi dan preferensi aksesibilitas Anda
            </p>
          </div>
          <div>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-[#005EB8] hover:bg-[#004A93]"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Batal
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-[#008A00] hover:bg-[#006600]"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Simpan
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <Card className="flex-1 rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="h-32 w-32 rounded-full bg-gradient-to-br from-[#005EB8] to-[#008A00] flex items-center justify-center text-white text-4xl font-bold">
                      AF
                    </div>
                    {isEditing && (
                      <button
                        onClick={handleAvatarUpload}
                        className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-[#005EB8] hover:bg-[#004A93] flex items-center justify-center text-white transition-colors"
                      >
                        <Camera className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {formData.fullName}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {formData.email}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Jenis Disabilitas:{" "}
                      {
                        disabilityLabels[
                          formData.disabilityType as keyof typeof disabilityLabels
                        ]
                      }
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge className="bg-[#005EB8]">Student</Badge>
                    <Badge className="bg-[#008A00]">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1 rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-100">
              <CardHeader>
                <CardTitle className="text-lg">Statistik</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">
                    Kursus Aktif
                  </span>
                  <span className="font-bold text-[#005EB8]">6</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">
                    Kursus Selesai
                  </span>
                  <span className="font-bold text-[#008A00]">3</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">
                    Sertifikat
                  </span>
                  <span className="font-bold text-[#F4B400]">3</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">
                    Jam Belajar
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    24
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Progres Keseluruhan
                  </span>
                  <span className="font-bold text-[#F4B400]">75%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            <Card className="flex-1 rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide">
              <CardHeader>
                <CardTitle className="text-xl font-bold">
                  Informasi Pribadi
                </CardTitle>
                <CardDescription>
                  Data pribadi Anda akan dijaga kerahasiaannya
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nama Lengkap</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) =>
                        handleInputChange("fullName", e.target.value)
                      }
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">No. Telepon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Tanggal Lahir</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) =>
                        handleInputChange("birthDate", e.target.value)
                      }
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Jenis Kelamin</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) =>
                        handleInputChange("gender", value)
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Laki-laki</SelectItem>
                        <SelectItem value="female">Perempuan</SelectItem>
                        <SelectItem value="other">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disabilityType">
                      Jenis Disabilitas (Opsional)
                    </Label>
                    <Select
                      value={formData.disabilityType}
                      onValueChange={(value) =>
                        handleInputChange("disabilityType", value)
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tidak Ada</SelectItem>
                        <SelectItem value="visual">Tunanetra</SelectItem>
                        <SelectItem value="hearing">Tunarungu</SelectItem>
                        <SelectItem value="physical">Tunadaksa</SelectItem>
                        <SelectItem value="cognitive">Kognitif</SelectItem>
                        <SelectItem value="other">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="w-full rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide delay-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Preferensi Aksesibilitas
            </CardTitle>
            <CardDescription>
              Sesuaikan pengalaman belajar dengan kebutuhan Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div>
                  <Label className="font-medium">Screen Reader</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Dukungan pembaca layar
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.accessibilityPreferences.screenReader}
                  onChange={(e) =>
                    handleAccessibilityChange("screenReader", e.target.checked)
                  }
                  disabled={!isEditing}
                  className="h-5 w-5 rounded border-gray-300 text-[#005EB8] focus:ring-[#005EB8]"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div>
                  <Label className="font-medium">Subtitle</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tampilkan subtitle video
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.accessibilityPreferences.subtitle}
                  onChange={(e) =>
                    handleAccessibilityChange("subtitle", e.target.checked)
                  }
                  disabled={!isEditing}
                  className="h-5 w-5 rounded border-gray-300 text-[#005EB8] focus:ring-[#005EB8]"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div>
                  <Label className="font-medium">Bahasa Isyarat</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Video bahasa isyarat
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.accessibilityPreferences.signLanguage}
                  onChange={(e) =>
                    handleAccessibilityChange("signLanguage", e.target.checked)
                  }
                  disabled={!isEditing}
                  className="h-5 w-5 rounded border-gray-300 text-[#005EB8] focus:ring-[#005EB8]"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div>
                  <Label className="font-medium">Kontras Tinggi</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Mode kontras tinggi
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.accessibilityPreferences.highContrast}
                  onChange={(e) =>
                    handleAccessibilityChange("highContrast", e.target.checked)
                  }
                  disabled={!isEditing}
                  className="h-5 w-5 rounded border-gray-300 text-[#005EB8] focus:ring-[#005EB8]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="textSize">Ukuran Teks</Label>
              <Select
                value={formData.accessibilityPreferences.textSize}
                onValueChange={(value) =>
                  handleAccessibilityChange("textSize", value)
                }
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Kecil</SelectItem>
                  <SelectItem value="medium">Sedang</SelectItem>
                  <SelectItem value="large">Besar</SelectItem>
                  <SelectItem value="extra-large">Sangat Besar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}