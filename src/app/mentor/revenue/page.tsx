'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Banknote,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Search,
  AlertTriangle,
  Key
} from 'lucide-react';
import MentorLayout from '@/components/mentor/mentor-layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';

const revenueTransactions = [
  {
    id: 'TXN-001',
    courseTitle: 'Web Development Basics',
    studentName: 'John Doe',
    amount: 499000,
    date: '2024-10-15',
    status: 'completed',
    paymentMethod: 'Credit Card',
  },
  {
    id: 'TXN-002',
    courseTitle: 'JavaScript Advanced',
    studentName: 'Jane Smith',
    amount: 599000,
    date: '2024-10-14',
    status: 'completed',
    paymentMethod: 'Bank Transfer',
  },
  {
    id: 'TXN-003',
    courseTitle: 'React for Beginners',
    studentName: 'Bob Johnson',
    amount: 549000,
    date: '2024-10-13',
    status: 'pending',
    paymentMethod: 'E-Wallet',
  },
  {
    id: 'TXN-004',
    courseTitle: 'Web Development Basics',
    studentName: 'Alice Brown',
    amount: 499000,
    date: '2024-10-12',
    status: 'completed',
    paymentMethod: 'Credit Card',
  },
  {
    id: 'TXN-005',
    courseTitle: 'Python Data Science',
    studentName: 'Charlie Wilson',
    amount: 699000,
    date: '2024-10-11',
    status: 'failed',
    paymentMethod: 'Bank Transfer',
  },
  {
    id: 'TXN-006',
    courseTitle: 'UI/UX Design',
    studentName: 'Diana Martinez',
    amount: 399000,
    date: '2024-10-10',
    status: 'completed',
    paymentMethod: 'Credit Card',
  },
  {
    id: 'TXN-007',
    courseTitle: 'Mobile App Development',
    studentName: 'Eva Garcia',
    amount: 749000,
    date: '2024-10-09',
    status: 'completed',
    paymentMethod: 'E-Wallet',
  },
  {
    id: 'TXN-008',
    courseTitle: 'Cloud Computing',
    studentName: 'Frank Miller',
    amount: 899000,
    date: '2024-10-08',
    status: 'pending',
    paymentMethod: 'Credit Card',
  },
];

const payoutHistory = [
  {
    id: 'PAYOUT-001',
    amount: 2950000,
    date: '2024-10-01',
    status: 'completed',
    bankAccount: 'BCA ****8765',
  },
  {
    id: 'PAYOUT-002',
    amount: 3450000,
    date: '2024-09-01',
    status: 'completed',
    bankAccount: 'BCA ****8765',
  },
  {
    id: 'PAYOUT-003',
    amount: 2800000,
    date: '2024-08-01',
    status: 'completed',
    bankAccount: 'BCA ****8765',
  },
  {
    id: 'PAYOUT-004',
    amount: 5200000,
    date: '2024-07-01',
    status: 'completed',
    bankAccount: 'BCA ****8765',
  },
  {
    id: 'PAYOUT-005',
    amount: 4100000,
    date: '2024-06-01',
    status: 'completed',
    bankAccount: 'BCA ****8765',
  },
  {
    id: 'PAYOUT-006',
    amount: 3800000,
    date: '2024-05-01',
    status: 'completed',
    bankAccount: 'BCA ****8765',
  },
  {
    id: 'PAYOUT-007',
    amount: 3200000,
    date: '2024-04-01',
    status: 'completed',
    bankAccount: 'BCA ****8765',
  },
  {
    id: 'PAYOUT-008',
    amount: 2950000,
    date: '2024-03-01',
    status: 'completed',
    bankAccount: 'BCA ****8765',
  },
];

export default function MentorRevenue() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
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
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const filteredTransactions = revenueTransactions.filter(txn => {
    const matchesSearch =
      txn.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || txn.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = revenueTransactions
    .filter(txn => txn.status === 'completed')
    .reduce((sum, txn) => sum + txn.amount, 0);

  const pendingRevenue = revenueTransactions
    .filter(txn => txn.status === 'pending')
    .reduce((sum, txn) => sum + txn.amount, 0);

  const totalPayout = payoutHistory
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const availableBalance = totalRevenue - totalPayout;
  const adminFee = availableBalance * 0.02;
  const netAmount = availableBalance - adminFee;

  return (
    <MentorLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="animate-fadeIn">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Revenue & Payout
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Kelola pendapatan dan riwayat pencairan dana Anda
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#008A00]/10 flex items-center justify-center">
                  <Banknote className="h-6 w-6 text-[#008A00]" />
                </div>
                <ArrowUp className="h-5 w-5 text-[#008A00]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Pendapatan</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isClient ? formatNumber(totalRevenue) : formatCurrency(totalRevenue)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#F4B400]/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-[#F4B400]" />
                </div>
                <Clock className="h-5 w-5 text-[#F4B400]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-[#F4B400]">
                  {isClient ? formatNumber(pendingRevenue) : formatCurrency(pendingRevenue)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#005EB8]/10 flex items-center justify-center">
                  <ArrowDown className="h-6 w-6 text-[#005EB8]" />
                </div>
                <ArrowDown className="h-5 w-5 text-[#005EB8]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Payout</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isClient ? formatNumber(totalPayout) : formatCurrency(totalPayout)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#5FB336]/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-[#5FB336]" />
                </div>
                <DollarSign className="h-5 w-5 text-[#5FB336]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Saldo Tersedia</p>
                <p className="text-2xl font-bold text-[#5FB336]">
                  {isClient ? formatNumber(availableBalance) : formatCurrency(availableBalance)}
                </p>
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
                  placeholder="Cari transaksi, kursus, atau siswa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Gagal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sales Transactions Table */}
        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide delay-100">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Transaksi Penjualan
            </CardTitle>
            <CardDescription>
              Riwayat lengkap penjualan kursus Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Transaksi</TableHead>
                    <TableHead>Kursus</TableHead>
                    <TableHead>Siswa</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((txn) => (
                    <TableRow key={txn.id} className="table-row">
                      <TableCell className="font-mono text-sm">
                        {txn.id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {txn.courseTitle}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {txn.studentName}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(txn.date).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {txn.paymentMethod}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(txn.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(txn.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <BarChart3 className="h-10 w-10 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Tidak ada transaksi
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Belum ada transaksi yang sesuai dengan pencarian
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout History and Request Section */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Payout History - Now with 8 items */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide delay-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">
                  Riwayat Payout
                </CardTitle>
                <CheckCircle className="h-5 w-5 text-[#008A00]" />
              </div>
              <CardDescription>
                8 payout terakhir Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[525px] overflow-y-auto p-6 space-y-4">
                {payoutHistory.map((payout) => (
                  <div
                    key={payout.id}
                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#008A00]/10 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-[#008A00]" />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                            {payout.id}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(payout.date).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Jumlah</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {isClient ? formatNumber(payout.amount) : formatCurrency(payout.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Rekening</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {payout.bankAccount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Payout Request */}
          <Card className="rounded-lg border bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-[#005EB8]/20 animate-fadeSlide delay-300">
            <CardContent className="p-6 h-full">
              <div className="space-y-6 h-full flex flex-col">
                {/* Header */}
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-[#005EB8]/10 flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="h-8 w-8 text-[#005EB8]" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Minta Payout
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Cairkan saldo Anda ke rekening bank terdaftar
                  </p>
                </div>

                {/* Balance Information */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Saldo Tersedia
                    </p>
                    <p className="text-3xl font-bold text-[#005EB8]">
                      {isClient ? formatNumber(availableBalance) : formatCurrency(availableBalance)}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Progress menuju minimum payout</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {Math.min(100, Math.round((availableBalance / 100000) * 100))}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-[#005EB8] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.round((availableBalance / 100000) * 100))}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Minimum: {formatCurrency(100000)}
                    </p>
                  </div>
                </div>

                {/* Payout Details */}
                {availableBalance >= 100000 && (
                  <div className="bg-[#008A00]/5 border border-[#008A00]/20 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-[#008A00] text-center">
                      Detail Pencairan
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Saldo yang dicairkan</span>
                        <span className="font-medium">{formatCurrency(availableBalance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Biaya admin (2%)</span>
                        <span className="text-[#D93025]">-{formatCurrency(adminFee)}</span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between font-semibold">
                        <span className="text-gray-900 dark:text-white">Diterima</span>
                        <span className="text-[#008A00]">{formatCurrency(netAmount)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Information */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-[#005EB8] flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Payout akan diproses dalam 5-7 hari kerja
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <CheckCircle className="h-4 w-4 text-[#008A00]" />
                      <span>Min. Rp 100.000</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4 text-[#F4B400]" />
                      <span>5-7 hari kerja</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Banknote className="h-4 w-4 text-[#005EB8]" />
                      <span>Admin fee 2%</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <CheckCircle className="h-4 w-4 text-[#008A00]" />
                      <span>Ke BCA ****8765</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-auto space-y-3">
                  <Button
                    className="w-full bg-[#005EB8] hover:bg-[#004A93] py-3 text-lg font-semibold transition-all duration-300 transform hover:scale-105"
                    disabled={availableBalance < 100000}
                  >
                    <ArrowDown className="h-6 w-6 mr-2" />
                    {availableBalance >= 100000 ? 'Minta Payout Sekarang' : 'Saldo Belum Mencukupi'}
                  </Button>

                  {availableBalance < 100000 && (
                    <div className="text-center p-3 bg-[#F4B400]/10 border border-[#F4B400]/20 rounded-lg">
                      <p className="text-sm text-[#F4B400]">
                        Butuh {formatCurrency(100000 - availableBalance)} lagi untuk bisa melakukan payout
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MentorLayout>
  );
}