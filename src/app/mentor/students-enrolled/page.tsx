"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Users,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BookOpen,
  Mail,
  User,
  GraduationCap,
  TrendingUp,
  Clock,
  Filter,
} from "lucide-react";
import MentorLayout from "@/components/mentor/mentor-layout";
import ProtectedRoute from "@/components/auth/protected-route";

const API_BASE_URL = "http://localhost:3000/api";

interface Student {
  id: string;
  progress: number;
  created_at: string;
  last_accessed_at: string | null;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  course: {
    id: string;
    title: string;
    slug: string;
  };
}

interface Course {
  id: string;
  title: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTimeAgo = (dateString: string | null) => {
  if (!dateString) return "Belum pernah";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Baru saja";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
  return formatDate(dateString);
};

export default function StudentsEnrolledPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  // Fetch courses for filter
  const fetchCourses = useCallback(async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/mentors/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  }, [getAuthToken]);

  // Fetch students
  const fetchStudents = useCallback(async () => {
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

      const response = await fetch(`${API_BASE_URL}/mentors/students?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Gagal memuat data siswa");

      const data = await response.json();
      setStudents(data.students || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Filter students locally
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.course.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCourse = courseFilter === "all" || student.course.id === courseFilter;

    return matchesSearch && matchesCourse;
  });

  // Stats
  const totalStudents = pagination.total;
  const activeStudents = students.filter((s) => s.last_accessed_at && new Date(s.last_accessed_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
  const avgProgress = students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length) : 0;
  const completedStudents = students.filter((s) => s.progress >= 100).length;

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-[#008A00]";
    if (progress >= 50) return "bg-[#F4B400]";
    if (progress >= 25) return "bg-[#005EB8]";
    return "bg-gray-300";
  };

  if (loading && students.length === 0) {
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <Users className="h-8 w-8 text-[#005EB8]" />
              Siswa Terdaftar
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Kelola dan pantau progres siswa yang mengikuti kursus Anda
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#005EB8]/10">
                    <Users className="h-6 w-6 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Siswa</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStudents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#008A00]/10">
                    <TrendingUp className="h-6 w-6 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Aktif (7 hari)</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeStudents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F4B400]/10">
                    <Clock className="h-6 w-6 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rata-rata Progress</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgProgress}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#D93025]/10">
                    <GraduationCap className="h-6 w-6 text-[#D93025]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Selesai</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedStudents}</p>
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
                    placeholder="Cari nama, email, atau kursus..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                  <SelectTrigger className="w-full md:w-64">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter berdasarkan kursus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kursus</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <Card className="rounded-lg border bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700">
              <CardContent className="p-4">
                {error}
              </CardContent>
            </Card>
          )}

          {/* Students List */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white text-xl font-bold">
                <span>Daftar Siswa</span>
                <Badge className="bg-[#005EB8] text-white border border-[#005EB8] pointer-events-none">{filteredStudents.length} siswa</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Belum Ada Siswa</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm || courseFilter !== "all"
                      ? "Tidak ada siswa yang cocok dengan filter"
                      : "Siswa akan muncul setelah ada yang mendaftar kursus Anda"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStudents.map((student) => (
                    <Card
                      key={student.id}
                      className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700"
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          {/* Avatar & Info */}
                          <div className="flex items-center gap-4 flex-1">
                            <div className="relative">
                              {student.user.avatar_url ? (
                                <img
                                  src={student.user.avatar_url}
                                  alt={student.user.full_name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-[#005EB8] flex items-center justify-center text-white font-semibold text-lg">
                                  {student.user.full_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              {student.progress >= 100 && (
                                <div className="absolute -bottom-1 -right-1 bg-[#008A00] rounded-full p-0.5">
                                  <GraduationCap className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                {student.user.full_name}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                                <Mail className="h-3 w-3" />
                                {student.user.email}
                              </p>
                            </div>
                          </div>

                          {/* Course */}
                          <div className="md:w-48">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Kursus</p>
                            <p className="font-medium text-gray-900 dark:text-white truncate flex items-center gap-1">
                              <BookOpen className="h-3 w-3 flex-shrink-0" />
                              {student.course.title}
                            </p>
                          </div>

                          {/* Progress */}
                          <div className="md:w-32">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Progress</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${getProgressColor(student.progress)} transition-all`}
                                  style={{ width: `${student.progress}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium w-10 text-right text-gray-900 dark:text-white">{student.progress}%</span>
                            </div>
                          </div>

                          {/* Dates */}
                          <div className="md:w-36 text-sm">
                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <Calendar className="h-3 w-3" />
                              Daftar: {formatDate(student.created_at)}
                            </div>
                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <Clock className="h-3 w-3" />
                              Aktif: {formatTimeAgo(student.last_accessed_at)}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="md:w-24">
                            {student.progress >= 100 ? (
                              <Badge className="bg-[#008A00] text-white border border-[#008A00] pointer-events-none">Selesai</Badge>
                            ) : student.progress > 0 ? (
                              <Badge className="bg-[#005EB8] text-white border border-[#005EB8] pointer-events-none">Berlangsung</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">Belum Mulai</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Menampilkan {(pagination.page - 1) * pagination.limit + 1} -{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} siswa
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1 || loading}
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                      className="border-gray-300 dark:border-gray-600"
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
                            className={pagination.page === pageNum 
                              ? "bg-[#005EB8] hover:bg-[#004A93] text-white" 
                              : "border-gray-300 dark:border-gray-600"
                            }
                            onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.totalPages || loading}
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                      className="border-gray-300 dark:border-gray-600"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MentorLayout>
    </ProtectedRoute>
  );
}