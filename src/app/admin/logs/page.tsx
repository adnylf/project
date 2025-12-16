"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Filter,
  Clock,
  FileText,
  LogIn,
  LogOut,
  UserPlus,
  BookOpen,
  CreditCard,
  Star,
  Settings,
  Trash2,
  Edit,
  Eye,
  Download,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Award,
} from "lucide-react";
import AdminLayout from "@/components/admin/admin-layout";
import ProtectedRoute from "@/components/auth/protected-route";

const API_BASE_URL = "http://localhost:3000/api";

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getActionIcon = (action: string) => {
  const actionLower = action.toLowerCase();
  if (actionLower.includes("login")) return <LogIn className="h-4 w-4" />;
  if (actionLower.includes("logout")) return <LogOut className="h-4 w-4" />;
  if (actionLower.includes("register") || actionLower.includes("apply")) return <UserPlus className="h-4 w-4" />;
  if (actionLower.includes("course") || actionLower.includes("enroll")) return <BookOpen className="h-4 w-4" />;
  if (actionLower.includes("transaction") || actionLower.includes("payment")) return <CreditCard className="h-4 w-4" />;
  if (actionLower.includes("review")) return <Star className="h-4 w-4" />;
  if (actionLower.includes("setting")) return <Settings className="h-4 w-4" />;
  if (actionLower.includes("delete")) return <Trash2 className="h-4 w-4" />;
  if (actionLower.includes("update") || actionLower.includes("edit")) return <Edit className="h-4 w-4" />;
  if (actionLower.includes("view")) return <Eye className="h-4 w-4" />;
  return <Activity className="h-4 w-4" />;
};

const getActionColor = (action: string) => {
  const actionLower = action.toLowerCase();
  if (actionLower.includes("login")) return "bg-[#008A00]/10 text-[#008A00] border border-[#008A00]/20 pointer-events-none";
  if (actionLower.includes("logout")) return "bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
  if (actionLower.includes("register") || actionLower.includes("apply")) return "bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20 pointer-events-none";
  if (actionLower.includes("delete")) return "bg-[#D93025]/10 text-[#D93025] border border-[#D93025]/20 pointer-events-none";
  if (actionLower.includes("update") || actionLower.includes("edit")) return "bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/20 pointer-events-none";
  if (actionLower.includes("create")) return "bg-purple-100 text-purple-700 border border-purple-300 pointer-events-none";
  if (actionLower.includes("enroll")) return "bg-indigo-100 text-indigo-700 border border-indigo-300 pointer-events-none";
  if (actionLower.includes("payment") || actionLower.includes("transaction")) return "bg-emerald-100 text-emerald-700 border border-emerald-300 pointer-events-none";
  return "bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
};

const formatActionLabel = (action: string) => {
  return action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [availableActions, setAvailableActions] = useState<string[]>([]);

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        setError("Silakan login terlebih dahulu");
        return;
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (actionFilter !== "all") params.append("action", actionFilter);
      if (entityFilter !== "all") params.append("entity_type", entityFilter);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const response = await fetch(`${API_BASE_URL}/admin/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Gagal memuat data logs");

      const data = await response.json();
      setLogs(data.logs || []);
      setPagination((prev) => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 0,
      }));
      if (data.filters?.actions) {
        setAvailableActions(data.filters.actions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, pagination.page, pagination.limit, actionFilter, entityFilter, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Filter logs locally by search term
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entity_type?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Get unique entity types from logs
  const entityTypes = [...new Set(logs.map((log) => log.entity_type).filter(Boolean))];

  // Stats
  const todayLogs = logs.filter((log) => {
    const logDate = new Date(log.created_at).toDateString();
    return logDate === new Date().toDateString();
  }).length;

  const loginCount = logs.filter((log) => log.action.toLowerCase().includes("login")).length;
  const errorCount = logs.filter((log) => log.action.toLowerCase().includes("error") || log.action.toLowerCase().includes("fail")).length;

  const handleReset = () => {
    setSearchTerm("");
    setActionFilter("all");
    setEntityFilter("all");
    setStartDate("");
    setEndDate("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Activity className="h-8 w-8 text-[#005EB8]" />
                Activity Logs
              </h1>
              <p className="text-gray-600">
                Pantau semua aktivitas pengguna dalam sistem
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#005EB8]/10">
                    <Activity className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Logs</p>
                    <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <Clock className="h-6 w-6 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hari Ini</p>
                    <p className="text-2xl font-bold text-gray-900">{todayLogs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <LogIn className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Login</p>
                    <p className="text-2xl font-bold text-gray-900">{loginCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#D93025]/10">
                    <AlertCircle className="h-6 w-6 text-[#D93025]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Errors</p>
                    <p className="text-2xl font-bold text-gray-900">{errorCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border rounded-xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="lg:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Cari user, action, entity..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-[#005EB8] focus:ring-[#005EB8]"
                  />
                </div>
                <Select 
                  value={actionFilter} 
                  onValueChange={(v) => { 
                    setActionFilter(v); 
                    setPagination(p => ({ ...p, page: 1 })); 
                  }}
                >
                  <SelectTrigger className="border-gray-300 focus:border-[#005EB8] focus:ring-[#005EB8]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Action</SelectItem>
                    {availableActions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {formatActionLabel(action)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={entityFilter} 
                  onValueChange={(v) => { 
                    setEntityFilter(v); 
                    setPagination(p => ({ ...p, page: 1 })); 
                  }}
                >
                  <SelectTrigger className="border-gray-300 focus:border-[#005EB8] focus:ring-[#005EB8]">
                    <FileText className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Entity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Entity</SelectItem>
                    {entityTypes.map((entity) => (
                      <SelectItem key={entity} value={entity!}>
                        {entity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => { 
                    setStartDate(e.target.value); 
                    setPagination(p => ({ ...p, page: 1 })); 
                  }}
                  placeholder="Dari tanggal"
                  className="border-gray-300 focus:border-[#005EB8] focus:ring-[#005EB8]"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => { 
                    setEndDate(e.target.value); 
                    setPagination(p => ({ ...p, page: 1 })); 
                  }}
                  placeholder="Sampai tanggal"
                  className="border-gray-300 focus:border-[#005EB8] focus:ring-[#005EB8]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-[#D93025]" />
              <p className="text-[#D93025]">{error}</p>
            </div>
          )}

          {/* Logs List */}
          <Card className="border rounded-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900">Log Aktivitas</CardTitle>
                <Badge className="bg-[#005EB8] text-white border border-[#005EB8] pointer-events-none">
                  {filteredLogs.length} dari {pagination.total}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading && logs.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#005EB8]" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak Ada Log</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || actionFilter !== "all" || entityFilter !== "all"
                      ? "Tidak ada log yang cocok dengan filter"
                      : "Belum ada aktivitas tercatat"}
                  </p>
                  {searchTerm || actionFilter !== "all" || entityFilter !== "all" && (
                    <Button 
                      variant="outline" 
                      onClick={handleReset}
                      className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10"
                    >
                      Reset Filter
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {log.user.avatar_url ? (
                            <img
                              src={log.user.avatar_url}
                              alt={log.user.full_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#005EB8] flex items-center justify-center text-white font-semibold">
                              {log.user.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="font-semibold text-gray-900">
                                  {log.user.full_name}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="text-sm text-gray-600">{log.user.email}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={getActionColor(log.action)}>
                                  <span className="mr-1">{getActionIcon(log.action)}</span>
                                  {formatActionLabel(log.action)}
                                </Badge>
                                {log.entity_type && (
                                  <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 text-xs">
                                    {log.entity_type}
                                    {log.entity_id && (
                                      <span className="text-gray-500 ml-1">
                                        #{log.entity_id.slice(0, 8)}
                                      </span>
                                    )}
                                  </Badge>
                                )}
                              </div>
                              {/* Metadata */}
                              {log.ip_address && (
                                <p className="text-xs text-gray-500 mt-2">
                                  IP: {log.ip_address}
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0 min-w-[140px]">
                              <p className="text-sm font-medium text-gray-900">
                                {formatDate(log.created_at)}
                              </p>
                              <p className="text-xs text-gray-600 flex items-center justify-end gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(log.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between mt-6 pt-6 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-4 md:mb-0">
                        Menampilkan {(pagination.page - 1) * pagination.limit + 1} -{" "}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} logs
                      </p>
                      <div className="flex items-center gap-2">
                        {/* Button Panah Kiri - Style diubah seperti button Lihat Semua di dashboard */}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page === 1 || loading}
                          onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                          className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            let pageNum = i + 1;
                            if (pagination.totalPages > 5) {
                              if (pagination.page > 3) pageNum = pagination.page - 2 + i;
                              if (pagination.page > pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={pagination.page === pageNum ? "default" : "outline"}
                                size="sm"
                                className={
                                  pagination.page === pageNum 
                                    ? "bg-[#005EB8] hover:bg-[#004A93] text-white" 
                                    : "border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                                }
                                onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        {/* Button Panah Kanan - Style diubah seperti button Lihat Semua di dashboard */}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page === pagination.totalPages || loading}
                          onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                          className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}