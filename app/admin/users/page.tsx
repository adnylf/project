'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Eye,
  Edit,
  UserX,
  UserCheck,
  MoreHorizontal,
  Users,
  UserPlus,
  UserMinus,
  Mail
} from 'lucide-react';
import AdminLayout from '@/components/admin/admin-layout';
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

// Data dummy
const users = [
  {
    id: 1,
    name: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@email.com',
    joinDate: '2024-01-15',
    lastLogin: '2024-10-20',
    coursesEnrolled: 5,
    status: 'active',
    type: 'student',
    phone: '+6281234567890'
  },
  {
    id: 2,
    name: 'Sarah Putri',
    email: 'sarah.putri@email.com',
    joinDate: '2024-02-20',
    lastLogin: '2024-10-19',
    coursesEnrolled: 3,
    status: 'active',
    type: 'student',
    phone: '+6281234567891'
  },
  {
    id: 3,
    name: 'John Smith',
    email: 'john.smith@email.com',
    joinDate: '2024-03-10',
    lastLogin: '2024-10-18',
    coursesEnrolled: 7,
    status: 'suspended',
    type: 'student',
    phone: '+6281234567892'
  },
  {
    id: 4,
    name: 'Maria Chen',
    email: 'maria.chen@email.com',
    joinDate: '2024-04-05',
    lastLogin: '2024-10-17',
    coursesEnrolled: 2,
    status: 'active',
    type: 'student',
    phone: '+6281234567893'
  },
  {
    id: 5,
    name: 'David Lee',
    email: 'david.lee@email.com',
    joinDate: '2024-05-12',
    lastLogin: '2024-10-16',
    coursesEnrolled: 4,
    status: 'inactive',
    type: 'student',
    phone: '+6281234567894'
  },
  {
    id: 6,
    name: 'Lisa Wang',
    email: 'lisa.wang@email.com',
    joinDate: '2024-06-08',
    lastLogin: '2024-10-15',
    coursesEnrolled: 6,
    status: 'active',
    type: 'student',
    phone: '+6281234567895'
  },
  {
    id: 7,
    name: 'Robert Brown',
    email: 'robert.brown@email.com',
    joinDate: '2024-07-22',
    lastLogin: '2024-10-14',
    coursesEnrolled: 1,
    status: 'active',
    type: 'student',
    phone: '+6281234567896'
  },
  {
    id: 8,
    name: 'Emily Davis',
    email: 'emily.davis@email.com',
    joinDate: '2024-08-30',
    lastLogin: '2024-10-13',
    coursesEnrolled: 8,
    status: 'suspended',
    type: 'student',
    phone: '+6281234567897'
  }
];

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-[#008A00]">Aktif</Badge>;
      case 'suspended':
        return <Badge className="bg-[#F4B400]">Ditangguhkan</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500">Tidak Aktif</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'student':
        return <Badge variant="outline" className="border-[#005EB8] text-[#005EB8]">Siswa</Badge>;
      case 'mentor':
        return <Badge variant="outline" className="border-[#008A00] text-[#008A00]">Mentor</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    const matchesType = filterType === 'all' || user.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleActivateUser = (userId: number) => {
    console.log(`Activate user: ${userId}`);
    // API call: PUT /api/admin/users/:id (set status to active)
  };

  const handleSuspendUser = (userId: number) => {
    console.log(`Suspend user: ${userId}`);
    // API call: PUT /api/admin/users/:id (set status to suspended)
  };

  const handleDeleteUser = (userId: number) => {
    console.log(`Delete user: ${userId}`);
    // API call: DELETE /api/admin/users/:id
  };

  const handleSendEmail = (userEmail: string) => {
    console.log(`Send email to: ${userEmail}`);
    // Implement email functionality
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    inactive: users.filter(u => u.status === 'inactive').length
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeIn">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Manage Users
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manajemen akun pengguna (aktif, suspend, hapus)
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#005EB8]/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-[#005EB8]" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#008A00]/10 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-[#008A00]" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aktif</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#F4B400]/10 flex items-center justify-center">
                  <UserMinus className="h-6 w-6 text-[#F4B400]" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.suspended}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ditangguhkan</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-500/10 flex items-center justify-center">
                  <UserX className="h-6 w-6 text-gray-500" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.inactive}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tidak Aktif</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Section */}
        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Cari nama atau email user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="suspended">Ditangguhkan</SelectItem>
                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="student">Siswa</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide delay-100">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Daftar Users
            </CardTitle>
            <CardDescription>
              Kelola status dan informasi semua user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Tanggal Bergabung</TableHead>
                    <TableHead>Login Terakhir</TableHead>
                    <TableHead>Kursus</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="table-row">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.phone}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(user.joinDate).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(user.lastLogin).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{user.coursesEnrolled}</span>
                      </TableCell>
                      <TableCell>{getTypeBadge(user.type)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                              <button className="flex items-center gap-2 w-full text-left cursor-pointer">
                                <Eye className="h-4 w-4" />
                                <span>Lihat Detail</span>
                              </button>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <button className="flex items-center gap-2 w-full text-left cursor-pointer">
                                <Edit className="h-4 w-4" />
                                <span>Edit</span>
                              </button>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleSendEmail(user.email)}
                              className="text-[#005EB8]"
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Kirim Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === 'active' ? (
                              <DropdownMenuItem 
                                onClick={() => handleSuspendUser(user.id)}
                                className="text-[#F4B400]"
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Tangguhkan
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleActivateUser(user.id)}
                                className="text-[#008A00]"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Aktifkan
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-[#D93025]"
                            >
                              <UserX className="h-4 w-4 mr-2" />
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

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Users className="h-10 w-10 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Tidak ada user ditemukan
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
  );
}