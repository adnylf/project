'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  BookOpen,
  BarChart3,
  Loader2,
  Clock,
  Archive,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/admin-layout';
import ProtectedRoute from "@/components/auth/protected-route";
import SweetAlert, { AlertType } from '@/components/ui/sweet-alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const API_BASE_URL = 'http://localhost:3000/api';

type CourseStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

interface Course {
  id: string;
  title: string;
  slug: string;
  status: CourseStatus;
  price: number;
  is_free: boolean;
  average_rating: number;
  total_students: number;
  created_at: string;
  updated_at: string;
  category: {
    id: string;
    name: string;
  } | null;
  mentor: {
    id: string;
    user: {
      id: string;
      full_name: string;
      email: string;
    };
  };
  _count?: {
    enrollments: number;
    reviews: number;
  };
}

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('PENDING_REVIEW');
  const [filterCategory, setFilterCategory] = useState('all');

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
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

  // Reject states
  const [showRejectAlert, setShowRejectAlert] = useState(false);
  const [courseToReject, setCourseToReject] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Delete states
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || localStorage.getItem('accessToken');
    }
    return null;
  }, []);

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        setError('Silakan login terlebih dahulu');
        return;
      }

      const params = new URLSearchParams({
        limit: '100',
      });

      // Add status filter
      if (filterStatus && filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`${API_BASE_URL}/admin/courses?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data kursus');
      }

      const result = await response.json();
      setCourses(result.courses || result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, filterStatus]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

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

  const getStatusBadge = (status: CourseStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge className="bg-[#008A00] text-white border border-[#008A00] pointer-events-none">Published</Badge>;
      case 'PENDING_REVIEW':
        return <Badge className="bg-[#F4B400] text-[#1A1A1A] border border-[#F4B400] pointer-events-none">Menunggu Review</Badge>;
      case 'DRAFT':
        return <Badge className="bg-gray-500 text-white border border-gray-500 pointer-events-none">Draft</Badge>;
      case 'ARCHIVED':
        return <Badge className="bg-gray-700 text-white border border-gray-700 pointer-events-none">Archived</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none">Unknown</Badge>;
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.mentor.user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || course.category?.name === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Approve course
  const handleApproveCourse = async (courseId: string) => {
    try {
      setActionLoading(courseId);
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/admin/courses/${courseId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Gagal menyetujui kursus');
      }

      // Update local state
      setCourses(prev => prev.map(c => 
        c.id === courseId ? { ...c, status: 'PUBLISHED' as CourseStatus } : c
      ));

      // Show success message
      const course = courses.find(c => c.id === courseId);
      setAlertConfig({
        type: "success",
        title: "Berhasil!",
        message: `Kursus "${course?.title}" telah disetujui dan dipublikasikan.`
      });
      setShowAlert(true);
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : 'Terjadi kesalahan'
      });
      setShowAlert(true);
    } finally {
      setActionLoading(null);
    }
  };

  // Open reject dialog
  const openRejectDialog = (courseId: string) => {
    setCourseToReject(courseId);
    setRejectReason('');
    setShowRejectAlert(true);
  };

  // Reject course
  const handleRejectCourse = async () => {
    if (!courseToReject) return;

    try {
      setActionLoading(courseToReject);
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/admin/courses/${courseToReject}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!response.ok) {
        throw new Error('Gagal menolak kursus');
      }

      // Update local state - move back to DRAFT
      setCourses(prev => prev.map(c => 
        c.id === courseToReject ? { ...c, status: 'DRAFT' as CourseStatus } : c
      ));
      
      // Show success message
      const course = courses.find(c => c.id === courseToReject);
      setAlertConfig({
        type: "success",
        title: "Berhasil!",
        message: `Kursus "${course?.title}" telah ditolak dan dikembalikan ke status Draft.`
      });
      setShowAlert(true);

      setShowRejectAlert(false);
      setCourseToReject(null);
      setRejectReason('');
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : 'Terjadi kesalahan'
      });
      setShowAlert(true);
    } finally {
      setActionLoading(null);
    }
  };

  // Open delete dialog
  const openDeleteDialog = (courseId: string) => {
    setCourseToDelete(courseId);
    setShowDeleteAlert(true);
  };

  // Delete course
  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      setActionLoading(courseToDelete);
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/admin/courses/${courseToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Gagal menghapus kursus');
      }

      // Remove from local state
      setCourses(prev => prev.filter(c => c.id !== courseToDelete));
      
      // Show success message
      setAlertConfig({
        type: "success",
        title: "Berhasil!",
        message: "Kursus berhasil dihapus."
      });
      setShowAlert(true);

      setShowDeleteAlert(false);
      setCourseToDelete(null);
    } catch (err) {
      setAlertConfig({
        type: "error",
        title: "Gagal",
        message: err instanceof Error ? err.message : 'Terjadi kesalahan'
      });
      setShowAlert(true);
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate stats
  const stats = {
    total: courses.length,
    published: courses.filter(c => c.status === 'PUBLISHED').length,
    pending: courses.filter(c => c.status === 'PENDING_REVIEW').length,
    draft: courses.filter(c => c.status === 'DRAFT').length,
    archived: courses.filter(c => c.status === 'ARCHIVED').length,
  };

  // Get unique categories
  const categories = Array.from(new Set(courses.map(c => c.category?.name).filter((name): name is string => Boolean(name))));

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Memuat data kursus...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

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

        {/* SweetAlert untuk konfirmasi tolak kursus */}
        <SweetAlert
          type="error"
          title="Tolak Kursus?"
          message="Kursus akan dikembalikan ke status Draft. Berikan alasan penolakan untuk mentor."
          show={showRejectAlert}
          onClose={() => {
            setShowRejectAlert(false);
            setRejectReason('');
          }}
          duration={0} // Tidak auto close untuk konfirmasi
          showCloseButton={true}
        >
          {/* Textarea untuk alasan penolakan */}
          <div className="mt-4">
            <Textarea
              placeholder="Alasan penolakan (opsional)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-[#005EB8] focus:ring-[#005EB8] rounded-lg"
            />
          </div>
          
          {/* Tombol konfirmasi */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setShowRejectAlert(false);
                setRejectReason('');
              }}
              disabled={actionLoading === courseToReject}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleRejectCourse}
              disabled={actionLoading === courseToReject}
              className="flex-1 py-2 px-4 bg-[#D93025] hover:bg-[#c41c1c] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center font-medium"
            >
              {actionLoading === courseToReject ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Memproses...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Tolak
                </>
              )}
            </button>
          </div>
        </SweetAlert>

        {/* SweetAlert untuk konfirmasi hapus kursus */}
        <SweetAlert
          type="error"
          title="Hapus Kursus?"
          message="Tindakan ini tidak dapat dibatalkan. Kursus beserta semua data terkait akan dihapus secara permanen."
          show={showDeleteAlert}
          onClose={() => setShowDeleteAlert(false)}
          duration={0} // Tidak auto close untuk konfirmasi
          showCloseButton={true}
        >
          {/* Tombol konfirmasi */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowDeleteAlert(false)}
              disabled={actionLoading === courseToDelete}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteCourse}
              disabled={actionLoading === courseToDelete}
              className="flex-1 py-2 px-4 bg-[#D93025] hover:bg-[#c41c1c] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center font-medium"
            >
              {actionLoading === courseToDelete ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Menghapus...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Hapus
                </>
              )}
            </button>
          </div>
        </SweetAlert>

        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-[#005EB8]" />
                Manajemen Kursus
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manajemen dan approval kursus dari mentor
              </p>
            </div>
          </div>

          {error && (
            <Card className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20">
              <CardContent className="p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#005EB8]/10">
                    <BookOpen className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kursus</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <Clock className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Review</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <CheckCircle className="h-6 w-6 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Published</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.published}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#D93025]/10">
                    <BarChart3 className="h-6 w-6 text-[#D93025]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Draft</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.draft}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gray-700/10">
                    <Archive className="h-6 w-6 text-gray-700 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Archived</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.archived}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Section */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Cari kursus atau mentor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px] border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="PENDING_REVIEW">Menunggu Review</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[150px] border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]">
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Courses Table */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Daftar Kursus
              </CardTitle>
              <CardDescription>
                Kelola persetujuan dan status semua kursus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200 dark:border-gray-700">
                      <TableHead className="text-gray-900 dark:text-white font-semibold">Kursus</TableHead>
                      <TableHead className="text-gray-900 dark:text-white font-semibold">Mentor</TableHead>
                      <TableHead className="text-gray-900 dark:text-white font-semibold">Kategori</TableHead>
                      <TableHead className="text-gray-900 dark:text-white font-semibold">Siswa</TableHead>
                      <TableHead className="text-gray-900 dark:text-white font-semibold">Harga</TableHead>
                      <TableHead className="text-gray-900 dark:text-white font-semibold">Rating</TableHead>
                      <TableHead className="text-gray-900 dark:text-white font-semibold">Status</TableHead>
                      <TableHead className="text-gray-900 dark:text-white font-semibold">Terakhir Diupdate</TableHead>
                      <TableHead className="text-right text-gray-900 dark:text-white font-semibold">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.map((course) => (
                      <TableRow key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {course.title}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {course.mentor.user.full_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {course.mentor.user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20 pointer-events-none text-xs">
                            {course.category?.name || 'Tanpa Kategori'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 dark:text-white">
                          {formatNumber(course._count?.enrollments || course.total_students || 0)}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900 dark:text-white">
                          {course.is_free ? (
                            <Badge className="bg-[#008A00] text-white border border-[#008A00] pointer-events-none">Gratis</Badge>
                          ) : (
                            formatCurrency(course.price)
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-[#F4B400]" fill="currentColor" stroke="none" />
                            <span className="font-medium text-gray-900 dark:text-white">{course.average_rating?.toFixed(1) || '0.0'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(course.status)}</TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(course.updated_at).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={actionLoading === course.id}
                                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                {actionLoading === course.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                              <DropdownMenuItem asChild>
                                <Link href={`/courses/${course.slug || course.id}`} className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                  <Eye className="h-4 w-4" />
                                  <span>Lihat Detail</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {course.status === 'PENDING_REVIEW' && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => handleApproveCourse(course.id)}
                                    className="text-[#008A00] dark:text-[#4CAF50] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Setujui
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => openRejectDialog(course.id)}
                                    className="text-[#D93025] dark:text-[#F44336] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Tolak
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(course.id)}
                                className="text-[#D93025] dark:text-[#F44336] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredCourses.length === 0 && (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Tidak ada kursus ditemukan
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Coba ubah filter atau kata kunci pencarian
                      </p>
                    </div>
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