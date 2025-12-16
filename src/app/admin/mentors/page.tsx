'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Eye,
  UserCheck,
  UserX,
  MoreHorizontal,
  Users,
  Star,
  BookOpen,
  Clock,
  Loader2,
  X,
  TrendingUp,
  Award,
  Sparkles,
} from 'lucide-react';
import AdminLayout from '@/components/admin/admin-layout';
import ProtectedRoute from "@/components/auth/protected-route";
import MentorDetailModal from '@/components/modal/modal-mentor-detail';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Client-side getCookie function
function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
}

interface MentorProfile {
  id: string;
  expertise: string[];
  experience: number;
  education: string | null;
  bio: string | null;
  headline: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  portfolio: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason: string | null;
  total_students: number;
  total_courses: number;
  average_rating: number;
  total_revenue: number;
  created_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    phone?: string | null;
  };
  _count?: {
    courses: number;
  };
}

export default function AdminMentors() {
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  // Modal states
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [mentorToReject, setMentorToReject] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getToken = useCallback(() => {
    let token = localStorage.getItem('accessToken');
    if (!token) {
      token = getCookieValue('accessToken');
    }
    return token;
  }, []);

  // Fetch mentors
  const fetchMentors = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setError('Silakan login terlebih dahulu');
        setIsLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: '1',
        limit: '50',
      });

      if (filterStatus && filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/admin/mentors?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Sesi telah berakhir. Silakan login kembali.');
        } else if (response.status === 403) {
          setError('Anda tidak memiliki akses ke halaman ini.');
        } else {
          throw new Error('Gagal mengambil data mentor');
        }
        setIsLoading(false);
        return;
      }

      const result = await response.json();
      
      if (result.mentors) {
        setMentors(result.mentors);
        
        // Calculate stats
        const approved = result.mentors.filter((m: MentorProfile) => m.status === 'APPROVED').length;
        const pending = result.mentors.filter((m: MentorProfile) => m.status === 'PENDING').length;
        const rejected = result.mentors.filter((m: MentorProfile) => m.status === 'REJECTED').length;
        
        setStats({
          total: result.pagination?.total || result.mentors.length,
          approved,
          pending,
          rejected,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, [getToken, filterStatus, searchTerm]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'jt';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-[#008A00] text-white border border-[#008A00] pointer-events-none">Terverifikasi</Badge>;
      case 'PENDING':
        return <Badge className="bg-[#F4B400] text-[#1A1A1A] border border-[#F4B400] pointer-events-none">Menunggu</Badge>;
      case 'REJECTED':
        return <Badge className="bg-[#D93025] text-white border border-[#D93025] pointer-events-none">Ditolak</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none">Unknown</Badge>;
    }
  };

  const handleViewDetail = (mentor: MentorProfile) => {
    setSelectedMentor(mentor);
    setIsDetailModalOpen(true);
  };

  const handleApproveMentor = async (mentorId: string) => {
    try {
      setIsSubmitting(true);
      const token = getToken();
      
      if (!token) {
        setError('Silakan login terlebih dahulu');
        return;
      }

      const response = await fetch(`/api/admin/mentors/${mentorId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Gagal menyetujui mentor');
      }

      setIsDetailModalOpen(false);
      fetchMentors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRejectDialog = (mentorId: string) => {
    setMentorToReject(mentorId);
    setRejectReason('');
    setRejectDialogOpen(true);
    setIsDetailModalOpen(false);
  };

  const handleRejectMentor = async () => {
    if (!mentorToReject || rejectReason.trim().length < 10) {
      setError('Alasan penolakan harus minimal 10 karakter');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = getToken();
      
      if (!token) {
        setError('Silakan login terlebih dahulu');
        return;
      }

      const response = await fetch(`/api/admin/mentors/${mentorToReject}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Gagal menolak mentor');
      }

      setRejectDialogOpen(false);
      setMentorToReject(null);
      setRejectReason('');
      fetchMentors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter mentors locally
  const filteredMentors = mentors.filter((mentor) => {
    const matchesSearch = 
      mentor.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.expertise?.join(', ').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminLayout>
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Users className="h-8 w-8 text-[#005EB8]" />
                Kelola Mentor
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Verifikasi dan manajemen akun mentor
              </p>
            </div>
          </div>

          {error && (
            <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900">
              <CardContent className="p-4 flex justify-between items-center">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#005EB8]/10">
                    <Users className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Mentor</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <UserCheck className="h-6 w-6 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Terverifikasi</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.approved}</p>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Menunggu</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#D93025]/10">
                    <UserX className="h-6 w-6 text-[#D93025]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ditolak</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rejected}</p>
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
                    placeholder="Cari nama, email, atau keahlian mentor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px] border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="APPROVED">Terverifikasi</SelectItem>
                    <SelectItem value="PENDING">Menunggu</SelectItem>
                    <SelectItem value="REJECTED">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Mentors Table */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Daftar Mentor</CardTitle>
              <CardDescription>Verifikasi dan kelova mentor yang mendaftar</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#005EB8]" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Memuat data...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-900 dark:text-white">Mentor</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Email</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Keahlian</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Pengalaman</TableHead>
                        <TableHead className="text-gray-900 dark:text-white text-center">Kursus</TableHead>
                        <TableHead className="text-gray-900 dark:text-white text-center">Siswa</TableHead>
                        <TableHead className="text-gray-900 dark:text-white text-center">Rating</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Status</TableHead>
                        <TableHead className="text-gray-900 dark:text-white text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMentors.map((mentor) => (
                        <TableRow key={mentor.id} className="border-gray-200 dark:border-gray-700">
                          <TableCell>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {mentor.user?.full_name || '-'}
                            </p>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                            {mentor.user?.email || '-'}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {mentor.expertise?.join(', ') || '-'}
                            </p>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                            {mentor.experience} tahun
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <BookOpen className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900 dark:text-white">
                                {mentor._count?.courses || mentor.total_courses || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatNumber(mentor.total_students || 0)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 justify-center">
                              <Star className="h-4 w-4 text-[#F4B400] fill-[#F4B400]" />
                              <span className="font-medium text-gray-900 dark:text-white">
                                {mentor.average_rating > 0 ? mentor.average_rating.toFixed(1) : '-'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(mentor.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem 
                                  onClick={() => handleViewDetail(mentor)}
                                  className="text-gray-700 dark:text-gray-300"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Lihat Detail
                                </DropdownMenuItem>
                                {mentor.status === 'PENDING' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleApproveMentor(mentor.id)}
                                      className="text-[#008A00]"
                                    >
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Setujui
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => openRejectDialog(mentor.id)}
                                      className="text-[#D93025]"
                                    >
                                      <UserX className="h-4 w-4 mr-2" />
                                      Tolak
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {!isLoading && filteredMentors.length === 0 && (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
                      <CardContent className="p-6">
                        <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                          <Users className="h-10 w-10 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Tidak ada mentor ditemukan
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            Coba ubah filter atau kata kunci pencarian
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mentor Detail Modal */}
          <MentorDetailModal
            mentor={selectedMentor}
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            onApprove={handleApproveMentor}
            onReject={openRejectDialog}
            isSubmitting={isSubmitting}
          />

          {/* Reject Dialog */}
          <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
            <DialogContent className="border rounded-lg bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">Tolak Aplikasi Mentor</DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Berikan alasan penolakan yang jelas untuk membantu mentor memperbaiki aplikasinya.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea
                  placeholder="Alasan penolakan (minimal 10 karakter)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8]"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {rejectReason.length}/10 karakter minimum
                </p>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setRejectDialogOpen(false)}
                  disabled={isSubmitting}
                  className="border-gray-300 dark:border-gray-600"
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleRejectMentor}
                  disabled={isSubmitting || rejectReason.trim().length < 10}
                  className="bg-[#D93025] hover:bg-[#C02920] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Tolak'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}