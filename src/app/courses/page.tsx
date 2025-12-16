'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, BookOpen, Clock, Users, Star, Filter, X, Loader2 } from 'lucide-react';
import Link from 'next/link';

const API_BASE_URL = 'http://localhost:3000/api';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Mentor {
  id: string;
  headline: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  thumbnail?: string;
  price: number;
  discount_price?: number | null;
  is_free: boolean;
  level: string;
  total_students: number;
  total_duration: number;
  total_lectures: number;
  average_rating: number;
  total_reviews: number;
  category: Category;
  mentor: Mentor;
  created_at: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}j ${mins}m` : `${hours} jam`;
};

const getLevelLabel = (level: string) => {
  const labels: Record<string, string> = {
    BEGINNER: 'Pemula',
    INTERMEDIATE: 'Menengah',
    ADVANCED: 'Mahir',
    ALL_LEVELS: 'Semua Level',
  };
  return labels[level] || level;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/courses/categories`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('limit', '50');
      params.append('sort', sortBy);
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedLevel !== 'all') params.append('level', selectedLevel);
      if (selectedType === 'free') params.append('is_free', 'true');
      if (selectedType === 'paid') params.append('is_free', 'false');

      const response = await fetch(`${API_BASE_URL}/courses?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Gagal mengambil data kursus');
      }

      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, selectedLevel, selectedType, sortBy]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedLevel('all');
    setSelectedType('all');
    setSortBy('newest');
  };

  // Check if any filter is active
  const hasActiveFilters = selectedCategory !== 'all' || selectedLevel !== 'all' || selectedType !== 'all' || searchTerm !== '';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Memuat kursus...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#005EB8]/10 via-[#008A00]/10 to-[#F4B400]/10 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fadeIn">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Jelajahi Kursus
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Temukan kursus yang sesuai dengan minat dan kebutuhan Anda
            </p>
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Cari kursus, topik, atau instruktur..."
                className="pl-12 h-12 bg-white dark:bg-gray-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchCourses} className="mt-2">
              Coba Lagi
            </Button>
          </div>
        )}

        {/* Filter Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter Kursus:
              </span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-4 w-4" />
                Reset Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Kategori
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tingkat
              </label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Tingkat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tingkat</SelectItem>
                  <SelectItem value="BEGINNER">Pemula</SelectItem>
                  <SelectItem value="INTERMEDIATE">Menengah</SelectItem>
                  <SelectItem value="ADVANCED">Mahir</SelectItem>
                  <SelectItem value="ALL_LEVELS">Semua Level</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipe
              </label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="free">Gratis</SelectItem>
                  <SelectItem value="paid">Berbayar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Urutkan
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Terbaru</SelectItem>
                  <SelectItem value="popular">Terpopuler</SelectItem>
                  <SelectItem value="rating">Rating Tertinggi</SelectItem>
                  <SelectItem value="price_low">Harga Terendah</SelectItem>
                  <SelectItem value="price_high">Harga Tertinggi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Menampilkan <span className="font-semibold text-gray-900 dark:text-white">{courses.length}</span> kursus
          </p>
          
          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2">
            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}
                <button onClick={() => setSelectedCategory('all')} className="ml-1 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedLevel !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {getLevelLabel(selectedLevel)}
                <button onClick={() => setSelectedLevel('all')} className="ml-1 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedType !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {selectedType === 'free' ? 'Gratis' : 'Berbayar'}
                <button onClick={() => setSelectedType('all')} className="ml-1 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>

        {/* Courses Grid */}
        {courses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <Card
                key={course.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-700"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="p-0">
                  <div className="aspect-video w-full overflow-hidden relative bg-gray-100 dark:bg-gray-800">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-16 w-16 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge className={(course.is_free || course.price === 0) ? 'bg-[#008A00]' : 'bg-[#005EB8]'}>
                        {(course.is_free || course.price === 0) ? 'Gratis' : 'Berbayar'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{course.category?.name || 'Kategori'}</Badge>
                    <Badge variant="outline">{getLevelLabel(course.level)}</Badge>
                  </div>
                  <CardTitle className="text-xl line-clamp-2">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.short_description || course.description}
                  </CardDescription>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {course.mentor?.user?.full_name || 'Instruktur'}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDuration(course.total_duration)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course.total_students}
                    </div>
                    {course.average_rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {course.average_rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0 flex items-center justify-between">
                  <div className="text-2xl font-bold text-[#005EB8]">
                    {(course.is_free || course.price === 0) ? 'Gratis' : formatCurrency(course.discount_price || course.price)}
                  </div>
                  <Link href={`/courses/${course.slug || course.id}`}>
                    <Button className="bg-[#005EB8] hover:bg-[#004A93]">
                      Lihat Detail
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Tidak ada kursus
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {hasActiveFilters 
                  ? 'Tidak ada kursus yang sesuai dengan filter yang dipilih.'
                  : 'Belum ada kursus yang tersedia saat ini.'}
              </p>
              {hasActiveFilters && (
                <Button onClick={resetFilters} variant="outline">
                  Reset Filter
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}