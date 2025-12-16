"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Receipt,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  Calendar,
  ExternalLink,
  Loader2,
  BookOpen,
  Filter,
  TrendingUp,
  DollarSign,
  BarChart3,
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
import ProtectedRoute from "@/components/auth/protected-route";

const API_BASE_URL = "http://localhost:3000/api";

type TransactionStatus = "PENDING" | "PAID" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED";

interface Course {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  mentor: {
    user: {
      full_name: string;
    };
  } | null;
}

interface Transaction {
  id: string;
  order_id: string;
  course_id: string;
  amount: number;
  discount: number;
  total_amount: number;
  payment_method: string;
  status: TransactionStatus;
  payment_url: string | null;
  paid_at: string | null;
  expired_at: string | null;
  created_at: string;
  course: Course;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusConfig = (status: TransactionStatus) => {
  const configs = {
    PENDING: {
      label: "Menunggu Pembayaran",
      icon: Clock,
      color: "bg-[#F4B400]/10 text-[#F4B400] border-[#F4B400]/20",
      iconColor: "text-[#F4B400]",
    },
    PAID: {
      label: "Dibayar",
      icon: CheckCircle2,
      color: "bg-[#008A00]/10 text-[#008A00] border-[#008A00]/20",
      iconColor: "text-[#008A00]",
    },
    SUCCESS: {
      label: "Berhasil",
      icon: CheckCircle2,
      color: "bg-[#008A00]/10 text-[#008A00] border-[#008A00]/20",
      iconColor: "text-[#008A00]",
    },
    FAILED: {
      label: "Gagal",
      icon: XCircle,
      color: "bg-[#D93025]/10 text-[#D93025] border-[#D93025]/20",
      iconColor: "text-[#D93025]",
    },
    CANCELLED: {
      label: "Dibatalkan",
      icon: XCircle,
      color: "bg-gray-100 text-gray-800 border-gray-200",
      iconColor: "text-gray-600",
    },
    REFUNDED: {
      label: "Dikembalikan",
      icon: AlertCircle,
      color: "bg-purple-100 text-purple-800 border-purple-200",
      iconColor: "text-purple-600",
    },
  };
  return configs[status] || configs.PENDING;
};

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    MIDTRANS: "Midtrans",
    E_WALLET: "E-Wallet",
    VIRTUAL_ACCOUNT: "Virtual Account",
    QRIS: "QRIS",
    BANK_TRANSFER: "Transfer Bank",
  };
  return labels[method] || method;
};

export default function UserTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const getAuthToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || localStorage.getItem("accessToken");
    }
    return null;
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        if (!token) {
          setError("Silakan login terlebih dahulu");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/payments`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Gagal mengambil data transaksi");

        const data = await response.json();
        setTransactions(data.transactions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [getAuthToken]);

  const filteredTransactions = transactions
    .filter((tx) => {
      const matchesSearch =
        tx.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.course.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || tx.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "amount-high") return b.total_amount - a.total_amount;
      if (sortBy === "amount-low") return a.total_amount - b.total_amount;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const stats = {
    total: transactions.length,
    success: transactions.filter((t) => t.status === "SUCCESS" || t.status === "PAID").length,
    pending: transactions.filter((t) => t.status === "PENDING").length,
    totalSpent: transactions
      .filter((t) => t.status === "SUCCESS" || t.status === "PAID")
      .reduce((sum, t) => sum + t.total_amount, 0),
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <UserLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-[#005EB8]" />
          </div>
        </UserLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Receipt className="h-8 w-8 text-[#005EB8]" />
                Riwayat Transaksi
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Lihat semua transaksi pembelian kursus Anda</p>
            </div>
          </div>

          {error && (
            <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#005EB8]/10">
                    <Receipt className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Transaksi</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <CheckCircle2 className="h-6 w-6 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Berhasil</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.success}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <Clock className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#D93025]/10">
                    <DollarSign className="h-6 w-6 text-[#D93025]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Belanja</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats.totalSpent).replace('IDR', 'Rp')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input 
                    type="search" 
                    placeholder="Cari order ID atau nama kursus..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="PENDING">Menunggu</SelectItem>
                    <SelectItem value="SUCCESS">Berhasil</SelectItem>
                    <SelectItem value="FAILED">Gagal</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Terbaru</SelectItem>
                    <SelectItem value="oldest">Terlama</SelectItem>
                    <SelectItem value="amount-high">Nominal Tertinggi</SelectItem>
                    <SelectItem value="amount-low">Nominal Terendah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          {filteredTransactions.length > 0 ? (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => {
                const statusConfig = getStatusConfig(transaction.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <Card 
                    key={transaction.id} 
                    className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="w-full lg:w-40 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                          {transaction.course.thumbnail ? (
                            <img 
                              src={transaction.course.thumbnail} 
                              alt={transaction.course.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-1 mb-1">
                                {transaction.course.title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                oleh {transaction.course.mentor?.user?.full_name || "Instruktur"}
                              </p>
                            </div>
                            <Badge className={`${statusConfig.color} border`}>
                              <StatusIcon className={`h-3 w-3 mr-1 ${statusConfig.iconColor}`} />
                              {statusConfig.label}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">Order ID</p>
                              <p className="font-medium font-mono text-xs truncate text-gray-900 dark:text-white">{transaction.order_id}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">Tanggal</p>
                              <p className="font-medium text-gray-900 dark:text-white">{formatDate(transaction.created_at)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">Metode</p>
                              <p className="font-medium text-gray-900 dark:text-white">{getPaymentMethodLabel(transaction.payment_method)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">Total</p>
                              <p className="font-bold text-[#005EB8] text-lg">
                                {formatCurrency(transaction.total_amount).replace('IDR', 'Rp')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <Link href={`/user/transaction/${transaction.id}`}>
                              <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Detail
                              </Button>
                            </Link>
                            {transaction.status === "PENDING" && transaction.payment_url && (
                              <a href={transaction.payment_url} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" className="bg-[#005EB8] hover:bg-[#004A93]">
                                  <CreditCard className="h-4 w-4 mr-1" />
                                  Bayar Sekarang
                                </Button>
                              </a>
                            )}
                            {(transaction.status === "SUCCESS" || transaction.status === "PAID") && (
                              <Link href={`/user/courses/${transaction.course.id}/player`}>
                                <Button size="sm" className="bg-[#008A00] hover:bg-[#007800]">
                                  <BookOpen className="h-4 w-4 mr-1" />
                                  Akses Kursus
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Receipt className="h-10 w-10 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {searchTerm || filterStatus !== "all" ? "Tidak ada transaksi" : "Belum ada transaksi"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {searchTerm || filterStatus !== "all" ? "Coba ubah filter pencarian Anda" : "Mulai belajar dengan membeli kursus"}
                    </p>
                  </div>
                  {!searchTerm && filterStatus === "all" && (
                    <Link href="/courses">
                      <Button className="bg-[#005EB8] hover:bg-[#004A93]">
                        Jelajahi Kursus
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}