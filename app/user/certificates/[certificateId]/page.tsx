// app/user/certificates/[certificateId]/page.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Share,
  X,
  BadgeCheck,
} from "lucide-react";
import Link from "next/link";
import UserLayout from "@/components/user/user-layout";
import { useParams } from "next/navigation";

// Data sertifikat
const certificatesData = [
  {
    id: 1,
    courseName: "Dasar-Dasar Pemrograman Web",
    instructor: "Dr. Ahmad Fauzi",
    studentName: "John Doe",
    completionDate: "15 September 2024",
    certificateCode: "CERT-WEB-2024-001",
    status: "verified",
    downloadCount: 3,
    issueDate: "2024-09-15",
    skills: ["HTML", "CSS", "JavaScript"],
    description: "Telah berhasil menyelesaikan kursus Dasar-Dasar Pemrograman Web dengan penuh dedikasi dan mencapai semua persyaratan kelulusan yang ditetapkan.",
    duration: "8 jam pembelajaran",
    level: "Pemula",
    instructorSignature: "Dr. Ahmad Fauzi",
    directorSignature: "Prof. Dr. Siti Rahayu, M.Kom.",
  },
  {
    id: 2,
    courseName: "Bahasa Inggris Percakapan",
    instructor: "John Smith",
    studentName: "John Doe", 
    completionDate: "10 Agustus 2024",
    certificateCode: "CERT-ENG-2024-002",
    status: "verified",
    downloadCount: 5,
    issueDate: "2024-08-10",
    skills: ["Speaking", "Listening", "Grammar"],
    description: "Telah berhasil menyelesaikan kursus Bahasa Inggris Percakapan dengan menunjukkan kemampuan komunikasi yang sangat baik dalam bahasa Inggris.",
    duration: "6 jam pembelajaran",
    level: "Menengah",
    instructorSignature: "John Smith",
    directorSignature: "Prof. Dr. Siti Rahayu, M.Kom.",
  },
  {
    id: 3,
    courseName: "UI/UX Design Mastery",
    instructor: "Budi Santoso",
    studentName: "John Doe",
    completionDate: "20 Juli 2024",
    certificateCode: "CERT-UX-2024-003",
    status: "verified",
    downloadCount: 2,
    issueDate: "2024-07-20",
    skills: ["Figma", "User Research", "Prototyping"],
    description: "Telah berhasil menyelesaikan kursus UI/UX Design Mastery dengan menunjukkan pemahaman mendalam tentang prinsip desain pengalaman pengguna.",
    duration: "11 jam pembelajaran", 
    level: "Lanjutan",
    instructorSignature: "Budi Santoso",
    directorSignature: "Prof. Dr. Siti Rahayu, M.Kom.",
  },
  {
    id: 4,
    courseName: "Data Science dengan Python",
    instructor: "Dr. Maria Chen",
    studentName: "John Doe",
    completionDate: "5 Juni 2024",
    certificateCode: "CERT-DS-2024-004",
    status: "verified",
    downloadCount: 4,
    issueDate: "2024-06-05",
    skills: ["Python", "Pandas", "Data Analysis"],
    description: "Telah berhasil menyelesaikan kursus Data Science dengan Python dengan kemampuan analisis data yang sangat baik dan penguasaan tools data science.",
    duration: "15 jam pembelajaran",
    level: "Menengah",
    instructorSignature: "Dr. Maria Chen",
    directorSignature: "Prof. Dr. Siti Rahayu, M.Kom.",
  },
  {
    id: 5,
    courseName: "Digital Marketing Fundamentals",
    instructor: "Rina Wijaya", 
    studentName: "John Doe",
    completionDate: "18 Mei 2024",
    certificateCode: "CERT-DM-2024-005",
    status: "verified",
    downloadCount: 1,
    issueDate: "2024-05-18",
    skills: ["SEO", "Social Media", "Content Marketing"],
    description: "Telah berhasil menyelesaikan kursus Digital Marketing Fundamentals dengan pemahaman komprehensif tentang strategi pemasaran digital modern.",
    duration: "9 jam pembelajaran",
    level: "Pemula",
    instructorSignature: "Rina Wijaya",
    directorSignature: "Prof. Dr. Siti Rahayu, M.Kom.",
  },
  {
    id: 6,
    courseName: "Mobile App Development",
    instructor: "Alex Johnson",
    studentName: "John Doe",
    completionDate: "30 April 2024",
    certificateCode: "CERT-MOB-2024-006",
    status: "verified",
    downloadCount: 2,
    issueDate: "2024-04-30",
    skills: ["React Native", "Firebase", "API Integration"],
    description: "Telah berhasil menyelesaikan kursus Mobile App Development dengan kemampuan mengembangkan aplikasi mobile yang fungsional dan user-friendly.",
    duration: "12 jam pembelajaran",
    level: "Lanjutan",
    instructorSignature: "Alex Johnson",
    directorSignature: "Prof. Dr. Siti Rahayu, M.Kom.",
  },
];

export default function CertificateDetail() {
  const params = useParams();
  const certificateId = parseInt(params.certificateId as string);
  const certificate = certificatesData.find(cert => cert.id === certificateId);

  const [isDownloading, setIsDownloading] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  if (!certificate) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Sertifikat Tidak Ditemukan
            </h1>
            <Link href="/user/certificates">
              <Button className="bg-[#005EB8] hover:bg-[#004A93]">
                Kembali ke Daftar Sertifikat
              </Button>
            </Link>
          </div>
        </div>
      </UserLayout>
    );
  }

  const handleDownload = async () => {
    if (!certificateRef.current) return;

    setIsDownloading(true);
    
    try {
      // Dynamic import untuk mengurangi bundle size
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
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
      alert('Terjadi kesalahan saat mengunduh sertifikat');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Sertifikat ${certificate.courseName}`,
        text: `Saya telah menyelesaikan kursus ${certificate.courseName}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link sertifikat telah disalin ke clipboard');
    }
  };

  return (
    <UserLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 animate-fadeIn">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/user/certificates">
              <Button variant="ghost" className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Tutup
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleShare}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Share className="h-4 w-4" />
                Bagikan
              </Button>
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="bg-[#005EB8] hover:bg-[#004A93] flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isDownloading ? "Mengunduh..." : "Unduh PDF"}
              </Button>
            </div>
          </div>

          {/* Certificate Container */}
          <div 
            ref={certificateRef}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700"
          >
            <div className="p-8">
              {/* Certificate Design - Landscape Orientation */}
              <div className="min-h-[500px] bg-gradient-to-br from-[#005EB8] via-[#004A93] to-[#008A00] rounded-xl p-8 text-white relative overflow-hidden">
                
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-full h-full bg-repeat" 
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                  />
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-white/30"></div>
                <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-white/30"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-white/30"></div>
                <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-white/30"></div>

                {/* Certificate Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center space-y-6">
                  
                  {/* Header */}
                  <div className="space-y-2">
                    <Badge className="bg-white/20 text-white border-none px-4 py-2">
                      SERTIFIKAT KELULUSAN
                    </Badge>
                    <h1 className="text-4xl font-bold tracking-wide">KELULUSAN</h1>
                  </div>

                  {/* Main Content */}
                  <div className="space-y-4 max-w-2xl">
                    <p className="text-lg opacity-90">
                      Dengan ini menyatakan bahwa
                    </p>
                    
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold border-b-2 border-white/30 pb-2">
                        {certificate.studentName}
                      </h2>
                      <p className="text-sm opacity-80">Nama Peserta</p>
                    </div>

                    <p className="text-lg opacity-90">
                      telah berhasil menyelesaikan kursus
                    </p>

                    <div className="space-y-2">
                      <h3 className="text-2xl font-semibold">
                        {certificate.courseName}
                      </h3>
                      <p className="text-sm opacity-80">
                        Tingkat: {certificate.level}
                      </p>
                    </div>

                    <p className="text-sm opacity-80 leading-relaxed">
                      {certificate.description}
                    </p>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-2 gap-16 w-full max-w-2xl mt-6 pt-4 border-t border-white/30">
                    <div className="text-center">
                      <div className="mb-2">
                        <div className="border-b border-white/50 pb-8 mb-2 mx-auto w-48">
                          {/* Space for signature */}
                        </div>
                        <p className="text-sm font-semibold">{certificate.instructorSignature}</p>
                        <p className="text-xs opacity-80">Instruktur</p>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="mb-2">
                        <div className="border-b border-white/50 pb-8 mb-2 mx-auto w-48">
                          {/* Space for signature */}
                        </div>
                        <p className="text-sm font-semibold">{certificate.directorSignature}</p>
                        <p className="text-xs opacity-80">Direktur Akademik</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verified Badge */}
                <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <BadgeCheck className="h-5 w-5" />
                  <span className="text-sm font-medium">Terverifikasi</span>
                </div>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Informasi Kursus
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Durasi: {certificate.duration}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Level: {certificate.level}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Keterampilan yang Diperoleh
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {certificate.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Status Sertifikat
                  </h4>
                  <div className="flex items-center gap-2 text-[#008A00]">
                    <BadgeCheck className="h-4 w-4" />
                    <span>Terverifikasi</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Diunduh {certificate.downloadCount} kali
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Validasi
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Kode: {certificate.certificateCode}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Terbit: {certificate.issueDate}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Mobile */}
          <div className="flex justify-center gap-4 mt-6 md:hidden">
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-[#005EB8] hover:bg-[#004A93] flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isDownloading ? "Mengundh..." : "Unduh PDF"}
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Share className="h-4 w-4" />
              Bagikan
            </Button>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}