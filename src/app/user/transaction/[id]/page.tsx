"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Receipt,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  Calendar,
  Loader2,
  BookOpen,
  User,
  Mail,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import UserLayout from "@/components/user/user-layout";
import ProtectedRoute from "@/components/auth/protected-route";

const API_BASE_URL = "http://localhost:3000/api";

type TransactionStatus = "PENDING" | "PAID" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED";

interface Course {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  discount_price: number | null;
  level: string;
  total_duration: number;
  mentor: { user: { full_name: string } } | null;
  category: { name: string } | null;
}

interface TransactionUser {
  id: string;
  full_name: string;
  email: string;
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
  updated_at: string;
  course: Course;
  user: TransactionUser;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
const formatDuration = (minutes: number) => { if (!minutes) return "0m"; if (minutes < 60) return `${minutes}m`; return `${Math.floor(minutes / 60)}j ${minutes % 60}m`; };
const getLevelLabel = (level: string) => ({ BEGINNER: "Pemula", INTERMEDIATE: "Menengah", ADVANCED: "Mahir", ALL_LEVELS: "Semua Level" }[level] || level);

const getStatusConfig = (status: TransactionStatus) => {
  const configs = {
    PENDING: { 
      label: "Menunggu Pembayaran", 
      icon: Clock, 
      color: "text-[#F4B400]", 
      bgColor: "bg-[#F4B400]/10",
      borderColor: "border-[#F4B400]/20"
    },
    PAID: { 
      label: "Dibayar", 
      icon: CheckCircle2, 
      color: "text-[#008A00]", 
      bgColor: "bg-[#008A00]/10",
      borderColor: "border-[#008A00]/20"
    },
    SUCCESS: { 
      label: "Berhasil", 
      icon: CheckCircle2, 
      color: "text-[#008A00]", 
      bgColor: "bg-[#008A00]/10",
      borderColor: "border-[#008A00]/20"
    },
    FAILED: { 
      label: "Gagal", 
      icon: XCircle, 
      color: "text-[#D93025]", 
      bgColor: "bg-[#D93025]/10",
      borderColor: "border-[#D93025]/20"
    },
    CANCELLED: { 
      label: "Dibatalkan", 
      icon: XCircle, 
      color: "text-gray-600", 
      bgColor: "bg-gray-100",
      borderColor: "border-gray-200"
    },
    REFUNDED: { 
      label: "Dikembalikan", 
      icon: AlertCircle, 
      color: "text-purple-600", 
      bgColor: "bg-purple-100",
      borderColor: "border-purple-200"
    },
  };
  return configs[status] || configs.PENDING;
};

const getPaymentMethodLabel = (method: string) => ({ MIDTRANS: "Midtrans", E_WALLET: "E-Wallet", VIRTUAL_ACCOUNT: "Virtual Account", QRIS: "QRIS", BANK_TRANSFER: "Transfer Bank" }[method] || method);

export default function TransactionDetail() {
  const params = useParams();
  const transactionId = params.id as string;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  const fetchTransaction = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) { setError("Silakan login terlebih dahulu"); return; }
      const response = await fetch(`${API_BASE_URL}/payments/${transactionId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) { if (response.status === 404) { setError("Transaksi tidak ditemukan"); return; } throw new Error("Gagal mengambil detail transaksi"); }
      const data = await response.json();
      setTransaction(data.transaction);
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
    finally { setLoading(false); setRefreshing(false); }
  }, [transactionId, getAuthToken]);

  useEffect(() => { fetchTransaction(); }, [fetchTransaction]);
  const handleRefresh = async () => { setRefreshing(true); await fetchTransaction(); };

  if (loading) return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-[#005EB8]" />
        </div>
      </UserLayout>
    </ProtectedRoute>
  );

  if (error || !transaction) return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700 max-w-md mx-auto mt-8">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-[#D93025] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{error || "Transaksi tidak ditemukan"}</h2>
            <Link href="/user/transaction" className="inline-block mt-4">
              <Button className="bg-[#005EB8] hover:bg-[#004A93]">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Riwayat
              </Button>
            </Link>
          </CardContent>
        </Card>
      </UserLayout>
    </ProtectedRoute>
  );

  const statusConfig = getStatusConfig(transaction.status);
  const StatusIcon = statusConfig.icon;
  const isPaid = transaction.status === "SUCCESS" || transaction.status === "PAID";
  const isPending = transaction.status === "PENDING";

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/user/transaction">
                <Button variant="ghost" size="icon" className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Transaksi</h1>
                <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">ID: {transaction.order_id}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="border-gray-300 dark:border-gray-600"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Status Card */}
          <Card className={`rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 ${statusConfig.borderColor}`}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-[#005EB8]/10">
                    <StatusIcon className={`h-8 w-8 ${statusConfig.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status Transaksi</p>
                    <p className={`text-2xl font-bold ${statusConfig.color}`}>{statusConfig.label}</p>
                    {isPending && transaction.expired_at && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Kedaluwarsa: {formatDate(transaction.expired_at)}
                      </p>
                    )}
                    {isPaid && transaction.paid_at && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Dibayar: {formatDate(transaction.paid_at)}
                      </p>
                    )}
                  </div>
                </div>
                {isPending && transaction.payment_url && (
                  <a href={transaction.payment_url} target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="bg-[#005EB8] hover:bg-[#004A93]">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Bayar Sekarang
                    </Button>
                  </a>
                )}
                {isPaid && (
                  <Link href={`/user/courses/${transaction.course.id}/player`}>
                    <Button size="lg" className="bg-[#008A00] hover:bg-[#007800]">
                      <BookOpen className="h-5 w-5 mr-2" />
                      Akses Kursus
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Course & User Info */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                  <BookOpen className="h-5 w-5 text-[#005EB8]" />
                  Informasi Kursus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
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
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{transaction.course.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {transaction.course.mentor?.user?.full_name || "Instruktur"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {transaction.course.category && (
                        <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                          {transaction.course.category.name}
                        </Badge>
                      )}
                      <Badge variant="outline" className="border-[#005EB8] text-[#005EB8]">
                        {getLevelLabel(transaction.course.level)}
                      </Badge>
                      <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                        {formatDuration(transaction.course.total_duration)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Link href={`/courses/${transaction.course.slug || transaction.course.id}`}>
                    <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Lihat Detail Kursus
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                  <User className="h-5 w-5 text-[#005EB8]" />
                  Informasi Pembeli
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#005EB8]/10 rounded">
                    <User className="h-4 w-4 text-[#005EB8]" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{transaction.user.full_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F4B400]/10 rounded">
                    <Mail className="h-4 w-4 text-[#F4B400]" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">{transaction.user.email}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Details */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                <Receipt className="h-5 w-5 text-[#005EB8]" />
                Detail Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Order ID</span>
                    <span className="font-mono font-medium text-gray-900 dark:text-white">{transaction.order_id}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Metode Pembayaran</span>
                    <span className="font-medium text-gray-900 dark:text-white">{getPaymentMethodLabel(transaction.payment_method)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Tanggal Transaksi</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(transaction.created_at)}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Harga Kursus</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(transaction.amount).replace('IDR', 'Rp')}
                    </span>
                  </div>
                  {transaction.discount > 0 && (
                    <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Diskon</span>
                      <span className="font-medium text-[#008A00]">
                        -{formatCurrency(transaction.discount).replace('IDR', 'Rp')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-4 bg-gray-50 dark:bg-gray-800 rounded-lg px-4">
                    <span className="font-semibold text-gray-900 dark:text-white">Total Pembayaran</span>
                    <span className="font-bold text-[#005EB8] text-xl">
                      {formatCurrency(transaction.total_amount).replace('IDR', 'Rp')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                <Calendar className="h-5 w-5 text-[#005EB8]" />
                Timeline Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-[#008A00]"></div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Transaksi Dibuat</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(transaction.created_at)}</p>
                  </div>
                </div>
                {isPaid && transaction.paid_at && (
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-[#008A00]"></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Pembayaran Berhasil</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(transaction.paid_at)}</p>
                    </div>
                  </div>
                )}
                {isPending && (
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-[#F4B400] animate-pulse"></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Menunggu Pembayaran</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Silakan selesaikan pembayaran</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/user/transaction">
              <Button variant="outline" className="border-gray-300 dark:border-gray-600">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Riwayat
              </Button>
            </Link>
            <Link href="/courses">
              <Button variant="outline" className="border-gray-300 dark:border-gray-600">
                <Sparkles className="h-4 w-4 mr-2 text-[#005EB8]" />
                Jelajahi Kursus Lain
              </Button>
            </Link>
          </div>
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}