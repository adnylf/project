"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Loader2,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank,
  Receipt,
  Sparkles,
  Users,
  Award,
} from "lucide-react";
import MentorLayout from "@/components/mentor/mentor-layout";
import ProtectedRoute from "@/components/auth/protected-route";

const API_BASE_URL = "http://localhost:3000/api";

interface RevenueData {
  total_revenue: number;
  transactions_count: number;
  monthly_revenue: Record<string, number>;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatShortCurrency = (amount: number) => {
  if (amount >= 1000000000) return `Rp ${(amount / 1000000000).toFixed(1)}M`;
  if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1)}Jt`;
  if (amount >= 1000) return `Rp ${(amount / 1000).toFixed(0)}Rb`;
  return `Rp ${amount}`;
};

const getMonthName = (monthKey: string) => {
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
};

const getShortMonthName = (monthKey: string) => {
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("id-ID", { month: "short" });
};

export default function RevenuePage() {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  const fetchRevenue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        setError("Silakan login terlebih dahulu");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/mentors/revenue`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Gagal memuat data pendapatan");

      const data = await response.json();
      setRevenueData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  // Get available years from data
  const availableYears = revenueData
    ? [...new Set(Object.keys(revenueData.monthly_revenue).map((k) => k.split("-")[0]))].sort((a, b) => b.localeCompare(a))
    : [new Date().getFullYear().toString()];

  // Filter monthly data by selected year
  const filteredMonthlyRevenue = revenueData
    ? Object.entries(revenueData.monthly_revenue)
        .filter(([key]) => key.startsWith(selectedYear))
        .sort(([a], [b]) => a.localeCompare(b))
    : [];

  // Calculate stats for selected year
  const yearlyTotal = filteredMonthlyRevenue.reduce((sum, [, amount]) => sum + amount, 0);
  const avgMonthly = filteredMonthlyRevenue.length > 0 ? yearlyTotal / filteredMonthlyRevenue.length : 0;

  // Get current and previous month for comparison
  const currentMonth = new Date().toISOString().slice(0, 7);
  const prevMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);
  const currentMonthRevenue = revenueData?.monthly_revenue[currentMonth] || 0;
  const prevMonthRevenue = revenueData?.monthly_revenue[prevMonth] || 0;
  const monthlyGrowth = prevMonthRevenue > 0 ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;

  // Find max for chart scaling
  const maxRevenue = Math.max(...filteredMonthlyRevenue.map(([, amount]) => amount), 1);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["MENTOR"]}>
        <MentorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-[#005EB8]" />
          </div>
        </MentorLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["MENTOR"]}>
      <MentorLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-[#005EB8]" />
                Pendapatan
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Pantau dan kelola pendapatan dari kursus Anda
              </p>
            </div>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-40 border-gray-300 dark:border-gray-700 focus:border-[#005EB8] focus:ring-[#005EB8]">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    Tahun {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#005EB8]/10">
                    <Wallet className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Pendapatan</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatShortCurrency(revenueData?.total_revenue || 0)}
                    </p>
                  </div>
                </div>
                <Badge className="mt-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700">
                  All Time
                </Badge>
              </CardContent>
            </Card>

            {/* This Year */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <PiggyBank className="h-6 w-6 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tahun Ini</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatShortCurrency(yearlyTotal)}
                    </p>
                  </div>
                </div>
                <Badge className="mt-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700">
                  {selectedYear}
                </Badge>
              </CardContent>
            </Card>

            {/* This Month */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <CreditCard className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Bulan Ini</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatShortCurrency(currentMonthRevenue)}
                    </p>
                    {monthlyGrowth !== 0 && (
                      <div className={`flex items-center gap-1 text-xs mt-1 ${monthlyGrowth > 0 ? "text-green-600" : "text-red-600"}`}>
                        {monthlyGrowth > 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {Math.abs(monthlyGrowth).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transactions */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#D93025]/10">
                    <Receipt className="h-6 w-6 text-[#D93025]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Transaksi</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {revenueData?.transactions_count || 0}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Transaksi berhasil</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-bold">
                <BarChart3 className="h-5 w-5 text-[#005EB8]" />
                Grafik Pendapatan Bulanan
              </CardTitle>
              <CardDescription>
                Pendapatan per bulan untuk tahun {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredMonthlyRevenue.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Belum ada data pendapatan untuk tahun ini</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Bar Chart */}
                  <div className="flex items-end gap-2 h-64">
                    {/* Generate all 12 months */}
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthKey = `${selectedYear}-${String(i + 1).padStart(2, "0")}`;
                      const amount = revenueData?.monthly_revenue[monthKey] || 0;
                      const height = maxRevenue > 0 ? (amount / maxRevenue) * 100 : 0;
                      const isCurrentMonth = monthKey === currentMonth;

                      return (
                        <div key={monthKey} className="flex-1 flex flex-col items-center">
                          <div className="relative w-full flex justify-center mb-2 h-48">
                            <div
                              className={`w-full max-w-12 rounded-t-lg transition-all ${
                                isCurrentMonth
                                  ? "bg-[#005EB8]"
                                  : amount > 0
                                  ? "bg-[#005EB8]/70 hover:bg-[#005EB8]/90"
                                  : "bg-gray-200 dark:bg-gray-700"
                              }`}
                              style={{ height: `${Math.max(height, amount > 0 ? 5 : 2)}%` }}
                              title={`${getMonthName(monthKey)}: ${formatCurrency(amount)}`}
                            />
                            {amount > 0 && (
                              <span className="absolute -top-6 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {formatShortCurrency(amount)}
                              </span>
                            )}
                          </div>
                          <span className={`text-xs ${isCurrentMonth ? "font-bold text-[#005EB8]" : "text-gray-500 dark:text-gray-400"}`}>
                            {getShortMonthName(monthKey)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Card className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <CardContent className="p-3 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Tahun {selectedYear}</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(yearlyTotal)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <CardContent className="p-3 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Rata-rata per Bulan</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(avgMonthly)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <CardContent className="p-3 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Bulan Tertinggi</p>
                        <p className="text-lg font-bold text-[#008A00]">
                          {formatCurrency(maxRevenue)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <CardContent className="p-3 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Bulan Aktif</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {filteredMonthlyRevenue.filter(([, a]) => a > 0).length} bulan
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Breakdown Table */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white text-xl font-bold">Rincian Pendapatan Bulanan</CardTitle>
              <CardDescription>Detail pendapatan per bulan</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredMonthlyRevenue.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">Tidak ada data pendapatan</p>
              ) : (
                <div className="space-y-3">
                  {filteredMonthlyRevenue
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([monthKey, amount], index) => {
                      const prevMonthKey = filteredMonthlyRevenue[index + 1]?.[0];
                      const prevAmount = prevMonthKey ? revenueData?.monthly_revenue[prevMonthKey] || 0 : 0;
                      const growth = prevAmount > 0 ? ((amount - prevAmount) / prevAmount) * 100 : 0;

                      return (
                        <div
                          key={monthKey}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-[#005EB8]/10 rounded-lg">
                              <Calendar className="h-5 w-5 text-[#005EB8]" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {getMonthName(monthKey)}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {monthKey === currentMonth ? "Bulan ini" : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {growth !== 0 && index < filteredMonthlyRevenue.length - 1 && (
                              <div
                                className={`flex items-center gap-1 text-sm ${
                                  growth > 0 ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {growth > 0 ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                                {Math.abs(growth).toFixed(1)}%
                              </div>
                            )}
                            <p className="text-lg font-bold text-gray-900 dark:text-white min-w-32 text-right">
                              {formatCurrency(amount)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="rounded-lg border bg-gradient-to-br from-[#008A00]/10 to-[#006600]/5 border-[#008A00] shadow-sm transition-all duration-300 hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#008A00]/20 rounded-lg">
                  <Sparkles className="h-5 w-5 text-[#008A00]" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Tips Meningkatkan Pendapatan
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <Card className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="p-1 bg-[#005EB8]/10 rounded">
                        <Users className="h-4 w-4 text-[#005EB8]" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Buat kursus berkualitas tinggi dengan materi yang up-to-date
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="p-1 bg-[#008A00]/10 rounded">
                        <TrendingUp className="h-4 w-4 text-[#008A00]" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Promosikan kursus Anda di media sosial dan komunitas
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="p-1 bg-[#F4B400]/10 rounded">
                        <Award className="h-4 w-4 text-[#F4B400]" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Berikan respon cepat terhadap pertanyaan siswa
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </MentorLayout>
    </ProtectedRoute>
  );
}