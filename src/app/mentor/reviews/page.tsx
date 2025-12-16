"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  TrendingUp,
  ThumbsUp,
  Calendar,
  BookOpen,
  Filter,
  StarOff,
  User,
  Award,
  BarChart3,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import MentorLayout from "@/components/mentor/mentor-layout";
import ProtectedRoute from "@/components/auth/protected-route";

const API_BASE_URL = "http://localhost:3000/api";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  is_anonymous: boolean;
  helpful_count: number;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string | null;
  };
  course: {
    id: string;
    title: string;
  };
}

interface Course {
  id: string;
  title: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const RatingStars = ({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) => {
  const sizeClass = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-6 w-6" : "h-4 w-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${star <= rating ? "text-[#F4B400] fill-[#F4B400]" : "text-gray-300 dark:text-gray-700"}`}
        />
      ))}
    </div>
  );
};

export default function MentorReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  // Fetch courses for filter
  const fetchCourses = useCallback(async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/mentors/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  }, [getAuthToken]);

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        setError("Silakan login terlebih dahulu");
        return;
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`${API_BASE_URL}/mentors/reviews?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Gagal memuat data ulasan");

      const data = await response.json();
      setReviews(data.reviews || []);
      setPagination((prev) => ({ ...prev, ...data.pagination }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Filter reviews locally
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      (review.comment?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      review.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.course.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCourse = courseFilter === "all" || review.course.id === courseFilter;
    const matchesRating = ratingFilter === "all" || review.rating === parseInt(ratingFilter);

    return matchesSearch && matchesCourse && matchesRating;
  });

  // Calculate stats
  const totalReviews = pagination.total;
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
  const totalHelpful = reviews.reduce((sum, r) => sum + r.helpful_count, 0);

  if (loading && reviews.length === 0) {
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Star className="h-8 w-8 text-[#005EB8]" />
                Ulasan Kursus
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Lihat ulasan dan feedback dari siswa Anda
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#005EB8]/10">
                    <MessageSquare className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Ulasan</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalReviews}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <Star className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rating Rata-rata</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgRating.toFixed(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <Award className="h-6 w-6 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rating 5 Bintang</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{fiveStarCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#D93025]/10">
                    <ThumbsUp className="h-6 w-6 text-[#D93025]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Helpful</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalHelpful}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Filters */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Cari ulasan berdasarkan nama siswa, komentar, atau judul kursus..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={courseFilter} onValueChange={setCourseFilter}>
                      <SelectTrigger className="w-[180px] border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]">
                        <BookOpen className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Kursus" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Kursus</SelectItem>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={ratingFilter} onValueChange={setRatingFilter}>
                      <SelectTrigger className="w-[150px] border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]">
                        <Star className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Rating</SelectItem>
                        {[5, 4, 3, 2, 1].map((r) => (
                          <SelectItem key={r} value={r.toString()}>
                            {r} Bintang
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error */}
            {error && (
              <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900">
                <CardContent className="p-4">
                  <p className="text-[#D93025] dark:text-[#D93025]">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white text-xl font-bold">Daftar Ulasan</CardTitle>
                  <CardDescription>Ulasan dari siswa untuk kursus Anda</CardDescription>
                </div>
                <Badge className="bg-[#005EB8] text-white border border-[#005EB8] pointer-events-none">
                  {filteredReviews.length} ulasan
                </Badge>
              </CardHeader>
              <CardContent>
                {filteredReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                      <StarOff className="h-10 w-10 text-gray-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Belum Ada Ulasan</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {searchTerm || courseFilter !== "all" || ratingFilter !== "all"
                        ? "Tidak ada ulasan yang cocok dengan filter"
                        : "Ulasan akan muncul setelah siswa memberikan review"}
                    </p>
                    {(searchTerm || courseFilter !== "all" || ratingFilter !== "all") && (
                      <Button 
                        variant="outline"
                        className="border-gray-300 dark:border-gray-600"
                        onClick={() => {
                          setSearchTerm("");
                          setCourseFilter("all");
                          setRatingFilter("all");
                        }}
                      >
                        Reset Filter
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReviews.map((review) => (
                      <Card key={review.id} className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row gap-4">
                            {/* Avatar */}
                            <div className="flex flex-col items-center gap-2 md:w-16 flex-shrink-0">
                              {review.is_anonymous ? (
                                <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <User className="h-7 w-7 text-gray-500 dark:text-gray-400" />
                                </div>
                              ) : review.user.avatar_url ? (
                                <div className="relative w-14 h-14 rounded-full overflow-hidden">
                                  <Image
                                    src={review.user.avatar_url.startsWith("/") ? `/api${review.user.avatar_url}` : review.user.avatar_url}
                                    alt={review.user.full_name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-14 h-14 rounded-full bg-[#005EB8] flex items-center justify-center text-white font-semibold text-lg">
                                  {review.user.full_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="text-center">
                                <RatingStars rating={review.rating} size="sm" />
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {review.is_anonymous ? "Anonim" : review.user.full_name}
                                  </h4>
                                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mt-1">
                                    <BookOpen className="h-4 w-4" />
                                    <span className="truncate">{review.course.title}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-start md:items-end gap-1">
                                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(review.created_at)}
                                  </div>
                                  {review.is_anonymous && (
                                    <Badge className="bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/20 pointer-events-none text-xs">
                                      Anonim
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {review.comment && (
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-3">
                                  <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <ThumbsUp className="h-4 w-4" />
                                    <span>{review.helpful_count} orang terbantu</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Halaman {pagination.page} dari {pagination.totalPages} • Total {totalReviews} ulasan
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page === 1 || loading}
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                        className="border-gray-300 dark:border-gray-600"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page === pagination.totalPages || loading}
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                        className="border-gray-300 dark:border-gray-600"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </MentorLayout>
    </ProtectedRoute>
  );
}