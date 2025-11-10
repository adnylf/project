'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Download,
  Calendar,
  BarChart3,
  Users,
  BookOpen,
  CreditCard,
  FileText,
  TrendingUp,
  TrendingDown,
  Eye
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Data dummy
const activityLogs = [
  {
    id: 1,
    user: 'Admin System',
    action: 'Login ke sistem',
    target: 'Dashboard',
    ipAddress: '192.168.1.100',
    timestamp: '2024-10-20 08:30:15',
    status: 'success'
  },
  {
    id: 2,
    user: 'Ahmad Fauzi',
    action: 'Mendaftar kursus',
    target: 'Web Development Basics',
    ipAddress: '192.168.1.101',
    timestamp: '2024-10-20 09:15:22',
    status: 'success'
  },
  {
    id: 3,
    user: 'Sarah Johnson',
    action: 'Mengupdate kursus',
    target: 'JavaScript Advanced',
    ipAddress: '192.168.1.102',
    timestamp: '2024-10-20 10:05:45',
    status: 'success'
  },
  {
    id: 4,
    user: 'Admin System',
    action: 'Memverifikasi mentor',
    target: 'David Lee',
    ipAddress: '192.168.1.100',
    timestamp: '2024-10-20 11:20:30',
    status: 'success'
  },
  {
    id: 5,
    user: 'John Smith',
    action: 'Gagal login',
    target: 'Login Page',
    ipAddress: '192.168.1.103',
    timestamp: '2024-10-20 12:45:18',
    status: 'failed'
  },
  {
    id: 6,
    user: 'Maria Garcia',
    action: 'Membuat kursus baru',
    target: 'Mobile Development',
    ipAddress: '192.168.1.104',
    timestamp: '2024-10-20 14:30:55',
    status: 'success'
  },
  {
    id: 7,
    user: 'Admin System',
    action: 'Menolak kursus',
    target: 'Python Basics',
    ipAddress: '192.168.1.100',
    timestamp: '2024-10-20 15:20:10',
    status: 'success'
  },
  {
    id: 8,
    user: 'Lisa Wang',
    action: 'Menyelesaikan kursus',
    target: 'UI/UX Design',
    ipAddress: '192.168.1.105',
    timestamp: '2024-10-20 16:45:33',
    status: 'success'
  }
];

const reportStats = {
  totalUsers: 12580,
  totalMentors: 245,
  activeCourses: 189,
  totalRevenue: 1250000000,
  userGrowth: 15.2,
  revenueGrowth: 12.8,
  completionRate: 78.5,
  satisfactionRate: 4.7
};

export default function AdminReports() {
  const [searchTerm, setSearchTerm] = useState('');
  const [reportType, setReportType] = useState('activity');
  const [dateRange, setDateRange] = useState('7days');
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
    if (status === 'success') {
      return <Badge className="bg-[#008A00]">Berhasil</Badge>;
    } else {
      return <Badge className="bg-[#D93025]">Gagal</Badge>;
    }
  };

  const filteredLogs = activityLogs.filter((log) => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleGenerateReport = () => {
    console.log(`Generating ${reportType} report for ${dateRange}`);
    // API call: GET /api/admin/reports/export
  };

  const handleDownloadReport = (format: string) => {
    console.log(`Downloading report in ${format} format`);
    // Implement download functionality
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return <TrendingUp className="h-4 w-4 text-[#008A00]" />;
    } else {
      return <TrendingDown className="h-4 w-4 text-[#D93025]" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeIn">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Laporan aktivitas user, pendapatan, dan performa kursus
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="border-gray-300 dark:border-gray-600"
              onClick={() => handleDownloadReport('PDF')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button 
              variant="outline" 
              className="border-gray-300 dark:border-gray-600"
              onClick={() => handleDownloadReport('CSV')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Report Configuration */}
        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Generate Report</CardTitle>
            <CardDescription>
              Pilih jenis laporan dan periode waktu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="reportType">Jenis Laporan</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis laporan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activity">Aktivitas User</SelectItem>
                    <SelectItem value="revenue">Pendapatan</SelectItem>
                    <SelectItem value="courses">Performa Kursus</SelectItem>
                    <SelectItem value="mentors">Performa Mentor</SelectItem>
                    <SelectItem value="system">Sistem & Logs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateRange">Periode Waktu</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih periode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hari Ini</SelectItem>
                    <SelectItem value="7days">7 Hari Terakhir</SelectItem>
                    <SelectItem value="30days">30 Hari Terakhir</SelectItem>
                    <SelectItem value="90days">90 Hari Terakhir</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="generate">&nbsp;</Label>
                <Button 
                  className="w-full bg-[#005EB8] hover:bg-[#004A93]"
                  onClick={handleGenerateReport}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#005EB8]/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-[#005EB8]" />
                </div>
                {getGrowthIcon(reportStats.userGrowth)}
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {isClient ? formatNumber(reportStats.totalUsers) : reportStats.totalUsers.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className={`text-xs ${reportStats.userGrowth > 0 ? 'text-[#008A00]' : 'text-[#D93025]'}`}>
                  {reportStats.userGrowth > 0 ? '+' : ''}{reportStats.userGrowth}%
                </span>
                <span className="text-xs text-gray-500">dari bulan lalu</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#008A00]/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-[#008A00]" />
                </div>
                {getGrowthIcon(5.2)}
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {reportStats.activeCourses}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Courses</p>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs text-[#008A00]">+5.2%</span>
                <span className="text-xs text-gray-500">dari bulan lalu</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#F4B400]/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-[#F4B400]" />
                </div>
                {getGrowthIcon(reportStats.revenueGrowth)}
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {isClient ? formatNumber(reportStats.totalRevenue) : formatCurrency(reportStats.totalRevenue)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className={`text-xs ${reportStats.revenueGrowth > 0 ? 'text-[#008A00]' : 'text-[#D93025]'}`}>
                  {reportStats.revenueGrowth > 0 ? '+' : ''}{reportStats.revenueGrowth}%
                </span>
                <span className="text-xs text-gray-500">dari bulan lalu</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#008A00]/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-[#008A00]" />
                </div>
                {getGrowthIcon(2.1)}
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {reportStats.completionRate}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs text-[#008A00]">+2.1%</span>
                <span className="text-xs text-gray-500">dari bulan lalu</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Revenue Chart */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide delay-200">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Revenue Trend</CardTitle>
              <CardDescription>
                Perkembangan pendapatan 6 bulan terakhir
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Revenue Chart akan ditampilkan di sini
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Integrasi dengan chart library (Chart.js/Recharts)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Activity Chart */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide delay-300">
            <CardHeader>
              <CardTitle className="text-xl font-bold">User Activity</CardTitle>
              <CardDescription>
                Aktivitas user dalam 30 hari terakhir
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Activity Chart akan ditampilkan di sini
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Integrasi dengan chart library (Chart.js/Recharts)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Logs */}
        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide delay-400">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Activity Logs</CardTitle>
                <CardDescription>
                  Log aktivitas sistem dan user terbaru
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Cari aktivitas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-[200px]"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Aksi</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="table-row">
                      <TableCell>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {log.user}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.action}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.target}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ipAddress}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <BarChart3 className="h-10 w-10 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Tidak ada aktivitas ditemukan
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Coba ubah kata kunci pencarian
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