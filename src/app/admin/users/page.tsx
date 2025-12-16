'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Eye,
  UserX,
  UserCheck,
  MoreHorizontal,
  Users,
  UserMinus,
  Loader2,
  X,
  Trash2,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Shield,
} from 'lucide-react';
import AdminLayout from '@/components/admin/admin-layout';
import ProtectedRoute from "@/components/auth/protected-route";
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

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'MENTOR' | 'STUDENT';
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  disability_type: string | null;
  avatar_url: string | null;
  email_verified: boolean;
  last_login: string | null;
  created_at: string;
  _count?: {
    enrollments: number;
    certificates: number;
  };
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('STUDENT');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    inactive: 0,
  });

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getToken = useCallback(() => {
    let token = localStorage.getItem('accessToken');
    if (!token) {
      token = getCookieValue('accessToken');
    }
    return token;
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
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

      if (filterRole !== 'all') {
        params.append('role', filterRole);
      }

      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/admin/users?${params}`, {
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
          throw new Error('Gagal mengambil data pengguna');
        }
        setIsLoading(false);
        return;
      }

      const result = await response.json();
      
      if (result.users) {
        setUsers(result.users);
        
        // Calculate stats
        const active = result.users.filter((u: User) => u.status === 'ACTIVE').length;
        const suspended = result.users.filter((u: User) => u.status === 'SUSPENDED').length;
        const inactive = result.users.filter((u: User) => u.status === 'INACTIVE').length;
        
        setStats({
          total: result.pagination?.total || result.users.length,
          active,
          suspended,
          inactive,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, [getToken, filterStatus, filterRole, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-[#008A00] text-white border border-[#008A00] pointer-events-none">Aktif</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-[#F4B400] text-[#1A1A1A] border border-[#F4B400] pointer-events-none">Ditangguhkan</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-gray-500 text-white border border-gray-500 pointer-events-none">Tidak Aktif</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none">Unknown</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-[#005EB8] text-white border border-[#005EB8] pointer-events-none">Admin</Badge>;
      case 'MENTOR':
        return <Badge className="bg-[#008A00] text-white border border-[#008A00] pointer-events-none">Mentor</Badge>;
      case 'STUDENT':
        return <Badge className="bg-[#F4B400] text-[#1A1A1A] border border-[#F4B400] pointer-events-none">Siswa</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none">Unknown</Badge>;
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      setIsSubmitting(true);
      const token = getToken();
      
      if (!token) {
        setError('Silakan login terlebih dahulu');
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}/activate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Gagal mengaktifkan pengguna');
      }

      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      setIsSubmitting(true);
      const token = getToken();
      
      if (!token) {
        setError('Silakan login terlebih dahulu');
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Gagal menangguhkan pengguna');
      }

      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (userId: string) => {
    setUserToDelete(userId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setIsSubmitting(true);
      const token = getToken();
      
      if (!token) {
        setError('Silakan login terlebih dahulu');
        return;
      }

      const response = await fetch(`/api/admin/users/${userToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Gagal menghapus pengguna');
      }

      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter users locally
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminLayout>
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Users className="h-8 w-8 text-[#005EB8]" />
                Kelola Pengguna
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manajemen akun pengguna (aktifkan, tangguhkan, hapus)
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-[#D93025]" />
                <p className="text-[#D93025] dark:text-[#D93025]">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-[#D93025] dark:text-[#D93025] hover:text-[#B71C1C] dark:hover:text-[#B71C1C]">
                <X className="h-5 w-5" />
              </button>
            </div>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Pengguna</p>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Aktif</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <UserMinus className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ditangguhkan</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.suspended}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gray-500/10">
                    <UserX className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tidak Aktif</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inactive}</p>
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
                    placeholder="Cari nama atau email pengguna..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:focus:border-[#005EB8] dark:focus:ring-[#005EB8]"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[150px] border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:focus:border-[#005EB8] dark:focus:ring-[#005EB8]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="ACTIVE">Aktif</SelectItem>
                      <SelectItem value="SUSPENDED">Ditangguhkan</SelectItem>
                      <SelectItem value="INACTIVE">Tidak Aktif</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-[150px] border-gray-300 dark:border-gray-600 focus:border-[#005EB8] focus:ring-[#005EB8] dark:focus:border-[#005EB8] dark:focus:ring-[#005EB8]">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Role</SelectItem>
                      <SelectItem value="STUDENT">Siswa</SelectItem>
                      <SelectItem value="MENTOR">Mentor</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Daftar Pengguna</CardTitle>
              <CardDescription>Kelola status dan informasi semua pengguna</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mb-4" />
                  <span className="text-gray-600 dark:text-gray-400">Memuat data pengguna...</span>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800">
                        <TableHead className="font-semibold text-gray-900 dark:text-white">Nama</TableHead>
                        <TableHead className="font-semibold text-gray-900 dark:text-white">Email</TableHead>
                        <TableHead className="font-semibold text-gray-900 dark:text-white">Role</TableHead>
                        <TableHead className="font-semibold text-gray-900 dark:text-white">Bergabung</TableHead>
                        <TableHead className="font-semibold text-gray-900 dark:text-white">Login Terakhir</TableHead>
                        <TableHead className="font-semibold text-gray-900 dark:text-white text-center">Kursus</TableHead>
                        <TableHead className="font-semibold text-gray-900 dark:text-white text-center">Sertifikat</TableHead>
                        <TableHead className="font-semibold text-gray-900 dark:text-white">Status</TableHead>
                        <TableHead className="font-semibold text-gray-900 dark:text-white text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {user.full_name || '-'}
                              </p>
                              {user.disability_type && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {user.disability_type}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="text-gray-900 dark:text-white">{user.email}</p>
                              {user.email_verified && (
                                <span className="inline-flex items-center gap-1 text-xs text-[#008A00] dark:text-[#008A00] mt-1">
                                  <Shield className="h-3 w-3" />
                                  Terverifikasi
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(user.created_at)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(user.last_login)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {user._count?.enrollments || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {user._count?.certificates || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                <DropdownMenuItem className="text-[#005EB8] hover:text-[#004A93] dark:text-[#005EB8] dark:hover:text-[#004A93]">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Lihat Detail
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {user.status === 'ACTIVE' ? (
                                  <DropdownMenuItem 
                                    onClick={() => handleSuspendUser(user.id)}
                                    className="text-[#F4B400] hover:text-[#E6A800] dark:text-[#F4B400] dark:hover:text-[#E6A800]"
                                    disabled={isSubmitting}
                                  >
                                    <UserMinus className="h-4 w-4 mr-2" />
                                    Tangguhkan
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => handleActivateUser(user.id)}
                                    className="text-[#008A00] hover:text-[#007800] dark:text-[#008A00] dark:hover:text-[#007800]"
                                    disabled={isSubmitting}
                                  >
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Aktifkan
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => openDeleteDialog(user.id)}
                                  className="text-[#D93025] hover:text-[#C02920] dark:text-[#D93025] dark:hover:text-[#C02920]"
                                  disabled={isSubmitting}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
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
              )}

              {!isLoading && filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Users className="h-10 w-10 text-gray-400 dark:text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Tidak ada pengguna ditemukan
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Coba ubah filter atau kata kunci pencarian
                      </p>
                      <Button 
                        onClick={() => {
                          setSearchTerm('');
                          setFilterStatus('all');
                          setFilterRole('all');
                        }}
                        variant="outline"
                        className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8] dark:hover:bg-[#005EB8]/20"
                      >
                        Reset Filter
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="border rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">Hapus Pengguna</DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait pengguna.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={isSubmitting}
                  className="border-gray-300 dark:border-gray-600"
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleDeleteUser}
                  disabled={isSubmitting}
                  className="bg-[#D93025] hover:bg-[#C02920] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    'Hapus Pengguna'
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