// app/user/certificates/[id]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Share,
  ArrowLeft,
  Printer,
  Copy,
  CheckCircle,
  BadgeCheck,
  Calendar,
  User,
  BookOpen,
  Clock,
} from "lucide-react";
import Link from "next/link";
import UserLayout from "@/components/user/user-layout";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Data sertifikat (sama dengan data sebelumnya)
const certificates = [
  {
    id: 1,
    courseName: "Dasar-Dasar Pemrograman Web",
    instructor: "Dr. Ahmad Fauzi",
    completionDate: "15 September 2024",
    certificateCode: "CERT-WEB-2024-001",
    status: "verified",
    downloadCount: 3,
    thumbnail:
      "https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800",
    issueDate: "2024-09-15",
    skills: ["HTML", "CSS", "JavaScript"],
    studentName: "John Doe",
    duration: "40 jam",
    grade: "A",
    description: "Sertifikat ini diberikan sebagai pengakuan atas penyelesaian kursus Dasar-Dasar Pemrograman Web dengan nilai yang memuaskan.",
  },
  {
    id: 2,
    courseName: "Bahasa Inggris Percakapan",
    instructor: "John Smith",
    completionDate: "10 Agustus 2024",
    certificateCode: "CERT-ENG-2024-002",
    status: "verified",
    downloadCount: 5,
    thumbnail:
      "https://images.pexels.com/photos/256417/pexels-photo-256417.jpeg?auto=compress&cs=tinysrgb&w=800",
    issueDate: "2024-08-10",
    skills: ["Speaking", "Listening", "Grammar"],
    studentName: "John Doe",
    duration: "30 jam",
    grade: "A-",
    description: "Sertifikat ini diberikan sebagai pengakuan atas penyelesaian kursus Bahasa Inggris Percakapan dengan kemampuan komunikasi yang baik.",
  },
  {
    id: 3,
    courseName: "UI/UX Design Mastery",
    instructor: "Budi Santoso",
    completionDate: "20 Juli 2024",
    certificateCode: "CERT-UX-2024-003",
    status: "verified",
    downloadCount: 2,
    thumbnail:
      "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800",
    issueDate: "2024-07-20",
    skills: ["Figma", "User Research", "Prototyping"],
    studentName: "John Doe",
    duration: "50 jam",
    grade: "A+",
    description: "Sertifikat ini diberikan sebagai pengakuan atas penyelesaian kursus UI/UX Design Mastery dengan proyek yang luar biasa.",
  },
  {
    id: 4,
    courseName: "Data Science dengan Python",
    instructor: "Dr. Maria Chen",
    completionDate: "5 Juni 2024",
    certificateCode: "CERT-DS-2024-004",
    status: "verified",
    downloadCount: 4,
    thumbnail:
      "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800",
    issueDate: "2024-06-05",
    skills: ["Python", "Pandas", "Data Analysis"],
    studentName: "John Doe",
    duration: "60 jam",
    grade: "A",
    description: "Sertifikat ini diberikan sebagai pengakuan atas penyelesaian kursus Data Science dengan Python dengan pemahaman mendalam tentang analisis data.",
  },
  {
    id: 5,
    courseName: "Digital Marketing Fundamentals",
    instructor: "Rina Wijaya",
    completionDate: "18 Mei 2024",
    certificateCode: "CERT-DM-2024-005",
    status: "verified",
    downloadCount: 1,
    thumbnail:
      "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800",
    issueDate: "2024-05-18",
    skills: ["SEO", "Social Media", "Content Marketing"],
    studentName: "John Doe",
    duration: "35 jam",
    grade: "B+",
    description: "Sertifikat ini diberikan sebagai pengakuan atas penyelesaian kursus Digital Marketing Fundamentals dengan strategi pemasaran yang efektif.",
  },
  {
    id: 6,
    courseName: "Mobile App Development",
    instructor: "Alex Johnson",
    completionDate: "30 April 2024",
    certificateCode: "CERT-MOB-2024-006",
    status: "verified",
    downloadCount: 2,
    thumbnail:
      "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=800",
    issueDate: "2024-04-30",
    skills: ["React Native", "Firebase", "API Integration"],
    studentName: "John Doe",
    duration: "55 jam",
    grade: "A",
    description: "Sertifikat ini diberikan sebagai pengakuan atas penyelesaian kursus Mobile App Development dengan aplikasi yang fungsional dan user-friendly.",
  },
];

export default function CertificateDetail() {
  const params = useParams();
  const router = useRouter();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [certificate, setCertificate] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const certificateId = parseInt(params.id as string);
    const foundCertificate = certificates.find(cert => cert.id === certificateId);
    
    if (foundCertificate) {
      setCertificate(foundCertificate);
    } else {
      router.push("/user/certificates");
    }
  }, [params.id, router]);

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const imgWidth = 297; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`sertifikat-${certificate.certificateCode}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/user/certificates/${certificate.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Sertifikat ${certificate.courseName}`,
          text: `Lihat sertifikat saya untuk kursus ${certificate.courseName}`,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback untuk browser yang tidak support Web Share API
      await handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/user/certificates/${certificate.id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!certificate) {
    return (
      <UserLayout>
        <div className="container mx-auto p-8 text-center">
          <p>Loading...</p>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Header dengan navigasi */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-4">
            <Link href="/user/certificates">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Sertifikat
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Detail Sertifikat
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {certificate.courseName}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="bg-[#005EB8] hover:bg-[#004A93]"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? "Mengunduh..." : "Unduh PDF"}
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share className="h-4 w-4 mr-2" />
              Bagikan
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Certificate Preview - Takes 2/3 width */}
          <div className="lg:col-span-2">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700 overflow-hidden">
              <CardContent className="p-0">
                {/* Certificate Design */}
                <div
                  ref={certificateRef}
                  className="bg-gradient-to-br from-blue-50 to-green-50 p-8 print:p-12"
                  style={{ minHeight: "600px" }}
                >
                  {/* Certificate Border */}
                  <div className="border-4 border-[#005EB8] rounded-lg p-8 h-full flex flex-col justify-between relative">
                    
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute top-4 left-4 w-20 h-20 border-2 border-[#005EB8] rounded-full"></div>
                      <div className="absolute bottom-4 right-4 w-16 h-16 border-2 border-[#008A00] rounded-full"></div>
                      <div className="absolute top-1/2 left-1/4 w-12 h-12 border-2 border-[#F4B400] rounded-full"></div>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8 relative z-10">
                      <div className="flex justify-center mb-4">
                        <BadgeCheck className="h-16 w-16 text-[#005EB8]" />
                      </div>
                      <h1 className="text-4xl font-bold text-[#005EB8] mb-2">
                        SERTIFIKAT KELULUSAN
                      </h1>
                      <p className="text-lg text-gray-600">
                        Dengan bangga diberikan kepada
                      </p>
                    </div>

                    {/* Student Name */}
                    <div className="text-center my-12 relative z-10">
                      <h2 className="text-5xl font-bold text-gray-900 mb-6 font-serif">
                        {certificate.studentName}
                      </h2>
                      <div className="w-64 h-1 bg-gradient-to-r from-[#005EB8] to-[#008A00] mx-auto mb-6"></div>
                      <p className="text-xl text-gray-600">
                        telah berhasil menyelesaikan kursus
                      </p>
                    </div>

                    {/* Course Name */}
                    <div className="text-center my-8 relative z-10">
                      <h3 className="text-3xl font-bold text-[#008A00] mb-4">
                        {certificate.courseName}
                      </h3>
                      <p className="text-lg text-gray-600 mb-2">
                        dengan durasi {certificate.duration}
                      </p>
                      <p className="text-lg text-gray-600">
                        dan memperoleh nilai <span className="font-bold text-[#F4B400]">{certificate.grade}</span>
                      </p>
                    </div>

                    {/* Footer with Signatures */}
                    <div className="mt-12 grid grid-cols-2 gap-8 relative z-10">
                      <div className="text-center">
                        <div className="mb-4">
                          <p className="text-lg font-semibold text-gray-900">{certificate.instructor}</p>
                          <p className="text-gray-600">Instruktur</p>
                        </div>
                        <div className="border-t-2 border-gray-900 pt-4 mt-8">
                          <p className="text-sm text-gray-600">Tanda Tangan</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="mb-4">
                          <p className="text-lg font-semibold text-gray-900">Online Course Platform</p>
                          <p className="text-gray-600">Lembaga Pendidikan</p>
                        </div>
                        <div className="border-t-2 border-gray-900 pt-4 mt-8">
                          <p className="text-sm text-gray-600">Stempel</p>
                        </div>
                      </div>
                    </div>

                    {/* Certificate Code and Date */}
                    <div className="mt-8 text-center relative z-10">
                      <p className="text-sm text-gray-500 mb-2">
                        Kode Verifikasi: <span className="font-mono font-bold">{certificate.certificateCode}</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Tanggal Terbit: {new Date(certificate.issueDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Information */}
          <div className="space-y-6">
            {/* Certificate Info */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-[#005EB8]" />
                  Informasi Sertifikat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <Badge className="bg-[#008A00]">Terverifikasi</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Kode</span>
                  <span className="font-mono text-sm font-bold text-[#005EB8]">
                    {certificate.certificateCode}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Diunduh</span>
                  <span className="font-medium">{certificate.downloadCount} kali</span>
                </div>
              </CardContent>
            </Card>

            {/* Course Details */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#005EB8]" />
                  Detail Kursus
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Instruktur</p>
                    <p className="font-medium">{certificate.instructor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Durasi</p>
                    <p className="font-medium">{certificate.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Selesai</p>
                    <p className="font-medium">{certificate.completionDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Nilai</p>
                    <p className="font-medium text-[#F4B400]">{certificate.grade}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills Gained */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[#005EB8]" />
                  Keterampilan yang Diperoleh
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {certificate.skills.map((skill: string, index: number) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="bg-[#005EB8]/10 text-[#005EB8] border-[#005EB8]/20"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Share Certificate */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share className="h-5 w-5 text-[#005EB8]" />
                  Bagikan Sertifikat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bagikan pencapaian Anda dengan jaringan profesional
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleCopyLink}
                  >
                    {isCopied ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2 text-[#008A00]" />
                        Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Salin Link
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={handleShare}
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Bagikan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Certificate Description */}
        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Deskripsi Sertifikat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {certificate.description}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #certificate-container,
          #certificate-container * {
            visibility: visible;
          }
          #certificate-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </UserLayout>
  );
}