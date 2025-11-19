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
  UserCheck,
  UserX,
  MoreHorizontal,
  Users,
  UserPlus,
  Star,
  BookOpen,
  Clock
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
const mentors = [
  {
    id: 1,
    name: 'Ahmad Hidayat',
    email: 'ahmad.hidayat@email.com',
    joinDate: '2024-01-10',
    specialization: 'Web Development, JavaScript, React',
    totalCourses: 3,
    totalStudents: 2760,
    averageRating: 4.8,
    status: 'verified',
    verificationStatus: 'verified',
    earnings: 36500000
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    joinDate: '2024-02-15',
    specialization: 'UI/UX Design, Figma, Adobe XD',
    totalCourses: 2,
    totalStudents: 890,
    averageRating: 4.7,
    status: 'verified',
    verificationStatus: 'verified',
    earnings: 12000000
  },
  {
    id: 3,
    name: 'David Lee',
    email: 'david.lee@email.com',
    joinDate: '2024-03-20',
    specialization: 'Python, Data Science, Machine Learning',
    totalCourses: 1,
    totalStudents: 450,
    averageRating: 4.9,
    status: 'pending',
    verificationStatus: 'pending',
    earnings: 0
  },
  {
    id: 4,
    name: 'Maria Garcia',
    email: 'maria.garcia@email.com',
    joinDate: '2024-04-05',
    specialization: 'Mobile Development, Flutter, Dart',
    totalCourses: 0,
    totalStudents: 0,
    averageRating: 0,
    status: 'pending',
    verificationStatus: 'pending',
    earnings: 0
  },
  {
    id: 5,
    name: 'John Smith',
    email: 'john.smith@email.com',
    joinDate: '2024-05-12',
    specialization: 'Cloud Computing, AWS, DevOps',
    totalCourses: 2,
    totalStudents: 320,
    averageRating: 4.6,
    status: 'rejected',
    verificationStatus: 'rejected',
    earnings: 6800000
  },
  {
    id: 6,
    name: 'Lisa Wang',
    email: 'lisa.wang@email.com',
    joinDate: '2024-06-08',
    specialization: 'Digital Marketing, SEO, Social Media',
    totalCourses: 1,
    totalStudents: 180,
    averageRating: 4.5,
    status: 'verified',
    verificationStatus: 'verified',
    earnings: 4500000
  },
  {
    id: 7,
    name: 'Robert Brown',
    email: 'robert.brown@email.com',
    joinDate: '2024-07-22',
    specialization: 'Cybersecurity, Network Security',
    totalCourses: 0,
    totalStudents: 0,
    averageRating: 0,
    status: 'pending',
    verificationStatus: 'pending',
    earnings: 0
  },
  {
    id: 8,
    name: 'Emily Davis',
    email: 'emily.davis@email.com',
    joinDate: '2024-08-30',
    specialization: 'Graphic Design, Adobe Creative Suite',
    totalCourses: 1,
    totalStudents: 210,
    averageRating: 4.7,
    status: 'verified',
    verificationStatus: 'verified',
    earnings: 5200000
  }
];

export default function AdminMentors() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-[#008A00]">Terverifikasi</Badge>;
      case 'pending':
        return <Badge className="bg-[#F4B400]">Menunggu</Badge>;
      case 'rejected':
        return <Badge className="bg-[#D93025]">Ditolak</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const filteredMentors = mentors.filter((mentor) => {
    const matchesSearch = 
      mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || mentor.verificationStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleVerifyMentor = (mentorId: number) => {
    console.log(`Verify mentor: ${mentorId}`);
    // API call: PUT /api/admin/mentors/:id/verify
  };

  const handleRejectMentor = (mentorId: number) => {
    console.log(`Reject mentor: ${mentorId}`);
    // API call: PUT /api/admin/mentors/:id/reject
  };

  const handleDeleteMentor = (mentorId: number) => {
    console.log(`Delete mentor: ${mentorId}`);
    // API call: DELETE /api/admin/mentors/:id
  };

  const stats = {
    total: mentors.length,
    verified: mentors.filter(m => m.verificationStatus === 'verified').length,
    pending: mentors.filter(m => m.verificationStatus === 'pending').length,
    rejected: mentors.filter(m => m.verificationStatus === 'rejected').length
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeIn">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Manage Mentors
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Verifikasi dan manajemen akun mentor
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Mentors</p>
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
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.verified}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Terverifikasi</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#F4B400]/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-[#F4B400]" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Menunggu</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#D93025]/10 flex items-center justify-center">
                  <UserX className="h-6 w-6 text-[#D93025]" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.rejected}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ditolak</p>
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
                  placeholder="Cari nama, email, atau keahlian mentor..."
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
                    <SelectItem value="verified">Terverifikasi</SelectItem>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mentors Table */}
        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide delay-100">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Daftar Mentors
            </CardTitle>
            <CardDescription>
              Verifikasi dan kelola mentor yang mendaftar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Keahlian</TableHead>
                    <TableHead>Tanggal Bergabung</TableHead>
                    <TableHead>Kursus</TableHead>
                    <TableHead>Siswa</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Pendapatan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMentors.map((mentor) => (
                    <TableRow key={mentor.id} className="table-row">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {mentor.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {mentor.email}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {mentor.specialization}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(mentor.joinDate).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{mentor.totalCourses}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {isClient ? formatNumber(mentor.totalStudents) : mentor.totalStudents.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-center">
                          <Star className="h-4 w-4 text-[#F4B400]" />
                          <span className="font-medium">
                            {mentor.averageRating > 0 ? mentor.averageRating : '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {mentor.earnings > 0 ? (
                          isClient ? formatNumber(mentor.earnings) : formatCurrency(mentor.earnings)
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(mentor.verificationStatus)}</TableCell>
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
                            <DropdownMenuSeparator />
                            {mentor.verificationStatus === 'pending' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => handleVerifyMentor(mentor.id)}
                                  className="text-[#008A00]"
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Verifikasi
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleRejectMentor(mentor.id)}
                                  className="text-[#D93025]"
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Tolak
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDeleteMentor(mentor.id)}
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

            {filteredMentors.length === 0 && (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
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
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}