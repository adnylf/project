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
  CheckCircle,
  XCircle,
  MoreHorizontal,
  BookOpen,
  BarChart3
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
const courses = [
  {
    id: 1,
    title: 'Dasar-Dasar Pemrograman Web',
    mentor: 'Ahmad Hidayat',
    category: 'Programming',
    students: 1250,
    price: 499000,
    rating: 4.8,
    status: 'approved',
    approvalStatus: 'approved',
    createdAt: '2024-09-15',
    lastUpdated: '2024-10-20'
  },
  {
    id: 2,
    title: 'JavaScript Advanced',
    mentor: 'Sarah Johnson',
    category: 'Programming',
    students: 890,
    price: 599000,
    rating: 4.7,
    status: 'approved',
    approvalStatus: 'approved',
    createdAt: '2024-08-20',
    lastUpdated: '2024-10-15'
  },
  {
    id: 3,
    title: 'React untuk Pemula',
    mentor: 'David Lee',
    category: 'Programming',
    students: 650,
    price: 549000,
    rating: 4.9,
    status: 'pending',
    approvalStatus: 'pending',
    createdAt: '2024-10-01',
    lastUpdated: '2024-10-18'
  },
  {
    id: 4,
    title: 'UI/UX Design Fundamentals',
    mentor: 'Maria Garcia',
    category: 'Design',
    students: 420,
    price: 399000,
    rating: 4.6,
    status: 'approved',
    approvalStatus: 'approved',
    createdAt: '2024-07-10',
    lastUpdated: '2024-10-12'
  },
  {
    id: 5,
    title: 'Python Data Science',
    mentor: 'John Smith',
    category: 'Programming',
    students: 780,
    price: 699000,
    rating: 4.8,
    status: 'rejected',
    approvalStatus: 'rejected',
    createdAt: '2024-09-05',
    lastUpdated: '2024-10-08'
  },
  {
    id: 6,
    title: 'Mobile App Development',
    mentor: 'Robert Brown',
    category: 'Programming',
    students: 320,
    price: 749000,
    rating: 4.5,
    status: 'pending',
    approvalStatus: 'pending',
    createdAt: '2024-10-10',
    lastUpdated: '2024-10-22'
  }
];

export default function AdminCourses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
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
      case 'approved':
        return <Badge className="bg-[#008A00]">Disetujui</Badge>;
      case 'pending':
        return <Badge className="bg-[#F4B400]">Menunggu</Badge>;
      case 'rejected':
        return <Badge className="bg-[#D93025]">Ditolak</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.mentor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || course.approvalStatus === filterStatus;
    const matchesCategory = filterCategory === 'all' || course.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleApproveCourse = (courseId: number) => {
    console.log(`Approve course: ${courseId}`);
    // API call: PUT /api/admin/courses/:id/approve
  };

  const handleRejectCourse = (courseId: number) => {
    console.log(`Reject course: ${courseId}`);
    // API call: PUT /api/admin/courses/:id/reject
  };

  const handleDeleteCourse = (courseId: number) => {
    console.log(`Delete course: ${courseId}`);
    // API call: DELETE /api/admin/courses/:id
  };

  const stats = {
    total: courses.length,
    approved: courses.filter(c => c.approvalStatus === 'approved').length,
    pending: courses.filter(c => c.approvalStatus === 'pending').length,
    rejected: courses.filter(c => c.approvalStatus === 'rejected').length
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeIn">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Manage Courses
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manajemen semua kursus yang dibuat oleh mentor
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#005EB8]/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-[#005EB8]" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Kursus</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#008A00]/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-[#008A00]" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.approved}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Disetujui</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#F4B400]/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-[#F4B400]" />
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
                  <XCircle className="h-6 w-6 text-[#D93025]" />
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
                  placeholder="Cari kursus atau mentor..."
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
                    <SelectItem value="approved">Disetujui</SelectItem>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    <SelectItem value="Programming">Programming</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses Table */}
        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide delay-100">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
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
                  <TableRow>
                    <TableHead>Kursus</TableHead>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Siswa</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Terakhir Diupdate</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id} className="table-row">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {course.title}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {course.mentor}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {course.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {isClient ? formatNumber(course.students) : course.students.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(course.price)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-[#F4B400]">⭐</span>
                          <span className="font-medium">{course.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(course.approvalStatus)}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(course.lastUpdated).toLocaleDateString('id-ID')}
                      </TableCell>
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
                            {course.approvalStatus === 'pending' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => handleApproveCourse(course.id)}
                                  className="text-[#008A00]"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Setujui
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleRejectCourse(course.id)}
                                  className="text-[#D93025]"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Tolak
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDeleteCourse(course.id)}
                              className="text-[#D93025]"
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
  );
}