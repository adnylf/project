"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Award,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Upload,
  FileText,
  Eye,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  Edit,
  PenTool,
  Image as ImageIcon,
  Settings,
  Save,
  Trash2,
} from "lucide-react";
import MentorLayout from "@/components/mentor/mentor-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Link from "next/link";

const API_BASE_URL = "http://localhost:3000/api";

interface Certificate {
  id: string;
  certificate_number: string;
  status: "PENDING" | "ISSUED" | "REVOKED";
  issued_at: string | null;
  pdf_url: string | null;
  created_at: string;
  user: { id: string; full_name: string; email: string; avatar_url?: string };
  course: { id: string; title: string };
}

interface Course {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  status: string;
  _count?: { enrollments: number };
}

interface Template {
  id: string;
  key: string;
  value: string;
  created_at: string;
}

interface MentorConfig {
  signature_url: string | null;
  selected_template_id: string | null;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "ISSUED":
      return <Badge className="bg-[#008A00] text-white border border-[#008A00] pointer-events-none"><CheckCircle className="h-3 w-3 mr-1" />Terbit</Badge>;
    case "PENDING":
      return <Badge className="bg-[#F4B400] text-[#1A1A1A] border border-[#F4B400] pointer-events-none"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    case "REVOKED":
      return <Badge className="bg-[#D93025] text-white border border-[#D93025] pointer-events-none"><XCircle className="h-3 w-3 mr-1" />Dicabut</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none">{status}</Badge>;
  }
};

export default function MentorCertificatesPage() {
  const [activeTab, setActiveTab] = useState("certificates");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Certificates state
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Signature & Config state
  const [config, setConfig] = useState<MentorConfig>({ signature_url: null, selected_template_id: null });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();

        // Fetch mentor's courses
        const coursesRes = await fetch(`${API_BASE_URL}/mentors/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (coursesRes.ok) {
          const data = await coursesRes.json();
          setCourses(data.courses || []);
        }

        // Fetch certificates for mentor's courses
        const certsRes = await fetch(`${API_BASE_URL}/mentor/certificates`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (certsRes.ok) {
          const data = await certsRes.json();
          setCertificates(data.certificates || []);
        }

        // Fetch available templates
        const templatesRes = await fetch(`${API_BASE_URL}/admin/certificates/templates`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (templatesRes.ok) {
          const data = await templatesRes.json();
          setTemplates(data.templates || []);
        }

        // Fetch mentor config
        const configRes = await fetch(`${API_BASE_URL}/mentor/certificates/config`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (configRes.ok) {
          const data = await configRes.json();
          setConfig(data.config || { signature_url: null, selected_template_id: null });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getAuthToken]);

  // Parse template value
  const parseTemplate = (template: Template) => {
    try {
      return JSON.parse(template.value);
    } catch {
      return { name: "Unknown", content: "", is_default: false };
    }
  };

  // Filter certificates
  const filteredCertificates = certificates.filter(cert => {
    const matchesCourse = filterCourse === "all" || cert.course.id === filterCourse;
    const matchesStatus = filterStatus === "all" || cert.status === filterStatus;
    const matchesSearch = cert.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certificate_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCourse && matchesStatus && matchesSearch;
  });

  // Handle signature upload
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingSignature(true);
      setError(null);
      const token = getAuthToken();

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/mentor/certificates/signature`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal upload tanda tangan");
      }

      const data = await response.json();
      setConfig(prev => ({ ...prev, signature_url: data.signature_url }));
      setSuccess("Tanda tangan berhasil diupload");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload tanda tangan");
    } finally {
      setUploadingSignature(false);
    }
  };

  // Save config
  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      setError(null);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/mentor/certificates/config`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selected_template_id: config.selected_template_id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal menyimpan konfigurasi");
      }

      setSuccess("Konfigurasi berhasil disimpan");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan konfigurasi");
    } finally {
      setSaving(false);
    }
  };

  // Preview certificate
  const handlePreview = (template: Template) => {
    const parsed = parseTemplate(template);
    const content = parsed.content
      .replace(/\{\{STUDENT_NAME\}\}/g, "Nama Siswa")
      .replace(/\{\{COURSE_TITLE\}\}/g, "Judul Kursus")
      .replace(/\{\{MENTOR_NAME\}\}/g, "Nama Mentor")
      .replace(/\{\{ISSUED_DATE\}\}/g, formatDate(new Date().toISOString()))
      .replace(/\{\{CERTIFICATE_NUMBER\}\}/g, "CERT-2024-001")
      .replace(/\{\{SIGNATURE_IMAGE\}\}/g, config.signature_url ? `<img src="${config.signature_url}" alt="Signature" style="max-height:60px;"/>` : "");
    setPreviewContent(content);
    setPreviewDialogOpen(true);
  };

  // Stats
  const stats = {
    total: certificates.length,
    issued: certificates.filter(c => c.status === "ISSUED").length,
    pending: certificates.filter(c => c.status === "PENDING").length,
    courses: courses.filter(c => c.status === "PUBLISHED").length,
  };

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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Award className="h-8 w-8 text-[#005EB8]" />
                Sertifikat Siswa
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Kelola sertifikat dan tanda tangan untuk kursus Anda
              </p>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 flex items-center gap-2 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />{error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-600 flex items-center gap-2 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />{success}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#005EB8]/10">
                    <Award className="h-5 w-5 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Sertifikat</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#008A00]/10">
                    <CheckCircle className="h-5 w-5 text-[#008A00]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Terbit</p>
                    <p className="text-2xl font-bold text-[#008A00] dark:text-[#008A00]">{stats.issued}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#F4B400]/10">
                    <Clock className="h-5 w-5 text-[#F4B400]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-[#F4B400] dark:text-[#F4B400]">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#005EB8]/10">
                    <BookOpen className="h-5 w-5 text-[#005EB8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kursus Aktif</p>
                    <p className="text-2xl font-bold text-[#005EB8] dark:text-[#005EB8]">{stats.courses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="certificates">Daftar Sertifikat</TabsTrigger>
              <TabsTrigger value="settings">Pengaturan</TabsTrigger>
            </TabsList>

            {/* Certificates Tab */}
            <TabsContent value="certificates" className="space-y-4">
              {/* Filter */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input placeholder="Cari siswa atau nomor sertifikat..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                    </div>
                    <Select value={filterCourse} onValueChange={setFilterCourse}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Kursus" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Kursus</SelectItem>
                        {courses.map(course => (
                          <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="ISSUED">Terbit</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="REVOKED">Dicabut</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Certificates List */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Sertifikat Kursus Anda</CardTitle>
                  <CardDescription>Sertifikat yang diterbitkan untuk siswa yang menyelesaikan kursus</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredCertificates.length === 0 ? (
                    <div className="text-center py-12">
                      <Award className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Belum Ada Sertifikat</h3>
                      <p className="text-gray-500 dark:text-gray-400">Sertifikat akan muncul setelah siswa menyelesaikan kursus Anda</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredCertificates.map((cert) => (
                        <div key={cert.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={cert.user.avatar_url} />
                                <AvatarFallback className="bg-[#005EB8] text-white">
                                  {cert.user.full_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{cert.user.full_name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{cert.course.title}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  No: {cert.certificate_number} • {formatDate(cert.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {getStatusBadge(cert.status)}
                              {/* Button Detail - Style diubah seperti button Lihat Semua di dashboard */}
                              <Link href={`/mentor/certificates/${cert.id}`}>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                                >
                                  <Eye className="h-4 w-4 mr-1" />Detail
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Signature Upload */}
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                      <PenTool className="h-5 w-5 text-[#005EB8]" />
                      Tanda Tangan Digital
                    </CardTitle>
                    <CardDescription>
                      Upload gambar tanda tangan Anda untuk sertifikat
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center border-gray-300 dark:border-gray-600">
                      {config.signature_url ? (
                        <div className="space-y-4">
                          <img src={config.signature_url} alt="Signature" className="max-h-24 mx-auto" />
                          {/* Button Ganti Tanda Tangan - Style diubah seperti button Lihat Semua di dashboard */}
                          <Button 
                            variant="outline" 
                            onClick={() => signatureInputRef.current?.click()} 
                            disabled={uploadingSignature} 
                            className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                          >
                            {uploadingSignature ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                            Ganti Tanda Tangan
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <ImageIcon className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto" />
                          <p className="text-gray-500 dark:text-gray-400">Belum ada tanda tangan</p>
                          <Button onClick={() => signatureInputRef.current?.click()} disabled={uploadingSignature} className="bg-[#005EB8] hover:bg-[#004A93] text-white">
                            {uploadingSignature ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                            Upload Tanda Tangan
                          </Button>
                        </div>
                      )}
                    </div>
                    <input ref={signatureInputRef} type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Format: PNG, JPG dengan background transparan direkomendasikan. Max 2MB.
                    </p>
                  </CardContent>
                </Card>

                {/* Template Selection */}
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                      <FileText className="h-5 w-5 text-[#005EB8]" />
                      Template Sertifikat
                    </CardTitle>
                    <CardDescription>
                      Pilih template yang akan digunakan untuk sertifikat kursus Anda
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {templates.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">Belum ada template tersedia</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Hubungi admin untuk membuat template</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {templates.map(template => {
                          const parsed = parseTemplate(template);
                          const isSelected = config.selected_template_id === template.id;
                          return (
                            <div key={template.id} className={`border rounded-lg p-4 cursor-pointer transition-all ${isSelected ? "border-[#005EB8] bg-[#005EB8]/5" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`} onClick={() => setConfig(prev => ({ ...prev, selected_template_id: template.id }))}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-4 h-4 rounded-full border-2 ${isSelected ? "border-[#005EB8] bg-[#005EB8]" : "border-gray-300 dark:border-gray-600"}`}>
                                    {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{parsed.name}</p>
                                    {parsed.is_default && (
                                      <Badge className="bg-[#005EB8]/10 text-[#005EB8] border border-[#005EB8]/20 pointer-events-none text-xs">
                                        Default
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {/* Button Ikon Mata Preview - Style diubah seperti button Lihat Semua di dashboard */}
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={(e) => { e.stopPropagation(); handlePreview(template); }}
                                  className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <Button onClick={handleSaveConfig} disabled={saving} className="w-full bg-[#005EB8] hover:bg-[#004A93] text-white">
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Simpan Pengaturan
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Info */}
              <Card className="rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Informasi Sertifikat
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 ml-6 list-disc">
                    <li>Sertifikat akan otomatis digenerate ketika siswa menyelesaikan 100% materi kursus</li>
                    <li>Tanda tangan Anda akan ditampilkan di bagian bawah sertifikat</li>
                    <li>Template sertifikat disediakan oleh admin platform</li>
                    <li>Siswa dapat mengunduh sertifikat dalam format PDF</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview Template</DialogTitle>
            </DialogHeader>
            <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
              <iframe srcDoc={previewContent} className="w-full h-[600px] border-0" />
            </div>
          </DialogContent>
        </Dialog>
      </MentorLayout>
    </ProtectedRoute>
  );
}