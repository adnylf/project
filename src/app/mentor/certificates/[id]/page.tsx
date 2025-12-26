"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Award,
  Loader2,
  ArrowLeft,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  User,
  BookOpen,
  Calendar,
  Hash,
  Mail,
  FileText,
} from "lucide-react";
import MentorLayout from "@/components/mentor/mentor-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CertificateTemplateModal } from "@/components/admin/certificate-modal";

interface Certificate {
  id: string;
  certificate_number: string;
  status: "PENDING" | "ISSUED" | "REVOKED";
  issued_at: string | null;
  revoked_at: string | null;
  revoke_reason: string | null;
  pdf_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  user: { 
    id: string; 
    full_name: string; 
    email: string; 
    avatar_url?: string;
  };
  course: { 
    id: string; 
    title: string;
    slug: string;
    thumbnail?: string;
  };
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "ISSUED":
      return <Badge className="bg-[#008A00] text-white border border-[#008A00] pointer-events-none text-base px-4 py-2"><CheckCircle className="h-4 w-4 mr-2" />Terbit</Badge>;
    case "PENDING":
      return <Badge className="bg-[#F4B400] text-[#1A1A1A] border border-[#F4B400] pointer-events-none text-base px-4 py-2"><Clock className="h-4 w-4 mr-2" />Pending</Badge>;
    case "REVOKED":
      return <Badge className="bg-[#D93025] text-white border border-[#D93025] pointer-events-none text-base px-4 py-2"><XCircle className="h-4 w-4 mr-2" />Dicabut</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800 border border-gray-300 pointer-events-none">{status}</Badge>;
  }
};

export default function MentorCertificateDetailPage() {
  const params = useParams();
  const certificateId = params.id as string;

  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: "", content: "", is_default: false });

  const getAuthToken = useCallback(() => typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null, []);

  // Fetch certificate detail
  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();

        const response = await fetch(`/api/mentor/certificates/${certificateId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Sertifikat tidak ditemukan");
          }
          throw new Error("Gagal memuat sertifikat");
        }

        const data = await response.json();
        setCertificate(data.certificate);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    if (certificateId) {
      fetchCertificate();
    }
  }, [certificateId, getAuthToken]);

  // Preview certificate - fetches real rendered HTML from API
  const handlePreview = async () => {
    try {
      setPreviewLoading(true);
      const token = getAuthToken();
      const response = await fetch(`/api/mentor/certificates/${certificateId}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplateForm({
          name: certificate?.certificate_number || "Preview Sertifikat",
          content: data.html || "",
          is_default: false,
        });
        setPreviewModalOpen(true);
      }
    } catch (err) {
      console.error("Preview error:", err);
    } finally {
      setPreviewLoading(false);
    }
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

  if (error || !certificate) {
    return (
      <ProtectedRoute allowedRoles={["MENTOR"]}>
        <MentorLayout>
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <AlertCircle className="h-16 w-16 text-[#D93025] mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{error || "Sertifikat tidak ditemukan"}</h2>
            <Link href="/mentor/certificates">
              <Button variant="outline" className="mt-4 border-gray-300 dark:border-gray-600">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </Link>
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
          <div className="flex items-center gap-4">
            <Link href="/mentor/certificates">
              {/* Button Panah Kiri - Style diubah seperti button Lihat Semua di dashboard */}
              <Button 
                variant="outline" 
                size="icon"
                className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Award className="h-8 w-8 text-[#005EB8]" />
                Detail Sertifikat
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Nomor: {certificate.certificate_number}
              </p>
            </div>
            <div className="flex gap-3">
              {/* Button Preview - Style diubah seperti button Lihat Semua di dashboard */}
              <Button 
                variant="outline" 
                onClick={handlePreview}
                disabled={previewLoading}
                className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
              >
                {previewLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                Preview
              </Button>
              {certificate.pdf_url && (
                <Button className="bg-[#005EB8] hover:bg-[#004A93] text-white" asChild>
                  <a href={certificate.pdf_url} target="_blank">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Status Banner */}
          <Card className={`rounded-lg border ${
            certificate.status === "ISSUED" ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" :
            certificate.status === "PENDING" ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" :
            "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-full ${
                    certificate.status === "ISSUED" ? "bg-green-100 dark:bg-green-800/50" :
                    certificate.status === "PENDING" ? "bg-yellow-100 dark:bg-yellow-800/50" :
                    "bg-red-100 dark:bg-red-800/50"
                  }`}>
                    <Award className={`h-8 w-8 ${
                      certificate.status === "ISSUED" ? "text-[#008A00]" :
                      certificate.status === "PENDING" ? "text-[#F4B400]" :
                      "text-[#D93025]"
                    }`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Status Sertifikat</h2>
                    <p className={`mt-1 ${
                      certificate.status === "ISSUED" ? "text-[#008A00]/80 dark:text-[#008A00]" :
                      certificate.status === "PENDING" ? "text-[#F4B400]/80 dark:text-[#F4B400]" :
                      "text-[#D93025]/80 dark:text-[#D93025]"
                    }`}>
                      {certificate.status === "ISSUED" && "Sertifikat telah diterbitkan dan dapat diunduh"}
                      {certificate.status === "PENDING" && "Sertifikat sedang dalam proses pembuatan"}
                      {certificate.status === "REVOKED" && `Sertifikat dicabut: ${certificate.revoke_reason || "Tidak ada alasan"}`}
                    </p>
                  </div>
                </div>
                {getStatusBadge(certificate.status)}
              </div>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Student Info */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                  <User className="h-5 w-5 text-[#005EB8]" />
                  Informasi Siswa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={certificate.user.avatar_url} />
                    <AvatarFallback className="bg-[#005EB8] text-white text-xl">
                      {certificate.user.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{certificate.user.full_name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Mail className="h-4 w-4" /> {certificate.user.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Info */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                  <BookOpen className="h-5 w-5 text-[#005EB8]" />
                  Informasi Kursus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {certificate.course.thumbnail ? (
                    <img src={certificate.course.thumbnail} alt={certificate.course.title} className="w-20 h-14 object-cover rounded-lg" />
                  ) : (
                    <div className="w-20 h-14 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{certificate.course.title}</h3>
                    <Link href={`/mentor/courses/${certificate.course.id}`} className="text-[#005EB8] hover:underline text-sm">
                      Lihat Kursus →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Certificate Details */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                  <FileText className="h-5 w-5 text-[#005EB8]" />
                  Detail Sertifikat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Hash className="h-4 w-4" /> Nomor Sertifikat
                      </span>
                      <span className="font-mono font-medium text-gray-900 dark:text-white">{certificate.certificate_number}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Dibuat
                      </span>
                      <span className="text-gray-900 dark:text-white">{formatDate(certificate.created_at)}</span>
                    </div>
                    {certificate.issued_at && (
                      <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" /> Diterbitkan
                        </span>
                        <span className="text-gray-900 dark:text-white">{formatDate(certificate.issued_at)}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">Terakhir Diupdate</span>
                      <span className="text-gray-900 dark:text-white">{formatDate(certificate.updated_at)}</span>
                    </div>
                    {certificate.revoked_at && (
                      <>
                        <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <XCircle className="h-4 w-4" /> Dicabut Pada
                          </span>
                          <span className="text-gray-900 dark:text-white">{formatDate(certificate.revoked_at)}</span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                          <span className="text-gray-500 dark:text-gray-400">Alasan Pencabutan</span>
                          <span className="text-[#D93025] dark:text-[#D93025]">{certificate.revoke_reason || "-"}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview Modal - using shared component with real certificate data */}
        <CertificateTemplateModal
          open={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
          type="preview"
          template={null}
          templateForm={templateForm}
          loading={previewLoading}
          onFormChange={() => {}}
          onFileUpload={() => {}}
          onSave={() => {}}
        />
      </MentorLayout>
    </ProtectedRoute>
  );
}