// app/user/transactions/page.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  FileText,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Receipt,
  Eye,
} from "lucide-react";
import Link from "next/link";
import UserLayout from "@/components/user/user-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const transactions = [
  {
    id: "TRX-2024-001",
    courseName: "Full-Stack Web Development",
    amount: 499000,
    status: "completed",
    paymentMethod: "Credit Card",
    date: "2024-09-15",
    progress: 65,
    materialsAccessed: 12,
    canRefund: true,
    invoice: "/invoices/TRX-2024-001.pdf",
    paymentDetails: {
      cardNumber: "**** **** **** 1234",
      bankName: "BCA",
      paymentTime: "2024-09-15 14:30:25"
    }
  },
  {
    id: "TRX-2024-002",
    courseName: "Data Science dengan Python",
    amount: 599000,
    status: "completed",
    paymentMethod: "Bank Transfer",
    date: "2024-08-10",
    progress: 25,
    materialsAccessed: 5,
    canRefund: true,
    invoice: "/invoices/TRX-2024-002.pdf",
    paymentDetails: {
      accountNumber: "123-456-789",
      bankName: "Mandiri",
      paymentTime: "2024-08-10 09:15:42"
    }
  },
  {
    id: "TRX-2024-003",
    courseName: "Digital Marketing Fundamentals",
    amount: 399000,
    status: "pending",
    paymentMethod: "E-Wallet",
    date: "2024-10-05",
    progress: 0,
    materialsAccessed: 0,
    canRefund: false,
    invoice: null,
    paymentDetails: {
      walletType: "Gopay",
      paymentTime: "2024-10-05 16:20:15"
    }
  },
  {
    id: "TRX-2024-004",
    courseName: "UI/UX Design Mastery",
    amount: 549000,
    status: "completed",
    paymentMethod: "Credit Card",
    date: "2024-07-20",
    progress: 90,
    materialsAccessed: 13,
    canRefund: false,
    invoice: "/invoices/TRX-2024-004.pdf",
    paymentDetails: {
      cardNumber: "**** **** **** 5678",
      bankName: "BNI",
      paymentTime: "2024-07-20 11:45:30"
    }
  },
  {
    id: "TRX-2024-005",
    courseName: "Mobile App Development",
    amount: 699000,
    status: "refunded",
    paymentMethod: "Bank Transfer",
    date: "2024-09-01",
    refundDate: "2024-09-08",
    progress: 10,
    materialsAccessed: 2,
    canRefund: false,
    invoice: "/invoices/TRX-2024-005.pdf",
    paymentDetails: {
      accountNumber: "987-654-321",
      bankName: "BRI",
      paymentTime: "2024-09-01 13:20:10"
    }
  },
  {
    id: "TRX-2024-006",
    courseName: "Machine Learning Professional",
    amount: 799000,
    status: "failed",
    paymentMethod: "Credit Card",
    date: "2024-10-01",
    progress: 0,
    materialsAccessed: 0,
    canRefund: false,
    invoice: null,
    paymentDetails: {
      cardNumber: "**** **** **** 9012",
      bankName: "BCA",
      paymentTime: "2024-10-01 10:05:22"
    }
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-[#008A00]">Berhasil</Badge>;
    case "pending":
      return <Badge className="bg-[#F4B400]">Pending</Badge>;
    case "refunded":
      return <Badge className="bg-[#005EB8]">Refund</Badge>;
    case "failed":
      return <Badge className="bg-[#D93025]">Gagal</Badge>;
    default:
      return <Badge>Unknown</Badge>;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-5 w-5 text-[#008A00]" />;
    case "pending":
      return <Clock className="h-5 w-5 text-[#F4B400]" />;
    case "refunded":
      return <Receipt className="h-5 w-5 text-[#005EB8]" />;
    case "failed":
      return <XCircle className="h-5 w-5 text-[#D93025]" />;
    default:
      return null;
  }
};

export default function UserTransaction() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredTransactions = transactions.filter((trx) => {
    const matchesSearch =
      trx.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trx.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || trx.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleRefundRequest = (transactionId: string) => {
    console.log(`Requesting refund for transaction: ${transactionId}`);
  };

  const handleRefreshPayment = (transactionId: string) => {
    console.log(`Refreshing payment status for: ${transactionId}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalSpent = transactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRefunded = transactions
    .filter((t) => t.status === "refunded")
    .reduce((sum, t) => sum + t.amount, 0);

  const getActionButton = (transaction: any) => {
    switch (transaction.status) {
      case "completed":
        return (
          <Link href={`/user/transaction/${transaction.id}`}>
            <Button size="sm" variant="outline">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        );
      case "pending":
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleRefreshPayment(transaction.id)}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        );
      case "refunded":
        return (
          <Link href={`/user/transaction/${transaction.id}`}>
            <Button size="sm" variant="outline">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        );
      default:
        return null;
    }
  };

  return (
    <UserLayout>
      <div className="space-y-8">
        <div className="animate-fadeIn">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Riwayat Transaksi
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Kelola transaksi dan ajukan refund untuk kursus berbayar
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#008A00]/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-[#008A00]" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Pengeluaran
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#005EB8]/10 flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-[#005EB8]" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Refund
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalRefunded)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn delay-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#F4B400]/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-[#F4B400]" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Transaksi
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {transactions.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Cari transaksi atau kursus..."
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
                  <SelectItem value="completed">Berhasil</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="refunded">Refund</SelectItem>
                  <SelectItem value="failed">Gagal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeSlide delay-100">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Daftar Transaksi
            </CardTitle>
            <CardDescription>
              Riwayat lengkap transaksi pembelian kursus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Transaksi</TableHead>
                    <TableHead>Kursus</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((trx) => (
                    <TableRow key={trx.id} className="table-row">
                      <TableCell className="font-mono text-sm">
                        {trx.id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {trx.courseName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Progress: {trx.progress}%
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(trx.date).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {trx.paymentMethod}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(trx.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(trx.status)}</TableCell>
                      <TableCell className="text-right">
                        {getActionButton(trx)}
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

        <Card className="rounded-lg border bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-[#005EB8]/20 animate-fadeIn">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Receipt className="h-6 w-6 text-[#005EB8]" />
              Kebijakan Refund
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Anda dapat mengajukan refund dengan syarat berikut:
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-[#008A00] flex-shrink-0 mt-0.5" />
                <span>Maksimal 30 hari setelah pembelian</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-[#008A00] flex-shrink-0 mt-0.5" />
                <span>Progress kursus maksimal 20%</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-[#008A00] flex-shrink-0 mt-0.5" />
                <span>Maksimal 5 materi yang sudah diakses</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-[#008A00] flex-shrink-0 mt-0.5" />
                <span>Proses refund memakan waktu 5-7 hari kerja</span>
              </li>
            </ul>
            <Card className="rounded-lg border bg-[#F4B400]/10 border-[#F4B400]/20">
              <CardContent className="p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Catatan:</strong> Setelah refund disetujui, akses ke
                  kursus akan dicabut dan sertifikat (jika ada) akan dibatalkan.
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}