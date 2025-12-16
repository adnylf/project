'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  CheckCircle2, 
  PlayCircle, 
  ArrowLeft,
  Globe,
  Calendar,
  Heart,
  Share2,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

const API_BASE_URL = 'http://localhost:3000/api';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface MentorUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio?: string;
}

interface Mentor {
  id: string;
  headline: string;
  bio?: string;
  expertise: string[];
  average_rating: number;
  total_students: number;
  total_courses: number;
  user: MentorUser;
}

interface Material {
  id: string;
  title: string;
  description?: string;
  type: string;
  duration: number;
  order: number;
  is_free: boolean;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  order: number;
  duration: number;
  materials: Material[];
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
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
  language: string;
  total_students: number;
  total_duration: number;
  total_lectures: number;
  average_rating: number;
  total_reviews: number;
  requirements: string[];
  what_you_will_learn: string[];
  target_audience: string[];
  created_at: string;
  updated_at: string;
  category: Category;
  mentor: Mentor;
  sections: Section[];
  reviews: Review[];
  _count?: {
    sections: number;
    enrollments: number;
    reviews: number;
  };
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  // Wishlist state
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  
  // Share dialog state
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || localStorage.getItem('accessToken');
    }
    return null;
  }, []);

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = getAuthToken();
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, { headers });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Kursus tidak ditemukan');
          }
          throw new Error('Gagal mengambil data kursus');
        }

        const data = await response.json();
        setCourse(data.course || data);
        setIsEnrolled(data.isEnrolled || false);
        
        // Expand first section by default
        if (data.course?.sections?.[0]) {
          setExpandedSections(new Set([data.course.sections[0].id]));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId, getAuthToken]);

  // Handle enroll
  const handleEnroll = async () => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login?redirect=/courses/' + courseId);
      return;
    }

    try {
      setEnrolling(true);
      const response = await fetch(`${API_BASE_URL}/courses/${course?.id}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          // Redirect to payment
          router.push(`/checkout/${course?.id}`);
          return;
        }
        throw new Error(result.error || 'Gagal mendaftar kursus');
      }

      setIsEnrolled(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal mendaftar');
    } finally {
      setEnrolling(false);
    }
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(Array.from(prev));
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Check if in wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      const token = getAuthToken();
      if (!token || !course?.id) return;

      try {
        const response = await fetch(`${API_BASE_URL}/wishlist/${course.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setInWishlist(data.inWishlist);
        }
      } catch {
        // Ignore errors
      }
    };

    checkWishlist();
  }, [course?.id, getAuthToken]);

  // Toggle wishlist
  const handleWishlistToggle = async () => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login?redirect=/courses/' + courseId);
      return;
    }

    try {
      setWishlistLoading(true);

      if (inWishlist) {
        // Remove from wishlist
        const response = await fetch(`${API_BASE_URL}/wishlist?course_id=${course?.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setInWishlist(false);
        }
      } else {
        // Add to wishlist
        const response = await fetch(`${API_BASE_URL}/wishlist`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ course_id: course?.id }),
        });
        if (response.ok) {
          setInWishlist(true);
        }
      }
    } catch (err) {
      console.error('Wishlist error:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  // Copy share URL
  const handleCopyLink = async () => {
    const url = `${window.location.origin}/courses/${course?.slug || course?.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Share to social media
  const getShareUrl = () => `${window.location.origin}/courses/${course?.slug || course?.id}`;

  const shareToTwitter = () => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(`Lihat kursus "${course?.title}" di platform kami!`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareToWhatsApp = () => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(`Lihat kursus "${course?.title}" di platform kami! ${getShareUrl()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareToTelegram = () => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(`Lihat kursus "${course?.title}" di platform kami!`);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Memuat kursus...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {error || 'Kursus tidak ditemukan'}
          </h2>
          <Link href="/courses">
            <Button className="bg-[#005EB8] hover:bg-[#004A93]">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Katalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalMaterials = course.sections?.reduce((acc, s) => acc + s.materials.length, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/courses" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span>Kembali ke Katalog</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {course.category?.name || 'Kategori'}
                </Badge>
                <Badge variant="outline">
                  {getLevelLabel(course.level)}
                </Badge>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDuration(course.total_duration)}
                </Badge>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-gray-900 dark:text-white">
                {course.title}
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                {course.short_description || course.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm">
                {course.average_rating > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">{course.average_rating.toFixed(1)}</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      ({course.total_reviews} ulasan)
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Users className="h-5 w-5" />
                  {course.total_students.toLocaleString()} siswa
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="h-5 w-5" />
                  Update: {formatDate(course.updated_at)}
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Globe className="h-5 w-5" />
                  {course.language === 'id' ? 'Bahasa Indonesia' : course.language}
                </div>
              </div>

              {/* Instructor Card */}
              {course.mentor && (
                <Card className="border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-2 border-gray-200 dark:border-gray-600">
                        <AvatarImage src={course.mentor.user?.avatar_url || ''} />
                        <AvatarFallback>{course.mentor.user?.full_name?.[0] || 'M'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Instruktur</p>
                        <p className="font-semibold text-gray-900 dark:text-white text-lg">
                          {course.mentor.user?.full_name || 'Instruktur'}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                          {course.mentor.headline || course.mentor.bio}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>⭐ {course.mentor.average_rating?.toFixed(1) || '0'}/5.0</span>
                          <span>👨‍🏫 {course.mentor.total_courses || 0} Kursus</span>
                          <span>🎓 {(course.mentor.total_students || 0).toLocaleString()} Siswa</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Enrollment Card */}
            <div>
              <Card className="border-gray-200 dark:border-gray-700 sticky top-24">
                <CardHeader className="p-0">
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-800">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-16 w-16 text-gray-300" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {course.is_free ? 'Gratis' : formatCurrency(course.discount_price || course.price)}
                    </div>
                    {!course.is_free && course.discount_price && course.discount_price < course.price && (
                      <div className="text-lg text-gray-600 dark:text-gray-400 line-through">
                        {formatCurrency(course.price)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {isEnrolled ? (
                      <Link href={`/user/courses/${course.id}/player`}>
                        <Button className="w-full bg-[#005EB8] hover:bg-[#004A93]" size="lg">
                          <PlayCircle className="mr-2 h-5 w-5" />
                          Lanjutkan Belajar
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        className="w-full bg-[#005EB8] hover:bg-[#004A93]" 
                        size="lg"
                        onClick={handleEnroll}
                        disabled={enrolling}
                      >
                        {enrolling ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Mendaftar...
                          </>
                        ) : (
                          <>
                            <PlayCircle className="mr-2 h-5 w-5" />
                            {course.is_free ? 'Daftar Sekarang' : 'Beli Sekarang'}
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Simpan & Bagikan buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className={`flex-1 ${inWishlist ? 'border-red-500 text-red-500 hover:bg-red-50' : ''}`}
                      onClick={handleWishlistToggle}
                      disabled={wishlistLoading}
                    >
                      {wishlistLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Heart className={`h-4 w-4 mr-2 ${inWishlist ? 'fill-red-500' : ''}`} />
                      )}
                      {inWishlist ? 'Tersimpan' : 'Simpan'}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowShareDialog(true)}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Bagikan
                    </Button>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                    <p className="font-semibold text-gray-900 dark:text-white text-lg">
                      Kursus ini mencakup:
                    </p>
                    <div className="grid gap-3 text-sm">
                      <div className="flex items-center gap-3">
                        <PlayCircle className="h-5 w-5 text-[#005EB8]" />
                        <span>{formatDuration(course.total_duration)} video on-demand</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-[#005EB8]" />
                        <span>{totalMaterials} materi pembelajaran</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-[#005EB8]" />
                        <span>Akses seumur hidup</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-[#005EB8]" />
                        <span>Sertifikat kelulusan</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="curriculum" className="space-y-8">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-lg">
            <TabsTrigger value="curriculum">Kurikulum</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reviews">Ulasan</TabsTrigger>
          </TabsList>

          {/* Curriculum Tab */}
          <TabsContent value="curriculum" className="space-y-6">
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">Konten Kursus</CardTitle>
                    <CardDescription>
                      {course.sections?.length || 0} section • {totalMaterials} materi • {formatDuration(course.total_duration)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.sections && course.sections.length > 0 ? (
                  course.sections.map((section) => (
                    <Card key={section.id} className="border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#005EB8] rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {section.order}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {section.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {section.materials.length} materi • {formatDuration(section.duration)}
                            </p>
                          </div>
                        </div>
                        {expandedSections.has(section.id) ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      
                      {expandedSections.has(section.id) && (
                        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
                          {section.materials.map((material) => (
                            <div
                              key={material.id}
                              className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                            >
                              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <PlayCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {material.title}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {material.type} • {formatDuration(material.duration)}
                                </p>
                              </div>
                              {material.is_free && (
                                <Badge className="bg-[#008A00]">Gratis</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Belum ada konten kursus
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Deskripsi</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {course.description}
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-6">
                {course.what_you_will_learn && course.what_you_will_learn.length > 0 && (
                  <Card className="border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold">Yang akan Anda pelajari</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        {course.what_you_will_learn.map((item, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-[#008A00] mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {course.requirements && course.requirements.length > 0 && (
                  <Card className="border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold">Persyaratan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {course.requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                            <div className="w-2 h-2 bg-[#005EB8] rounded-full mt-2 flex-shrink-0"></div>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Ulasan Siswa</CardTitle>
                <CardDescription>
                  {course.total_reviews} ulasan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {course.average_rating > 0 && (
                  <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <div className="text-5xl font-bold text-gray-900 dark:text-white">
                            {course.average_rating.toFixed(1)}
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-6 w-6 ${
                                  i < Math.floor(course.average_rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'fill-gray-300 text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {course.total_reviews} ulasan
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {course.reviews && course.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {course.reviews.map((review) => (
                      <Card key={review.id} className="border-gray-200 dark:border-gray-700">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar>
                              <AvatarImage src={review.user?.avatar_url || ''} />
                              <AvatarFallback>{review.user?.full_name?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    {review.user?.full_name || 'Pengguna'}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {formatDate(review.created_at)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'fill-gray-300 text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              {review.comment && (
                                <p className="text-gray-700 dark:text-gray-300">
                                  {review.comment}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Belum ada ulasan
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowShareDialog(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Bagikan Kursus</h3>
              <button onClick={() => setShowShareDialog(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Bagikan kursus ini ke teman-teman Anda</p>
            <div className="flex gap-2 mb-6">
              <input type="text" readOnly value={typeof window !== 'undefined' ? `${window.location.origin}/courses/${course.slug || course.id}` : ''} className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm" />
              <Button onClick={handleCopyLink} variant="outline">{copied ? '✓ Tersalin!' : 'Salin'}</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={shareToWhatsApp} className="hover:bg-green-50 hover:border-green-500 hover:text-green-600">📱 WhatsApp</Button>
              <Button variant="outline" onClick={shareToTelegram} className="hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600">✈️ Telegram</Button>
              <Button variant="outline" onClick={shareToTwitter} className="hover:bg-sky-50 hover:border-sky-500 hover:text-sky-600">🐦 Twitter/X</Button>
              <Button variant="outline" onClick={shareToFacebook} className="hover:bg-blue-50 hover:border-blue-600 hover:text-blue-700">📘 Facebook</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
