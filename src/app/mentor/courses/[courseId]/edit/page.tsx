// app/mentor/courses/[courseId]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle,
  Image,
  X,
  Check,
  Save,
  Eye,
  BarChart3,
  Users,
  Star
} from 'lucide-react';
import Link from 'next/link';
import MentorLayout from '@/components/mentor/mentor-layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useParams } from 'next/navigation';

// Mock data - in real app, this would come from API
const courseData = {
  id: 1,
  title: 'Dasar-Dasar Pemrograman Web',
  shortDescription: 'Pelajari fundamental pemrograman web modern dengan teknologi terkini',
  fullDescription: 'Kursus ini akan mengajarkan Anda dasar-dasar pemrograman web mulai dari HTML, CSS, hingga JavaScript. Anda akan belajar membuat website responsif dan interaktif dari nol.',
  category: 'Programming',
  level: 'beginner',
  price: 499000,
  status: 'active',
  thumbnail: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800',
  students: 1250,
  revenue: 15000000,
  rating: 4.8,
  totalReviews: 450,
  accessibilityFeatures: {
    subtitles: true,
    transcripts: true,
    signLanguage: false,
    highContrast: true,
    adjustableSpeed: true,
  },
  createdAt: '2024-01-15',
  lastUpdated: '2024-09-15',
};

export default function EditCourse() {
  const params = useParams();
  const courseId = params.courseId;
  
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    fullDescription: '',
    category: '',
    level: 'beginner',
    price: '',
    thumbnail: null as string | null,
    accessibilityFeatures: {
      subtitles: false,
      transcripts: false,
      signLanguage: false,
      highContrast: false,
      adjustableSpeed: false,
    },
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch course data
    const fetchCourseData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFormData({
        title: courseData.title,
        shortDescription: courseData.shortDescription,
        fullDescription: courseData.fullDescription,
        category: courseData.category,
        level: courseData.level,
        price: courseData.price.toString(),
        thumbnail: courseData.thumbnail,
        accessibilityFeatures: courseData.accessibilityFeatures,
      });
      
      setThumbnailPreview(courseData.thumbnail);
      setIsLoading(false);
    };

    fetchCourseData();
  }, [courseId]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAccessibilityChange = (feature: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      accessibilityFeatures: {
        ...prev.accessibilityFeatures,
        [feature]: value
      }
    }));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
        setFormData(prev => ({
          ...prev,
          thumbnail: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    console.log('Updating course:', formData);

    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
  };

  const isFormValid = formData.title && formData.shortDescription && formData.category && formData.price;

  const categories = [
    'Programming',
    'Design',
    'Business',
    'Language',
    'Data Science',
    'Music',
    'Photography',
    'Other'
  ];

  const accessibilityOptions = [
    { key: 'subtitles', label: 'Subtitle', description: 'Subtitle untuk video' },
    { key: 'transcripts', label: 'Transcript', description: 'Transkrip teks materi' },
    { key: 'signLanguage', label: 'Bahasa Isyarat', description: 'Video bahasa isyarat' },
    { key: 'highContrast', label: 'Kontras Tinggi', description: 'Tampilan kontras tinggi' },
    { key: 'adjustableSpeed', label: 'Kecepatan Variabel', description: 'Kontrol kecepatan pemutaran' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'jt';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  if (isLoading) {
    return (
      <MentorLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005EB8] mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Memuat data kursus...</p>
          </div>
        </div>
      </MentorLayout>
    );
  }

  return (
    <MentorLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-4">
            <Link href="/mentor/courses">
              <Button variant="outline" size="icon" className="border-gray-300 dark:border-gray-600">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Edit Kursus
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Perbarui informasi dan konten kursus Anda
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/courses/${courseId}`}>
              <Button variant="outline" className="border-gray-300 dark:border-gray-600">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </Link>
          </div>
        </div>

        {/* Course Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#005EB8]/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-[#005EB8]" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatNumber(courseData.students)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Siswa</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#008A00]/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-[#008A00]" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatNumber(courseData.revenue)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Pendapatan</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#F4B400]/10 flex items-center justify-center">
                  <Star className="h-5 w-5 text-[#F4B400]" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {courseData.rating}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-500/10 flex items-center justify-center">
                  <Badge className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {courseData.status === 'active' ? 'Aktif' : 'Draft'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Informasi Dasar</CardTitle>
              <CardDescription>
                Perbarui informasi umum tentang kursus Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Kursus *</Label>
                <Input
                  id="title"
                  placeholder="Contoh: Dasar-Dasar Pemrograman Web"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Minimal 10 karakter, maksimal 100 karakter
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Deskripsi Singkat *</Label>
                <Textarea
                  id="shortDescription"
                  placeholder="Tulis deskripsi singkat tentang kursus (100-150 karakter)"
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                  rows={2}
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Deskripsi ini akan tampil di listing kursus
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullDescription">Deskripsi Lengkap</Label>
                <Textarea
                  id="fullDescription"
                  placeholder="Tulis deskripsi lengkap tentang kursus, tujuan pembelajaran, dan target audiens"
                  value={formData.fullDescription}
                  onChange={(e) => handleInputChange('fullDescription', e.target.value)}
                  rows={5}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Level Kursus</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => handleInputChange('level', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Pemula</SelectItem>
                      <SelectItem value="intermediate">Menengah</SelectItem>
                      <SelectItem value="advanced">Mahir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Harga Kursus (Rupiah) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="Contoh: 499000"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Harga dalam Rupiah (IDR)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide delay-100">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Thumbnail Kursus</CardTitle>
              <CardDescription>
                Upload atau ubah gambar yang akan ditampilkan sebagai thumbnail kursus
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {thumbnailPreview ? (
                <div className="space-y-4">
                  <div className="relative w-full max-w-md">
                    <img
                      src={thumbnailPreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailPreview(null);
                        setFormData(prev => ({ ...prev, thumbnail: null }));
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-gray-300 dark:border-gray-600"
                      onClick={() => document.getElementById('thumbnail-upload')?.click()}
                    >
                      Ubah Thumbnail
                    </Button>
                    <Link href="/mentor/courses/content">
                      <Button className="bg-[#008A00] hover:bg-[#006600]">
                        Kelola Konten
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 cursor-pointer hover:border-[#005EB8] transition-colors"
                  onClick={() => document.getElementById('thumbnail-upload')?.click()}
                >
                  <div className="text-center">
                    <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                      Klik untuk upload gambar
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      JPG, PNG hingga 5MB
                    </p>
                  </div>
                </div>
              )}
              <input
                id="thumbnail-upload"
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
              />
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide delay-200">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Fitur Aksesibilitas</CardTitle>
              <CardDescription>
                Pilih fitur aksesibilitas yang akan Anda sediakan dalam kursus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {accessibilityOptions.map((option) => (
                  <div
                    key={option.key}
                    className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#005EB8] transition-colors"
                  >
                    <input
                      type="checkbox"
                      id={option.key}
                      checked={(formData.accessibilityFeatures as any)[option.key]}
                      onChange={(e) => handleAccessibilityChange(option.key, e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-[#005EB8] focus:ring-[#005EB8] mt-1 flex-shrink-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <Label htmlFor={option.key} className="font-medium cursor-pointer">
                        {option.label}
                      </Label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-[#005EB8]/20 animate-fadeSlide delay-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <CheckCircle className="h-6 w-6 text-[#005EB8]" />
                Checklist Sebelum Update
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${formData.title ? 'text-[#008A00]' : 'text-gray-300'}`} />
                  <span className={formData.title ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
                    Judul kursus sudah diisi
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${formData.shortDescription ? 'text-[#008A00]' : 'text-gray-300'}`} />
                  <span className={formData.shortDescription ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
                    Deskripsi singkat sudah diisi
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${formData.category ? 'text-[#008A00]' : 'text-gray-300'}`} />
                  <span className={formData.category ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
                    Kategori sudah dipilih
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${formData.price ? 'text-[#008A00]' : 'text-gray-300'}`} />
                  <span className={formData.price ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
                    Harga sudah diisi
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${thumbnailPreview ? 'text-[#008A00]' : 'text-gray-300'}`} />
                  <span className={thumbnailPreview ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
                    Thumbnail sudah diupload
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex gap-4 pt-4">
            <Link href="/mentor/courses" className="flex-1">
              <Button variant="outline" className="w-full border-gray-300 dark:border-gray-600" type="button">
                Batal
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="flex-1 bg-[#005EB8] hover:bg-[#004A93] disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </div>
    </MentorLayout>
  );
}