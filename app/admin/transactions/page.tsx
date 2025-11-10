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
  Download,
  RefreshCw,
  MoreHorizontal,
  CreditCard,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Clock,
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
const transactions = [
  {
    id: 'TXN-2024-001',
    user: 'Ahmad Fauzi',
    course: 'Web Development Basics',
    mentor: 'Ahmad Hidayat',
    amount: 499000,
    date: '2024-10-15',
    status: 'completed',
    paymentMethod: 'Credit Card',
    paymentGateway: 'Midtrans',
    refundStatus: 'none'
  },
  {
    id: 'TXN-2024-002',
    user: 'Sarah Putri',
    course: 'JavaScript Advanced',
    mentor: 'Sarah Johnson',
    amount: 599000,
    date: '2024-10-14',
    status: 'completed',
    paymentMethod: 'Bank Transfer',
    paymentGateway: 'Midtrans',
    refundStatus: 'none'
  },
  {
    id: 'TXN-2024-003',
    user: 'John Smith',
    course: 'React untuk Pemula',
    mentor: 'David Lee',
    amount: 549000,
    date: '2024-10-13',
    status: 'pending',
    paymentMethod: 'E-Wallet',
    paymentGateway: 'Xendit',
    refundStatus: 'none'
  },
  {
    id: 'TXN-2024-004',
    user: 'Maria Chen',
    course: 'UI/UX Design Fundamentals',
    mentor: 'Maria Garcia',
    amount: 399000,
    date: '2024-10-12',
    status: 'completed',
    paymentMethod: 'Credit Card',
    paymentGateway: 'Midtrans',
    refundStatus: 'none'
  },
  {
    id: 'TXN-2024-005',
    user: 'David Lee',
    course: 'Python Data Science',
    mentor: 'John Smith',
    amount: 699000,
    date: '2024-10-11',
    status: 'failed',
    paymentMethod: 'Bank Transfer',
    paymentGateway: 'Xendit',
    refundStatus: 'none'
  },
  {
    id: 'TXN-2024-006',
    user: 'Lisa Wang',
    course: 'Mobile App Development',
    mentor: 'Robert Brown',
    amount: 749000,
    date: '2024-10-10',
    status: 'completed',
    paymentMethod: 'Credit Card',
    paymentGateway: 'Midtrans',
    refundStatus: 'requested'
  },
  {
    id: 'TXN-2024-007',
    user: 'Robert Brown',
    course: 'Cloud Computing',
    mentor: 'Emily Davis',
    amount: 899000,
    date: '2024-10-09',
    status: 'completed',
    paymentMethod: 'E-Wallet',
    paymentGateway: 'Xendit',
    refundStatus: 'processing'
  },
  {
    id: 'TXN-2024-008',
    user: 'Emily Davis',
    course: 'Graphic Design Mastery',
    mentor: 'Lisa Wang',
    amount: 299000,
    date: '2024-10-08',
    status: 'refunded',
    paymentMethod: 'Credit Card',
    paymentGateway: 'Midtrans',
    refundStatus: 'completed'
  }
];

const payoutStats = {
  totalRevenue: 4587000,
  platformFee: 458700,
  mentorPayout: 4128300,
  pendingPayouts: 1250000,
  completedPayouts: 2878300
};

export default function AdminTransactions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRefund, setFilterRefund] = useState('all');
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
      case 'completed':
        return <Badge className="bg-[#008A00]">Selesai</Badge>;
      case 'pending':
        return <Badge className="bg-[#F4B400]">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-[#D93025]">Gagal</Badge>;
      case 'refunded':
        return <Badge className="bg-[#005EB8]">Dikembalikan</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getRefundBadge = (refundStatus: string) => {
    switch (refundStatus) {
      case 'none':
        return <Badge variant="outline" className="border-gray-300 text-gray-600">Tidak Ada</Badge>;
      case 'requested':
        return <Badge className="bg-[#F4B400]">Diminta</Badge>;
      case 'processing':
        return <Badge className="bg-[#005EB8]">Diproses</Badge>;
      case 'completed':
        return <Badge className="bg-[#008A00]">Selesai</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = 
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    const matchesRefund = filterRefund === 'all' || transaction.refundStatus === filterRefund;
    
    return matchesSearch && matchesStatus && matchesRefund;
  });

  const handleRefundTransaction = (transactionId: string) => {
    console.log(`Refund transaction: ${transactionId}`);
    // API call: POST /api/refunds/request
  };

  const handleViewDetails = (transactionId: string) => {
    console.log(`View details: ${transactionId}`);
    // Implement view details modal
  };

  const handleExportCSV = () => {
    console.log('Export transactions to CSV');
    // Implement CSV export
  };

  const stats = {
    total: transactions.length,
    completed: transactions.filter(t => t.status === 'completed').length,
    pending: transactions.filter(t => t.status === 'pending').length,
    failed: transactions.filter(t => t.status === 'failed').length,
    refunded: transactions.filter(t => t.status === 'refunded').length
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeIn">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Transactions
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Daftar transaksi, status pembayaran, refund, dan payout
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="border-gray-300 dark:border-gray-600"
              onClick={handleExportCSV}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#005EB8]/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-[#005EB8]" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Transaksi</p>
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
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Selesai</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
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
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.failed}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gagal</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-400">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#005EB8]/10 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-[#005EB8]" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.refunded}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dikembalikan</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payout Summary */}
        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Ringkasan Payout</CardTitle>
            <CardDescription>
              Total pendapatan dan pembagian untuk mentor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Pendapatan</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isClient ? formatNumber(payoutStats.totalRevenue) : formatCurrency(payoutStats.totalRevenue)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Platform Fee (10%)</p>
                <p className="text-2xl font-bold text-[#005EB8]">
                  {isClient ? formatNumber(payoutStats.platformFee) : formatCurrency(payoutStats.platformFee)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Payout Mentor</p>
                <p className="text-2xl font-bold text-[#008A00]">
                  {isClient ? formatNumber(payoutStats.mentorPayout) : formatCurrency(payoutStats.mentorPayout)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Payout</p>
                <p className="text-2xl font-bold text-[#F4B400]">
                  {isClient ? formatNumber(payoutStats.pendingPayouts) : formatCurrency(payoutStats.pendingPayouts)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter Section */}
        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide delay-100">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Cari ID transaksi, user, atau kursus..."
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
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Gagal</SelectItem>
                    <SelectItem value="refunded">Dikembalikan</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterRefund} onValueChange={setFilterRefund}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Refund" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Refund</SelectItem>
                    <SelectItem value="none">Tidak Ada</SelectItem>
                    <SelectItem value="requested">Diminta</SelectItem>
                    <SelectItem value="processing">Diproses</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide delay-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Daftar Transaksi
            </CardTitle>
            <CardDescription>
              Kelola semua transaksi dan proses refund
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Transaksi</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Kursus</TableHead>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Refund</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="table-row">
                      <TableCell className="font-mono text-sm">
                        {transaction.id}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {transaction.user}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {transaction.course}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {transaction.mentor}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(transaction.date).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {transaction.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {transaction.paymentGateway}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>{getRefundBadge(transaction.refundStatus)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem 
                              onClick={() => handleViewDetails(transaction.id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {transaction.status === 'completed' && transaction.refundStatus === 'none' && (
                              <DropdownMenuItem 
                                onClick={() => handleRefundTransaction(transaction.id)}
                                className="text-[#D93025]"
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Proses Refund
                              </DropdownMenuItem>
                            )}
                            {(transaction.refundStatus === 'requested' || transaction.refundStatus === 'processing') && (
                              <DropdownMenuItem 
                                onClick={() => handleRefundTransaction(transaction.id)}
                                className="text-[#005EB8]"
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Lanjutkan Refund
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <CreditCard className="h-10 w-10 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Tidak ada transaksi ditemukan
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