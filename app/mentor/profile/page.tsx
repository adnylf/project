'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Camera,
  CheckCircle,
  Edit,
  X,
  Plus,
  UserCircle
} from 'lucide-react';
import MentorLayout from '@/components/mentor/mentor-layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function MentorProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [formData, setFormData] = useState({
    fullName: 'Dr. Ahmad Hidayat',
    email: 'ahmad.hidayat@email.com',
    phone: '081234567890',
    birthDate: '1985-08-20',
    gender: 'male',
    bio: 'Saya adalah instruktur berpengalaman dengan lebih dari 5 tahun mengajar pemrograman. Fokus saya adalah membuat pembelajaran menjadi mudah dan menyenangkan untuk semua orang, termasuk penyandang disabilitas.',
    expertise: ['Web Development', 'JavaScript', 'React', 'Python'],
    newExpertise: '',
    bankAccount: {
      accountName: 'Ahmad Hidayat',
      accountNumber: '12345678765',
      bankName: 'BCA',
      branch: 'Cabang Sudirman',
    },
    socialLinks: {
      portfolio: 'https://ahmadportfolio.com',
      github: 'https://github.com/ahmadh',
      linkedin: 'https://linkedin.com/in/ahmadh',
    },
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBankAccountChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      bankAccount: {
        ...prev.bankAccount,
        [field]: value
      }
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  const handleAddExpertise = () => {
    if (formData.newExpertise.trim()) {
      setFormData(prev => ({
        ...prev,
        expertise: [...prev.expertise, formData.newExpertise],
        newExpertise: ''
      }));
    }
  };

  const handleRemoveExpertise = (expertise: string) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.filter(e => e !== expertise)
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    console.log('Saving profile:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'jt';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <MentorLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeIn">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Profile Mentor
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Kelola informasi profil dan keahlian Anda
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

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Profile & Stats */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <Card className="flex-1 rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-[#005EB8]">
                      <img
                        src={avatarPreview || ''}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                        className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-[#005EB8] hover:bg-[#004A93] flex items-center justify-center text-white transition-colors"
                      >
                        <Camera className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {formData.fullName}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {formData.email}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge className="bg-[#005EB8]">Mentor</Badge>
                    <Badge className="bg-[#008A00]">Verified</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1 rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-100">
              <CardHeader>
                <CardTitle className="text-lg">Statistik Mentor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Kursus Aktif</span>
                  <span className="font-bold text-[#005EB8]">3</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Total Siswa</span>
                  <span className="font-bold text-[#008A00]">
                    {isClient ? formatNumber(2790) : '2.790'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Pendapatan</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {isClient ? formatNumber(36500000) : 'Rp 36,5jt'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Forms */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            <Card className="flex-1 rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Informasi Pribadi</CardTitle>
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
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
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
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Tanggal Lahir</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => handleInputChange('birthDate', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Jenis Kelamin</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleInputChange('gender', value)}
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ceritakan tentang diri Anda dan pengalaman mengajar Anda
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Full Width Sections */}
        <Card className="w-full rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Keahlian</CardTitle>
            <CardDescription>
              Daftarkan keahlian dan topik yang Anda ajarkan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {formData.expertise.map((exp) => (
                <Badge key={exp} className="bg-[#005EB8] text-white text-sm py-1 px-3">
                  {exp}
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveExpertise(exp)}
                      className="ml-2 hover:opacity-80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>

            {isEditing && (
              <div className="flex gap-2">
                <Input
                  placeholder="Tambah keahlian baru..."
                  value={formData.newExpertise}
                  onChange={(e) => handleInputChange('newExpertise', e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddExpertise();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddExpertise}
                  className="bg-[#005EB8] hover:bg-[#004A93]"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide delay-200">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Tautan Sosial</CardTitle>
              <CardDescription>
                Tambahkan tautan ke portfolio dan media sosial Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="portfolio">Portfolio Website</Label>
                <Input
                  id="portfolio"
                  placeholder="https://..."
                  value={formData.socialLinks.portfolio}
                  onChange={(e) => handleSocialLinkChange('portfolio', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github">GitHub</Label>
                <Input
                  id="github"
                  placeholder="https://github.com/..."
                  value={formData.socialLinks.github}
                  onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  placeholder="https://linkedin.com/in/..."
                  value={formData.socialLinks.linkedin}
                  onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide delay-300">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Rekening Bank</CardTitle>
              <CardDescription>
                Gunakan untuk pencairan komisi kursus
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Nama Bank</Label>
                  <Select
                    value={formData.bankAccount.bankName}
                    onValueChange={(value) => handleBankAccountChange('bankName', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BCA">BCA</SelectItem>
                      <SelectItem value="BRI">BRI</SelectItem>
                      <SelectItem value="BNI">BNI</SelectItem>
                      <SelectItem value="Mandiri">Mandiri</SelectItem>
                      <SelectItem value="BSI">BSI</SelectItem>
                      <SelectItem value="CIMB">CIMB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountName">Nama Pemilik Rekening</Label>
                  <Input
                    id="accountName"
                    value={formData.bankAccount.accountName}
                    onChange={(e) => handleBankAccountChange('accountName', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="accountNumber">Nomor Rekening</Label>
                  <Input
                    id="accountNumber"
                    value={formData.bankAccount.accountNumber}
                    onChange={(e) => handleBankAccountChange('accountNumber', e.target.value)}
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Nomor rekening dienkripsi dan hanya terlihat oleh admin
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MentorLayout>
  );
}