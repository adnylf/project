"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Clock,
  Loader2,
  BookOpen,
  CheckCircle,
  PlayCircle,
  Award,
  Calendar,
  User,
  FileText,
  Video,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Lock,
  Circle,
  Sparkles,
  BarChart3,
} from "lucide-react";
import UserLayout from "@/components/user/user-layout";
import ProtectedRoute from "@/components/auth/protected-route";

const API_BASE_URL = "http://localhost:3000/api";

interface Material {
  id: string;
  title: string;
  type: string;
  duration: number;
  order: number;
}

interface Section {
  id: string;
  title: string;
  order: number;
  materials: Material[];
}

interface ProgressRecord {
  id: string;
  material_id: string;
  is_completed: boolean;
  material: { id: string; title: string; type: string };
}

interface Enrollment {
  id: string;
  status: string;
  progress: number;
  completed_at: string | null;
  expires_at: string | null;
  last_accessed_at: string | null;
  created_at: string;
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnail: string | null;
    total_duration: number;
    total_lectures: number;
    level: string;
    category: { id: string; name: string };
    mentor: { user: { full_name: string; avatar_url: string | null } };
    sections: Section[];
  };
  certificate: { id: string; certificate_number: string; status: string; issued_at: string } | null;
  progress_records: ProgressRecord[];
  stats: { totalMaterials: number; completedMaterials: number; progressPercentage: number };
}

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}j ${mins}m` : `${mins}m`;
};

const getMaterialIcon = (type: string) => {
  switch (type) {
    case "VIDEO": return Video;
    case "DOCUMENT": return FileText;
    case "QUIZ": return BookOpen;
    default: return FileText;
  }
};

const getStatusBadge = (status: string, progress: number) => {
  if (progress >= 100) return { 
    label: "Selesai", 
    className: "bg-[#008A00] text-white border border-[#008A00] pointer-events-none", 
    icon: CheckCircle 
  };
  if (status === "ACTIVE") return { 
    label: "Aktif", 
    className: "bg-[#005EB8] text-white border border-[#005EB8] pointer-events-none", 
    icon: PlayCircle 
  };
  if (status === "EXPIRED") return { 
    label: "Kadaluarsa", 
    className: "bg-[#D93025] text-white border border-[#D93025] pointer-events-none", 
    icon: Lock 
  };
  if (status === "SUSPENDED") return { 
    label: "Ditangguhkan", 
    className: "bg-[#F4B400] text-[#1A1A1A] border border-[#F4B400] pointer-events-none", 
    icon: Circle 
  };
  return { 
    label: status, 
    className: "bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none", 
    icon: Circle 
  };
};

const getLevelLabel = (level: string) => {
  const labels: Record<string, string> = { BEGINNER: "Pemula", INTERMEDIATE: "Menengah", ADVANCED: "Lanjutan", ALL_LEVELS: "Semua Level" };
  return labels[level] || level;
};

export default function EnrollmentDetail() {
  const params = useParams();
  const router = useRouter();
  const enrollmentId = params.enrollmentId as string;
  
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  useEffect(() => {
    const fetchEnrollment = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        if (!token) { setError("Silakan login terlebih dahulu"); return; }
        
        const response = await fetch(`${API_BASE_URL}/users/enrollments/${enrollmentId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("Gagal mengambil detail enrollment");
        
        const data = await response.json();
        setEnrollment(data.enrollment);
        // Expand first section by default
        if (data.enrollment?.course?.sections?.length > 0) {
          setExpandedSections(new Set([data.enrollment.course.sections[0].id]));
        }
      } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
      finally { setLoading(false); }
    };
    
    if (enrollmentId) fetchEnrollment();
  }, [enrollmentId, getAuthToken]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const isMaterialCompleted = (materialId: string) => {
    return enrollment?.progress_records.some((p) => p.material_id === materialId && p.is_completed) || false;
  };

  if (loading) return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-[#005EB8]" />
        </div>
      </UserLayout>
    </ProtectedRoute>
  );

  if (error || !enrollment) return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">{error || "Enrollment tidak ditemukan"}</p>
              <Button 
                onClick={() => router.push("/user/enrollments")} 
                variant="outline"
                className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Enrollments
              </Button>
            </CardContent>
          </Card>
        </div>
      </UserLayout>
    </ProtectedRoute>
  );

  const statusBadge = getStatusBadge(enrollment.status, enrollment.stats.progressPercentage);
  const StatusIcon = statusBadge.icon;

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <UserLayout>
        <div className="space-y-8">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => router.push("/user/enrollments")} 
            className="gap-2 text-[#005EB8] hover:text-[#004A93] hover:bg-[#005EB8]/10 dark:text-[#005EB8] dark:hover:bg-[#005EB8]/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Enrollments
          </Button>

          {/* Course Header */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="relative w-full md:w-80 aspect-video md:aspect-auto md:h-44 flex-shrink-0">
                {enrollment.course.thumbnail ? (
                  <img
                    src={enrollment.course.thumbnail}
                    alt={enrollment.course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <CardContent className="flex-1 p-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge className={statusBadge.className}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusBadge.label}
                  </Badge>
                  <Badge className="bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20 pointer-events-none">
                    {getLevelLabel(enrollment.course.level)}
                  </Badge>
                  <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                    {enrollment.course.category.name}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{enrollment.course.title}</h1>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-4">
                  <User className="h-4 w-4" />
                  <span>oleh {enrollment.course.mentor.user.full_name}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDuration(enrollment.course.total_duration)}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {enrollment.stats.totalMaterials} materi
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Enroll {formatDate(enrollment.created_at)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                    <Link href={`/user/courses/${enrollment.course.id}/player`}>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Lanjut Belajar
                    </Link>
                  </Button>
                  {enrollment.certificate && (
                    <Button 
                      variant="outline" 
                      asChild
                      className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                    >
                      <Link href={`/user/certificates/${enrollment.certificate.id}`}>
                        <Award className="h-4 w-4 mr-2" />
                        Lihat Sertifikat
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Progress Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="text-center flex flex-col items-center justify-center min-h-[180px]">
                  <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200 dark:text-gray-700" />
                      <circle 
                        cx="48" 
                        cy="48" 
                        r="40" 
                        stroke="currentColor" 
                        strokeWidth="8" 
                        fill="none" 
                        strokeDasharray={`${(enrollment.stats.progressPercentage / 100) * 251} 251`} 
                        className="text-[#005EB8]" 
                      />
                    </svg>
                    <span className="absolute text-2xl font-bold text-gray-900 dark:text-white">
                      {enrollment.stats.progressPercentage}%
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">Progress Keseluruhan</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Card Materi Selesai */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="text-center flex flex-col items-center justify-center min-h-[180px]">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="h-8 w-8 text-[#008A00] mr-2" />
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">{enrollment.stats.completedMaterials}</p>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">Materi Selesai</p>
                  <p className="text-sm text-gray-400 mt-1">dari {enrollment.stats.totalMaterials} total</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Card Materi Tersisa */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="text-center flex flex-col items-center justify-center min-h-[180px]">
                  <div className="flex items-center justify-center mb-2">
                    <BarChart3 className="h-8 w-8 text-[#005EB8] mr-2" />
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">{enrollment.stats.totalMaterials - enrollment.stats.completedMaterials}</p>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">Materi Tersisa</p>
                  <p className="text-sm text-gray-400 mt-1">untuk diselesaikan</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Certificate Card (if available) */}
          {enrollment.certificate && (
            <Card className="rounded-lg border bg-gradient-to-r from-[#005EB8] to-[#004A93] text-white shadow-sm transition-all duration-300 hover:shadow-md border-[#005EB8]">
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white">Sertifikat Tersedia!</h3>
                    <p className="text-white/90">No: {enrollment.certificate.certificate_number}</p>
                    <p className="text-sm text-white/80">Diterbitkan: {formatDate(enrollment.certificate.issued_at)}</p>
                  </div>
                </div>
                <Button 
                  asChild
                  className="bg-white text-[#005EB8] hover:bg-gray-100 font-semibold"
                >
                  <Link href={`/user/certificates/${enrollment.certificate.id}`}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Sertifikat
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Course Content */}
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <BookOpen className="h-5 w-5 text-[#005EB8]" />
                Konten Kursus
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {enrollment.course.sections.length} bagian • {enrollment.stats.totalMaterials} materi
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {enrollment.course.sections.map((section) => {
                  const isExpanded = expandedSections.has(section.id);
                  const completedInSection = section.materials.filter((m) => isMaterialCompleted(m.id)).length;
                  const sectionProgress = section.materials.length > 0 ? (completedInSection / section.materials.length) * 100 : 0;
                  
                  return (
                    <div key={section.id}>
                      <button 
                        onClick={() => toggleSection(section.id)} 
                        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-left">
                            <h4 className="font-medium text-gray-900 dark:text-white">{section.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {completedInSection}/{section.materials.length} materi selesai
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32 hidden md:block">
                            <Progress value={sectionProgress} className="h-2" />
                          </div>
                          <Badge 
                            className={sectionProgress >= 100 ? 
                              "bg-[#008A00] text-white border border-[#008A00] pointer-events-none" : 
                              "bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                            }
                          >
                            {Math.round(sectionProgress)}%
                          </Badge>
                          {isExpanded ? 
                            <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          }
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-6">
                          <div className="space-y-3">
                            {section.materials.map((material) => {
                              const MaterialIcon = getMaterialIcon(material.type);
                              const isCompleted = isMaterialCompleted(material.id);
                              
                              return (
                                <Card 
                                  key={material.id} 
                                  className={`rounded-lg border ${isCompleted ? "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        {isCompleted ? (
                                          <CheckCircle className="h-5 w-5 text-[#008A00]" />
                                        ) : (
                                          <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                                        )}
                                        <MaterialIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        <span className={isCompleted ? "text-green-800 dark:text-green-300 font-medium" : "text-gray-900 dark:text-white"}>
                                          {material.title}
                                        </span>
                                      </div>
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {formatDuration(material.duration)}
                                      </span>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-base text-gray-900 dark:text-white">Informasi Enrollment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tanggal Enroll</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatDate(enrollment.created_at)}</span>
                </div>
                {enrollment.last_accessed_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Terakhir Diakses</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(enrollment.last_accessed_at)}</span>
                  </div>
                )}
                {enrollment.completed_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tanggal Selesai</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(enrollment.completed_at)}</span>
                  </div>
                )}
                {enrollment.expires_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Kadaluarsa</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(enrollment.expires_at)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-base text-gray-900 dark:text-white">Tentang Kursus</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-5 mb-4">{enrollment.course.description}</p>
                <Button 
                  variant="link" 
                  asChild 
                  className="p-0 text-[#005EB8] hover:text-[#004A93] dark:text-[#005EB8] dark:hover:text-[#004A93]"
                >
                  <Link href={`/courses/${enrollment.course.slug}`}>
                    Lihat Detail Kursus
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </UserLayout>
    </ProtectedRoute>
  );
}