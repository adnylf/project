"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
  BookOpen,
  Edit3,
  Calendar,
  AlertCircle,
  Reply,
} from "lucide-react";
import Link from "next/link";
import AdminLayout from "@/components/admin/admin-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import SweetAlert, { AlertType } from "@/components/ui/sweet-alert";

const API_BASE_URL = "http://localhost:3000/api";

interface Comment {
  id: string;
  user_id: string;
  material_id: string;
  parent_id: string | null;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  material: {
    id: string;
    title: string;
    section: {
      id: string;
      title: string;
      course: {
        id: string;
        title: string;
        slug: string;
      };
    };
  };
  parent: {
    id: string;
    content: string;
  } | null;
  _count: {
    replies: number;
  };
}

interface Stats {
  total: number;
  today: number;
  edited: number;
  replies: number;
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
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, edited: 0, replies: 0 });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchComments = useCallback(async () => {
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

      if (debouncedSearch) params.append("search", debouncedSearch);

      const response = await fetch(`${API_BASE_URL}/admin/comments?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Gagal memuat data komentar");

      const data = await response.json();
      setComments(data.comments || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
      setStats(data.stats || { total: 0, today: 0, edited: 0, replies: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, pagination.page, pagination.limit, debouncedSearch]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleDeleteClick = (comment: Comment) => {
    setCommentToDelete(comment);
    setShowConfirmAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (!commentToDelete) return;

    try {
      setDeleting(true);
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/admin/comments?id=${commentToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Gagal menghapus komentar");

      setComments((prev) => prev.filter((c) => c.id !== commentToDelete.id));
      setShowConfirmAlert(false);
      setCommentToDelete(null);
      
      // Show success message
      setAlertConfig({
        type: "success",
        title: "Berhasil",
        message: "Komentar berhasil dihapus."
      });
      setShowAlert(true);

      // Refresh comments
      fetchComments();
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : "Gagal menghapus komentar"
      });
      setShowAlert(true);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminLayout>
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

        {/* SweetAlert untuk konfirmasi hapus komentar */}
        <SweetAlert
          type="error"
          title="Hapus Komentar?"
          message={
            commentToDelete 
              ? `Apakah Anda yakin ingin menghapus komentar dari "${commentToDelete.user.full_name}"? Semua balasan dari komentar ini juga akan terhapus. Tindakan ini tidak dapat dibatalkan.`
              : ""
          }
          show={showConfirmAlert}
          onClose={() => setShowConfirmAlert(false)}
          duration={0} // Tidak auto close untuk konfirmasi
          showCloseButton={true}
        >
          {commentToDelete && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#005EB8] flex items-center justify-center text-white font-semibold text-sm">
                  {commentToDelete.user.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{commentToDelete.user.full_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(commentToDelete.created_at)}</p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 border-l-2 border-[#D93025] pl-3 italic">
                "{truncateText(commentToDelete.content, 150)}"
              </p>
            </div>
          )}
          
          {/* Tambahan tombol konfirmasi khusus untuk alert konfirmasi */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowConfirmAlert(false)}
              disabled={deleting}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="flex-1 py-2 px-4 bg-[#D93025] hover:bg-[#c41c1c] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center font-medium"
            >
              {deleting ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus Komentar
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
                Manajemen Komentar
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Kelola semua komentar pengguna pada materi kursus
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Komentar</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <Clock className="h-6 w-6 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Hari Ini</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.today}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <Edit3 className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Diedit</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.edited}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#D93025]/10">
                    <Reply className="h-6 w-6 text-[#D93025]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Balasan</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.replies}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Cari berdasarkan isi komentar, nama user, atau judul kursus..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments List */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Daftar Komentar
                </CardTitle>
                <Badge className="bg-[#005EB8] text-white border border-[#005EB8] pointer-events-none">
                  {pagination.total} komentar
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading && comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Memuat komentar...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {searchTerm ? "Komentar tidak ditemukan" : "Belum ada komentar"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {searchTerm ? "Coba ubah kata kunci pencarian Anda" : "Belum ada komentar yang dibuat oleh pengguna"}
                  </p>
                  {searchTerm && (
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchTerm("")}
                      className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10"
                    >
                      Reset Pencarian
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <Card 
                      key={comment.id}
                      className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {comment.user.avatar_url ? (
                              <img
                                src={comment.user.avatar_url}
                                alt={comment.user.full_name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-[#005EB8] flex items-center justify-center text-white font-bold text-lg">
                                {comment.user.full_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {comment.user.full_name}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">{comment.user.email}</span>
                              <div className="flex items-center gap-2">
                                {comment.is_edited && (
                                  <Badge className="bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/20 pointer-events-none">
                                    <Edit3 className="h-3 w-3 mr-1" />Diedit
                                  </Badge>
                                )}
                                {comment.parent && (
                                  <Badge className="bg-[#D93025]/10 text-[#D93025] border border-[#D93025]/20 pointer-events-none">
                                    <Reply className="h-3 w-3 mr-1" />Balasan
                                  </Badge>
                                )}
                                {comment._count.replies > 0 && (
                                  <Badge className="bg-[#005EB8] text-white border border-[#005EB8] pointer-events-none">
                                    {comment._count.replies} balasan
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Comment Content */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
                              <p className="text-gray-900 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                                {comment.content}
                              </p>
                            </div>

                            {/* Parent Comment Reference */}
                            {comment.parent && (
                              <div className="border-l-2 border-[#D93025] pl-4 mb-4">
                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                  <Reply className="h-3 w-3 inline mr-1" />
                                  Membalas komentar:
                                </p>
                                <Card className="rounded border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                  <CardContent className="p-3">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                      {truncateText(comment.parent.content, 120)}
                                    </p>
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {/* Material Info */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-4 w-4 text-[#005EB8]" />
                                <Link
                                  href={`/courses/${comment.material.section.course.slug}`}
                                  className="hover:text-[#005EB8] hover:underline font-medium"
                                >
                                  {comment.material.section.course.title}
                                </Link>
                              </span>
                              <span className="text-gray-300 dark:text-gray-600">→</span>
                              <span>{comment.material.section.title}</span>
                              <span className="text-gray-300 dark:text-gray-600">→</span>
                              <span className="font-medium text-gray-900 dark:text-white">{comment.material.title}</span>
                            </div>

                            {/* Timestamp */}
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <Calendar className="h-4 w-4" />
                              <span>Dibuat: {formatDateTime(comment.created_at)}</span>
                              {comment.is_edited && (
                                <>
                                  <span className="text-gray-300 dark:text-gray-600">•</span>
                                  <span>Diedit: {formatDateTime(comment.updated_at)}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#D93025] text-[#D93025] hover:bg-[#D93025]/10"
                              onClick={() => handleDeleteClick(comment)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Hapus</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Menampilkan <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> -{" "}
                    <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> dari{" "}
                    <span className="font-medium">{pagination.total}</span> komentar
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1 || loading}
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                      className="border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Sebelumnya
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (pagination.totalPages > 5) {
                          if (pagination.page > 3) pageNum = pagination.page - 2 + i;
                          if (pagination.page > pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.page === pageNum ? "default" : "outline"}
                            size="sm"
                            className={pagination.page === pageNum ? "bg-[#005EB8] hover:bg-[#004A93] text-white" : "border-gray-300 dark:border-gray-600"}
                            onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.totalPages || loading}
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                      className="border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Selanjutnya
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}