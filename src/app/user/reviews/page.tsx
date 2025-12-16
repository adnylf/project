"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Star,
  Loader2,
  Edit,
  Trash2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  Eye,
  EyeOff,
  AlertCircle,
  Search,
  Award,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import UserLayout from "@/components/user/user-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import SweetAlert, { AlertType } from "@/components/ui/sweet-alert";

const API_BASE_URL = "http://localhost:3000/api";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  is_anonymous: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail: string | null;
    mentor: { user: { full_name: string } };
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

const StarRating = ({ rating, size = 4 }: { rating: number; size?: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star key={star} className={`h-${size} w-${size} ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
    ))}
  </div>
);

export default function UserReviews() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  // SweetAlert states
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    type: AlertType;
    title: string;
    message: string;
  }>({
    type: "success",
    title: "",
    message: "",
  });
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  const fetchReviews = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) { setError("Silakan login terlebih dahulu"); return; }
      
      const response = await fetch(`${API_BASE_URL}/users/reviews?page=${page}&limit=10`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Gagal mengambil data reviews");
      
      const data = await response.json();
      setReviews(data.reviews || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
    finally { setLoading(false); }
  }, [getAuthToken]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // Open delete confirmation
  const openDeleteConfirmation = (review: Review) => {
    setReviewToDelete(review);
    setShowConfirmAlert(true);
  };

  // Handle delete review
  const handleDelete = async () => {
    if (!reviewToDelete) return;
    
    try {
      setDeleting(reviewToDelete.id);
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/users/reviews/${reviewToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Gagal menghapus review");
      
      setReviews((prev) => prev.filter((r) => r.id !== reviewToDelete.id));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
      
      // Show success message
      setAlertConfig({
        type: "success",
        title: "Berhasil!",
        message: `Review untuk kursus "${reviewToDelete.course.title}" berhasil dihapus.`
      });
      setShowAlert(true);
      
      setShowConfirmAlert(false);
      setReviewToDelete(null);
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : "Gagal menghapus review"
      });
      setShowAlert(true);
    } finally {
      setDeleting(null);
    }
  };

  const filteredReviews = reviews.filter((review) =>
    review.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const stats = {
    total: pagination.total,
    avgRating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0",
    totalHelpful: reviews.reduce((sum, r) => sum + r.helpful_count, 0),
  };

  if (loading) return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-[#005EB8]" />
        </div>
      </UserLayout>
    </ProtectedRoute>
  );

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        {/* SweetAlert Component untuk notifikasi biasa */}
        <SweetAlert
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          show={showAlert}
          onClose={() => setShowAlert(false)}
          duration={3000}
          showCloseButton={true}
        />

        {/* SweetAlert untuk konfirmasi hapus review */}
        <SweetAlert
          type="error"
          title="Hapus Review?"
          message={`Apakah Anda yakin ingin menghapus review untuk kursus "${reviewToDelete?.course.title}"?`}
          show={showConfirmAlert}
          onClose={() => {
            setShowConfirmAlert(false);
            setReviewToDelete(null);
          }}
          duration={0} // Tidak auto close untuk konfirmasi
          showCloseButton={true}
        >
          {/* Tombol konfirmasi */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setShowConfirmAlert(false);
                setReviewToDelete(null);
              }}
              disabled={deleting === reviewToDelete?.id}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting === reviewToDelete?.id}
              className="flex-1 py-2 px-4 bg-[#D93025] hover:bg-[#c41c1c] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center font-medium"
            >
              {deleting === reviewToDelete?.id ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus
                </>
              )}
            </button>
          </div>
        </SweetAlert>

        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-[#005EB8]" />
                Review Saya
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Kelola semua review yang Anda berikan</p>
            </div>
          </div>

          {error && (
            <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="p-2 bg-[#005EB8]/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Review</p>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="p-2 bg-[#F4B400]/10 rounded-lg">
                    <Star className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.avgRating}</p>
                    <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Rating</p>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="p-2 bg-[#008A00]/10 rounded-lg">
                    <ThumbsUp className="h-6 w-6 text-[#008A00]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalHelpful}</p>
                    <TrendingUp className="h-5 w-5 text-[#008A00]" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Helpful</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input 
                  type="search" 
                  placeholder="Cari review berdasarkan kursus atau komentar..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Reviews List */}
          {filteredReviews.length > 0 ? (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <Card 
                  key={review.id} 
                  className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Course Thumbnail */}
                      <Link href={`/courses/${review.course.slug}`} className="relative w-full md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0 block">
                        {review.course.thumbnail ? (
                          <img
                            src={review.course.thumbnail}
                            alt={review.course.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <MessageSquare className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </Link>

                      {/* Review Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <Link href={`/courses/${review.course.slug}`} className="font-semibold text-lg text-gray-900 dark:text-white hover:text-[#005EB8] line-clamp-2">
                              {review.course.title}
                            </Link>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              oleh {review.course.mentor.user.full_name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {review.is_anonymous && (
                              <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 text-xs">
                                <EyeOff className="h-3 w-3 mr-1" />Anonim
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`h-5 w-5 ${star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-600"}`} />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">• {formatDate(review.created_at)}</span>
                        </div>

                        {review.comment && (
                          <div className="text-gray-600 dark:text-gray-300 text-sm mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg line-clamp-3">
                            {review.comment}
                          </div>
                        )}

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <div className="p-1 bg-[#008A00]/10 rounded">
                              <ThumbsUp className="h-4 w-4 text-[#008A00]" />
                            </div>
                            <span className="font-medium">{review.helpful_count} orang terbantu</span>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => router.push(`/user/reviews/${review.id}/edit`)}
                              className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10"
                            >
                              <Edit className="h-4 w-4 mr-1" />Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-[#D93025] border-[#D93025] hover:bg-[#D93025]/10 hover:text-[#D93025]" 
                              onClick={() => openDeleteConfirmation(review)} 
                              disabled={deleting === review.id}
                            >
                              {deleting === review.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <MessageSquare className="h-10 w-10 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {searchTerm ? "Review tidak ditemukan" : "Belum ada review"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {searchTerm ? "Coba ubah kata kunci pencarian Anda" : "Berikan review pada kursus yang sudah Anda ikuti"}
                    </p>
                    <Button 
                      asChild 
                      className="bg-[#005EB8] hover:bg-[#004A93]"
                    >
                      <Link href="/user/enrollments">Lihat Kursus Saya</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => fetchReviews(pagination.page - 1)} 
                disabled={pagination.page <= 1}
                className="border-gray-300 dark:border-gray-600"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />Sebelumnya
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Halaman {pagination.page} dari {pagination.totalPages}
              </span>
              <Button 
                variant="outline" 
                onClick={() => fetchReviews(pagination.page + 1)} 
                disabled={pagination.page >= pagination.totalPages}
                className="border-gray-300 dark:border-gray-600"
              >
                Selanjutnya<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}