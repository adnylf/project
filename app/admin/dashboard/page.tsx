'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserCheck,
  BookOpen,
  BarChart3,
  TrendingUp,
  Eye,
  MoreHorizontal,
  Search,
  Download
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
import { Input } from '@/components/ui/input';

// Data dummy
const platformStats = {
  totalUsers: 12580,
  totalMentors: 245,
  activeCourses: 189,
  totalRevenue: 1250000000,
  newUsersThisMonth: 324,
  pendingMentors: 12,
  pendingCourses: 8
};

const popularCourses = [
  {
    id: 1,
    title: 'Dasar-Dasar Pemrograman Web',
    mentor: 'Ahmad Hidayat',
    students: 1250,
    revenue: 15000000,
    rating: 4.8,
    status: 'active',
    category: 'Programming'
  },
  {
    id: 2,
    title: 'JavaScript Advanced',
    mentor: 'Sarah Johnson',
    students: 890,
    revenue: 12000000,
    rating: 4.7,
    status: 'active',
    category: 'Programming'
  },
  {
    id: 3,
    title: 'UI/UX Design Fundamentals',
    mentor: 'Maria Garcia',
    students: 650,
    revenue: 9500000,
    rating: 4.9,
    status: 'active',
    category: 'Design'
  },
  {
    id: 4,
    title: 'Python Data Science',
    mentor: 'David Lee',
    students: 780,
    revenue: 11200000,
    rating: 4.8,
    status: 'active',
    category: 'Programming'
  },
  {
    id: 5,
    title: 'Mobile App Development',
    mentor: 'John Smith',
    students: 420,
    revenue: 6800000,
    rating: 4.6,
    status: 'active',
    category: 'Programming'
  }
];

const recentActivities = [
  {
    id: 1,
    user: 'Ahmad Fauzi',
    action: 'mendaftar kursus',
    course: 'Web Development Basics',
    time: '2 jam yang lalu'
  },
  {
    id: 2,
    mentor: 'Sarah Johnson',
    action: 'membuat kursus baru',
    course: 'Advanced React Patterns',
    time: '4 jam yang lalu'
  },
  {
    id: 3,
    user: 'Maria Chen',
    action: 'menyelesaikan kursus',
    course: 'UI/UX Design Fundamentals',
    time: '5 jam yang lalu'
  },
  {
    id: 4,
    mentor: 'David Lee',
    action: 'mengupdate kursus',
    course: 'Python Data Science',
    time: '1 hari yang lalu'
  },
  {
    id: 5,
    user: 'John Doe',
    action: 'memberikan review',
    course: 'JavaScript Advanced',
    time: '1 hari yang lalu'
  }
];

export default function AdminDashboard() {
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
    if (status === 'active') {
      return <Badge className="bg-[#008A00]">Aktif</Badge>;
    }
    return <Badge>Unknown</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeIn">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Ringkasan aktivitas platform: user, mentor, kursus, dan pendapatan
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-gray-300 dark:border-gray-600">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
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
                <TrendingUp className="h-5 w-5 text-[#008A00]" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {isClient ? formatNumber(platformStats.totalUsers) : platformStats.totalUsers.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs text-[#008A00]">+{platformStats.newUsersThisMonth} bulan ini</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#008A00]/10 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-[#008A00]" />
                </div>
                <TrendingUp className="h-5 w-5 text-[#008A00]" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {platformStats.totalMentors}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Mentors</p>
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs bg-[#F4B400]/10 text-[#F4B400] border-[#F4B400]/20">
                  {platformStats.pendingMentors} pending
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#F4B400]/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-[#F4B400]" />
                </div>
                <TrendingUp className="h-5 w-5 text-[#008A00]" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {platformStats.activeCourses}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Courses</p>
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs bg-[#F4B400]/10 text-[#F4B400] border-[#F4B400]/20">
                  {platformStats.pendingCourses} pending
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#008A00]/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-[#008A00]" />
                </div>
                <TrendingUp className="h-5 w-5 text-[#008A00]" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {isClient ? formatNumber(platformStats.totalRevenue) : formatCurrency(platformStats.totalRevenue)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs text-[#008A00]">+15% dari bulan lalu</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Popular Courses Table */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">Kursus Populer</CardTitle>
                  <CardDescription>
                    5 kursus dengan performa terbaik
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
                  <Eye className="h-4 w-4 mr-2" />
                  Lihat Semua
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kursus</TableHead>
                      <TableHead>Mentor</TableHead>
                      <TableHead>Siswa</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {popularCourses.map((course) => (
                      <TableRow key={course.id} className="table-row">
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {course.title}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {course.category}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {course.mentor}
                        </TableCell>
                        <TableCell className="font-medium">
                          {isClient ? formatNumber(course.students) : course.students.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-[#F4B400]">⭐</span>
                            <span className="font-medium">{course.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(course.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide delay-100">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Aktivitas Terbaru</CardTitle>
              <CardDescription>
                Aktivitas terbaru di platform
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto p-6 space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white mb-1">
                          <span className="font-medium">
                            {activity.user || activity.mentor}
                          </span>{' '}
                          {activity.action}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {activity.course}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart Section */}
        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide delay-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Revenue Trend</CardTitle>
                <CardDescription>
                  Perkembangan pendapatan 6 bulan terakhir
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Filter..."
                    className="pl-10 w-[200px]"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Chart Revenue akan ditampilkan di sini
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Integrasi dengan chart library (Chart.js/Recharts)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}