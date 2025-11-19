'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import NeuButton from '@/components/ui/new-button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, BookOpen, Clock, Users, Star, Filter, X } from 'lucide-react';
import Link from 'next/link';

const courses = [
  {
    id: 1,
    title: 'Dasar-Dasar Pemrograman Web',
    instructor: 'Dr. Ahmad Fauzi',
    description: 'Pelajari HTML, CSS, dan JavaScript dari dasar hingga mahir.',
    level: 'Pemula',
    duration: '12 minggu',
    students: 1250,
    rating: 4.8,
    price: 'Gratis',
    year: 2024,
    type: 'gratis',
    thumbnail: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Teknologi',
  },
  {
    id: 2,
    title: 'Desain Grafis untuk Pemula',
    instructor: 'Sarah Putri',
    description: 'Kuasai prinsip-prinsip desain grafis dan tools profesional.',
    level: 'Pemula',
    duration: '10 minggu',
    students: 890,
    rating: 4.7,
    price: 'Rp 299.000',
    year: 2024,
    type: 'berbayar',
    thumbnail: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Desain',
  },
  {
    id: 3,
    title: 'Bahasa Inggris Percakapan',
    instructor: 'John Smith',
    description: 'Tingkatkan kemampuan berbahasa Inggris untuk komunikasi sehari-hari.',
    level: 'Menengah',
    duration: '15 minggu',
    students: 2100,
    rating: 4.9,
    price: 'Rp 199.000',
    year: 2023,
    type: 'berbayar',
    thumbnail: 'https://images.pexels.com/photos/256417/pexels-photo-256417.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Bahasa',
  },
  {
    id: 4,
    title: 'Digital Marketing Essentials',
    instructor: 'Maya Kusuma',
    description: 'Pelajari strategi pemasaran digital yang efektif untuk bisnis.',
    level: 'Pemula',
    duration: '8 minggu',
    students: 1500,
    rating: 4.6,
    price: 'Rp 349.000',
    year: 2024,
    type: 'berbayar',
    thumbnail: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Bisnis',
  },
  {
    id: 5,
    title: 'Fotografi untuk Semua',
    instructor: 'Budi Santoso',
    description: 'Pelajari teknik fotografi dari pemula hingga profesional.',
    level: 'Pemula',
    duration: '6 minggu',
    students: 670,
    rating: 4.8,
    price: 'Gratis',
    year: 2023,
    type: 'gratis',
    thumbnail: 'https://images.pexels.com/photos/606541/pexels-photo-606541.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Seni',
  },
  {
    id: 6,
    title: 'Akuntansi Dasar',
    instructor: 'Linda Wijaya',
    description: 'Memahami prinsip-prinsip akuntansi untuk pemula.',
    level: 'Pemula',
    duration: '10 minggu',
    students: 1100,
    rating: 4.5,
    price: 'Rp 249.000',
    year: 2022,
    type: 'berbayar',
    thumbnail: 'https://images.pexels.com/photos/6693655/pexels-photo-6693655.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Bisnis',
  },
];

// Helper function untuk format angka yang konsisten
const formatNumber = (num: number) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true setelah component mount di client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset semua filter
  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedLevel('all');
    setSelectedYear('all');
    setSelectedType('all');
    setSearchTerm('');
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    const matchesYear = selectedYear === 'all' || course.year.toString() === selectedYear;
    const matchesType = selectedType === 'all' || course.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesLevel && matchesYear && matchesType;
  });

  // Get unique years from courses
  const years = Array.from(new Set(courses.map(course => course.year))).sort((a, b) => b - a);

  // Jangan render apa-apa sampai client-side mounting selesai
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-br from-primary/10 via-success/10 to-accent/10 py-12">
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
        {/* Filter Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8 animate-fadeSlide">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter Kursus:
              </span>
            </div>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-4 w-4" />
              Reset Filter
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <SelectItem value="Teknologi">Teknologi</SelectItem>
                  <SelectItem value="Desain">Desain</SelectItem>
                  <SelectItem value="Bahasa">Bahasa</SelectItem>
                  <SelectItem value="Bisnis">Bisnis</SelectItem>
                  <SelectItem value="Seni">Seni</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tingkat Kesulitan
              </label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Tingkat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tingkat</SelectItem>
                  <SelectItem value="Pemula">Pemula</SelectItem>
                  <SelectItem value="Menengah">Menengah</SelectItem>
                  <SelectItem value="Lanjutan">Lanjutan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tahun
              </label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tahun</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
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
                  <SelectItem value="gratis">Gratis</SelectItem>
                  <SelectItem value="berbayar">Berbayar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Menampilkan <span className="font-semibold text-gray-900 dark:text-white">{filteredCourses.length}</span> kursus
          </p>
          
          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2">
            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {selectedCategory}
                <button onClick={() => setSelectedCategory('all')} className="ml-1 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedLevel !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {selectedLevel}
                <button onClick={() => setSelectedLevel('all')} className="ml-1 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedYear !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {selectedYear}
                <button onClick={() => setSelectedYear('all')} className="ml-1 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedType !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {selectedType === 'gratis' ? 'Gratis' : 'Berbayar'}
                <button onClick={() => setSelectedType('all')} className="ml-1 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => (
              <Card
                key={course.id}
                className="action-card animate-scaleIn hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="p-0">
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg relative">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge variant={course.type === 'gratis' ? 'default' : 'secondary'}>
                        {course.type === 'gratis' ? 'Gratis' : 'Berbayar'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{course.category}</Badge>
                    <Badge variant="outline">{course.level}</Badge>
                    <Badge variant="outline" className="text-xs">{course.year}</Badge>
                  </div>
                  <CardTitle className="text-xl line-clamp-2">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description}
                  </CardDescription>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {course.instructor}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {formatNumber(course.students)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      {course.rating}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0 flex items-center justify-between">
                  <div className="text-2xl font-bold text-primary">
                    {course.price}
                  </div>
                  <Link href={`/courses/${course.id}`}>
                    <NeuButton>
                      Lihat Detail
                    </NeuButton>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                Tidak ada kursus yang sesuai dengan filter yang dipilih.
              </p>
              <NeuButton onClick={resetFilters}>
                Reset Filter
              </NeuButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}