'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Bell,
  Key,
  CheckCircle,
} from 'lucide-react';
import MentorLayout from '@/components/mentor/mentor-layout';

export default function MentorSettings() {
  const [notificationSettings, setNotificationSettings] = useState({
    courseEnrollment: true,
    studentMessages: true,
    paymentReceived: true,
    promotionalEmails: false,
    weeklyReport: true,
    courseReviews: true,
    systemUpdates: true,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Password baru tidak cocok!');
      return;
    }
    console.log('Changing password...');
    alert('Password berhasil diubah');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleSaveSettings = () => {
    console.log('Saving settings...');
    alert('Pengaturan berhasil disimpan');
  };

  return (
    <MentorLayout>
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
                      <Label className="font-medium">Pendaftaran Siswa Baru</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Notifikasi ketika ada siswa baru
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.courseEnrollment}
                      onCheckedChange={(value) => handleNotificationChange('courseEnrollment', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Pesan dari Siswa</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Notifikasi pesan masuk dari siswa
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.studentMessages}
                      onCheckedChange={(value) => handleNotificationChange('studentMessages', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Pembayaran Diterima</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Notifikasi penjualan dan pembayaran
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.paymentReceived}
                      onCheckedChange={(value) => handleNotificationChange('paymentReceived', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Email Promosi</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Email tentang promo dan penawaran
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.promotionalEmails}
                      onCheckedChange={(value) => handleNotificationChange('promotionalEmails', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Laporan Mingguan</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Ringkasan performa mingguan
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklyReport}
                      onCheckedChange={(value) => handleNotificationChange('weeklyReport', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Review Kursus</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Notifikasi review dari siswa
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.courseReviews}
                      onCheckedChange={(value) => handleNotificationChange('courseReviews', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Update Sistem</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Notifikasi update dan maintenance
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.systemUpdates}
                      onCheckedChange={(value) => handleNotificationChange('systemUpdates', value)}
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
                  <CardTitle className="text-xl font-bold">Keamanan</CardTitle>
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
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Masukkan password saat ini"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Password Baru</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Masukkan password baru"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Konfirmasi Password Baru
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Konfirmasi password baru"
                    />
                  </div>

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
                  className="w-full bg-[#D93025] hover:bg-[#B71C1C] mt-auto"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Ubah Password
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MentorLayout>
  );
}