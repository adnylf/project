// app/user/certificates/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Search,
  BadgeCheck,
  Share,
  Eye,
} from "lucide-react";
import Link from "next/link";
import UserLayout from "@/components/user/user-layout";

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
  },
];

export default function UserCertificates() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCertificates = certificates.filter((cert) =>
    cert.courseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = (certificateId: number) => {
    console.log(`Downloading certificate ${certificateId}`);
    // Logic untuk download sertifikat
  };

  const handleShare = (certificateId: number) => {
    console.log(`Sharing certificate ${certificateId}`);
    // Logic untuk share sertifikat
  };

  return (
    <UserLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeIn">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Sertifikat Saya
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Kelola dan unduh sertifikat kursus yang telah Anda selesaikan
            </p>
          </div>
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total:{" "}
                <span className="font-bold text-[#008A00]">
                  {certificates.length}
                </span>{" "}
                Sertifikat
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Cari sertifikat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map((cert, index) => (
            <Card
              key={cert.id}
              className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 overflow-hidden animate-fadeSlide h-full flex flex-col"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#005EB8]/90 to-[#008A00]/90 flex items-center justify-center">
                  <div className="text-center text-white p-6">
                    <BadgeCheck className="h-16 w-16 mx-auto mb-4" />
                    <h3 className="font-bold text-xl mb-2 line-clamp-2">
                      Sertifikat Kelulusan
                    </h3>
                    <p className="text-sm opacity-90 line-clamp-2">
                      {cert.courseName}
                    </p>
                  </div>
                </div>
                <img
                  src={cert.thumbnail}
                  alt={cert.courseName}
                  className="w-full h-48 object-cover opacity-20"
                />
                <div className="absolute top-3 right-3">
                  <Badge className="bg-[#008A00] text-white">Verified</Badge>
                </div>
              </div>

              <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {cert.courseName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Instruktur: {cert.instructor}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Tanggal Selesai:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {cert.completionDate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Kode:
                      </span>
                      <span className="font-mono text-xs font-medium text-[#005EB8]">
                        {cert.certificateCode}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {cert.skills.map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleDownload(cert.id)}
                      className="bg-[#005EB8] hover:bg-[#004A93] w-full"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShare(cert.id)}
                      className="w-full"
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                    <Link href={`/user/certificates/${cert.id}`} className="w-full">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Diunduh {cert.downloadCount} kali
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCertificates.length === 0 && (
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeIn">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <BadgeCheck className="h-10 w-10 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Tidak ada sertifikat ditemukan
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Selesaikan kursus untuk mendapatkan sertifikat
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeIn">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BadgeCheck className="h-5 w-5 text-[#005EB8]" />
                Verifikasi Sertifikat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Semua sertifikat dilengkapi dengan kode verifikasi unik yang
                dapat digunakan untuk memvalidasi keaslian sertifikat.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Masukkan kode verifikasi..."
                  className="flex-1"
                />
                <Button className="bg-[#005EB8] hover:bg-[#004A93]">
                  Verifikasi
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-gradient-to-r from-[#008A00] to-[#006600] text-white shadow-sm transition-all duration-300 hover:shadow-md border-[#008A00] animate-fadeIn">
            <CardContent className="p-6 h-full flex flex-col justify-center">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">
                  Bagikan Pencapaian Anda
                </h3>
                <p className="text-white/90 text-sm mb-4">
                  Tunjukkan sertifikat Anda di LinkedIn dan jaringan profesional
                  lainnya
                </p>
                <Button
                  size="lg"
                  className="bg-white text-[#008A00] hover:bg-gray-100 font-semibold"
                >
                  <Share className="h-5 w-5 mr-2" />
                  Bagikan Semua
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UserLayout>
  );
}