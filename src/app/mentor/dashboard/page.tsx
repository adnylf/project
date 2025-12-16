"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Star,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus,
  Eye,
  MessageSquare,
  Loader2,
  Calendar,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Award,
  BarChart3,
  CreditCard,
  Play,
  Heart,
  Activity,
  Zap,
  GraduationCap,
  User,
} from "lucide-react";
import Link from "next/link";
import MentorLayout from "@/components/mentor/mentor-layout";
import ProtectedRoute from "@/components/auth/protected-route";

const API_BASE_URL = "http://localhost:3000/api";

interface Statistics {
  total_courses: number;
  published_courses: number;
  total_students: number;
  total_reviews: number;
  average_rating: number;
  total_revenue: number;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  status: string;
  total_students: number;
  average_rating: number;
}

interface Student {
  id: string;
  progress: number;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  course: {
    title: string;
  };
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string | null;
  };
  course: {
    title: string;
  };
}

interface MentorProfile {
  status: string;
  user: {
    full_name: string;
  };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
};

const RatingStars = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-3 w-3 ${star <= rating ? "text-[#F4B400] fill-[#F4B400]" : "text-gray-300"}`}
      />
    ))}
  </div>
);

export default function MentorDashboardPage() {
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        setError("Silakan login terlebih dahulu");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all data in parallel
      const [profileRes, statsRes, coursesRes, studentsRes, reviewsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/mentors/profile`, { headers }),
        fetch(`${API_BASE_URL}/mentors/statistics`, { headers }),
        fetch(`${API_BASE_URL}/mentors/courses?limit=4`, { headers }),
        fetch(`${API_BASE_URL}/mentors/students?limit=5`, { headers }),
        fetch(`${API_BASE_URL}/mentors/reviews?limit=3`, { headers }),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setCourses(data.courses || []);
      }

      if (studentsRes.ok) {
        const data = await studentsRes.json();
        setRecentStudents(data.students || []);
      }

      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setRecentReviews(data.reviews || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Selamat Pagi" : currentHour < 18 ? "Selamat Siang" : "Selamat Malam";

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["MENTOR"]}>
        <MentorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-[#005EB8]" />
          </div>
        </MentorLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["MENTOR"]}>
      <MentorLayout>
        <div className="space-y-8">
          {/* Welcome Banner */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{greeting},</p>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {profile?.user?.full_name || "Mentor"} 👋
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {profile?.status === "APPROVED"
                      ? "Selamat datang di dashboard mentor Anda"
                      : profile?.status === "PENDING"
                      ? "Status pendaftaran Anda sedang ditinjau"
                      : "Lengkapi profil Anda untuk mulai mengajar"}
                  </p>
                </div>
                {profile?.status === "APPROVED" && (
                  <Link href="/mentor/courses/create">
                    <Button className="bg-[#005EB8] text-white hover:bg-[#004A93]">
                      <Plus className="h-4 w-4 mr-2" />
                      Buat Kursus Baru
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending/Rejected Notice */}
          {profile?.status === "PENDING" && (
            <Card className="rounded-lg border bg-[#F4B400]/10 dark:bg-[#F4B400]/20 border-[#F4B400]/20 dark:border-[#F4B400]/30">
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-[#F4B400]" />
                <div>
                  <p className="font-medium text-[#F4B400] dark:text-[#F4B400]">Menunggu Persetujuan</p>
                  <p className="text-sm text-[#F4B400]/80 dark:text-[#F4B400]">Status pendaftaran mentor Anda sedang ditinjau oleh admin.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards - Layout baru: icon di atas, angka di tengah, label di bawah */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Total Kursus */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5 text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-xl bg-[#005EB8]/10">
                    <BookOpen className="h-6 w-6 text-[#005EB8]" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats?.total_courses || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Kursus</p>
              </CardContent>
            </Card>
            
            {/* Dipublikasi */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5 text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <CheckCircle className="h-6 w-6 text-[#008A00]" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats?.published_courses || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Dipublikasi</p>
              </CardContent>
            </Card>
            
            {/* Siswa */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5 text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-xl bg-[#D93025]/10">
                    <Users className="h-6 w-6 text-[#D93025]" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats?.total_students || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Siswa</p>
              </CardContent>
            </Card>
            
            {/* Rating */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5 text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <Star className="h-6 w-6 text-[#F4B400]" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats?.average_rating?.toFixed(1) || "0.0"}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Rating</p>
              </CardContent>
            </Card>
            
            {/* Ulasan - Menggunakan warna #005EB8 */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5 text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-xl bg-[#005EB8]/10">
                    <MessageSquare className="h-6 w-6 text-[#005EB8]" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats?.total_reviews || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ulasan</p>
              </CardContent>
            </Card>
            
            {/* Pendapatan */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5 text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <DollarSign className="h-6 w-6 text-[#008A00]" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats?.total_revenue ? formatCurrency(stats.total_revenue) : "Rp 0"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pendapatan</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Courses */}
            <div className="lg:col-span-2">
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                      <BookOpen className="h-5 w-5 text-[#005EB8]" />
                      Kursus Saya
                    </CardTitle>
                    <CardDescription>Kursus yang Anda buat</CardDescription>
                  </div>
                  <Link href="/mentor/courses">
                    <Button variant="outline" size="sm" className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]">
                      Lihat Semua <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {courses.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 mb-4">Belum ada kursus</p>
                      <Link href="/mentor/courses/create">
                        <Button className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          Buat Kursus Pertama
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {courses.slice(0, 4).map((course) => (
                        <div key={course.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors border border-gray-200 dark:border-gray-700">
                          <div className="w-16 h-12 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                          {course.thumbnail ? (
                              <img 
                                src={course.thumbnail} 
                                alt={course.title} 
                                className="object-cover w-full h-full" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">{course.title}</h4>
                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {course.total_students}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-[#F4B400]" />
                                {course.average_rating?.toFixed(1) || "0.0"}
                              </span>
                            </div>
                          </div>
                          <Badge className={
                            course.status === "PUBLISHED" 
                              ? "bg-[#008A00] text-white border border-[#008A00] pointer-events-none" 
                              : course.status === "DRAFT" 
                                ? "bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                                : "bg-[#F4B400] text-[#1A1A1A] border border-[#F4B400] pointer-events-none"
                          }>
                            {course.status === "PUBLISHED" ? "Publik" : course.status === "DRAFT" ? "Draft" : "Pending"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Students */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                    <Users className="h-5 w-5 text-[#D93025]" />
                    Siswa Terbaru
                  </CardTitle>
                  <CardDescription className="text-sm">Siswa yang baru mendaftar</CardDescription>
                </div>
                <Link href="/mentor/students-enrolled">
                  {/* Button Ikon Panah Kanan - Style diubah seperti button Lihat Semua di dashboard */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentStudents.length === 0 ? (
                  <div className="text-center py-6">
                    <Users className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada siswa</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentStudents.map((student) => (
                      <div key={student.id} className="flex items-center gap-3">
                        {student.user.avatar_url ? (
                          <img 
                            src={student.user.avatar_url} 
                            alt="" 
                            className="w-9 h-9 rounded-full object-cover" 
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#005EB8] flex items-center justify-center text-white text-sm font-medium">
                            {student.user.full_name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{student.user.full_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{student.course.title}</p>
                        </div>
                        <span className="text-xs text-gray-400">{formatDate(student.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Reviews */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                  <MessageSquare className="h-5 w-5 text-[#005EB8]" />
                  Ulasan Terbaru
                </CardTitle>
                <CardDescription>Feedback dari siswa Anda</CardDescription>
              </div>
              <Link href="/mentor/reviews">
                <Button variant="outline" size="sm" className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]">
                  Lihat Semua <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentReviews.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Belum ada ulasan</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  {recentReviews.map((review) => (
                    <Card key={review.id} className="rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                        {review.user.avatar_url ? (
                            <img 
                              src={review.user.avatar_url} 
                              alt="" 
                              className="w-10 h-10 rounded-full object-cover" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#005EB8] flex items-center justify-center text-white font-medium">
                              {review.user.full_name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{review.user.full_name}</p>
                            <RatingStars rating={review.rating} />
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{review.comment}</p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{review.course.title}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Aksi Cepat - Menggunakan style seperti user dashboard */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                <Zap className="h-5 w-5 text-[#005EB8]" />
                Aksi Cepat
              </CardTitle>
              <CardDescription>Kelola kursus dan aktivitas mentor Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <Link href="/mentor/courses/create" className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-xl bg-[#005EB8]/10 mb-3">
                        <Plus className="h-6 w-6 text-[#005EB8]" />
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">Buat Kursus</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Buat kursus baru</p>
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <Link href="/mentor/students-enrolled" className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-xl bg-[#D93025]/10 mb-3">
                        <Users className="h-6 w-6 text-[#D93025]" />
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">Lihat Siswa</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Kelola siswa Anda</p>
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <Link href="/mentor/revenue" className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-xl bg-[#008A00]/10 mb-3">
                        <DollarSign className="h-6 w-6 text-[#008A00]" />
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">Cek Pendapatan</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Riwayat pendapatan</p>
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <Link href="/mentor/profile" className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-xl bg-[#F4B400]/10 mb-3">
                        <TrendingUp className="h-6 w-6 text-[#F4B400]" />
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">Edit Profil</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Kelola akun mentor</p>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </MentorLayout>
    </ProtectedRoute>
  );
}