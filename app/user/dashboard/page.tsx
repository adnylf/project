"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Trophy,
  Clock,
  BarChart3,
  Play,
  Star,
  Bell,
  X,
} from "lucide-react";
import Link from "next/link";
import UserLayout from "@/components/user/user-layout";
import { useState, useEffect } from "react";

const enrolledCourses = [
  {
    id: 1,
    title: "Dasar-Dasar Pemrograman Web",
    instructor: "Dr. Ahmad Fauzi",
    progress: 65,
    totalLessons: 12,
    completedLessons: 8,
    thumbnail:
      "https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: 2,
    title: "Desain Grafis untuk Pemula",
    instructor: "Sarah Putri",
    progress: 40,
    totalLessons: 10,
    completedLessons: 4,
    thumbnail:
      "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: 3,
    title: "Bahasa Inggris Percakapan",
    instructor: "John Smith",
    progress: 80,
    totalLessons: 15,
    completedLessons: 12,
    thumbnail:
      "https://images.pexels.com/photos/256417/pexels-photo-256417.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: 4,
    title: "Python untuk Pemula",
    instructor: "Dr. Maria Chen",
    progress: 30,
    totalLessons: 20,
    completedLessons: 6,
    thumbnail:
      "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: 5,
    title: "Digital Marketing Fundamentals",
    instructor: "Rina Wijaya",
    progress: 75,
    totalLessons: 14,
    completedLessons: 10,
    thumbnail:
      "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: 6,
    title: "UI/UX Design Basics",
    instructor: "David Lee",
    progress: 50,
    totalLessons: 16,
    completedLessons: 8,
    thumbnail:
      "https://images.pexels.com/photos/1144265/pexels-photo-1144265.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

const initialNotifications = [
  {
    id: 1,
    title: "Materi Baru Tersedia",
    message:
      'Materi baru telah ditambahkan di kursus "Dasar-Dasar Pemrograman Web"',
    time: "2 jam yang lalu",
  },
  {
    id: 2,
    title: "Selamat!",
    message:
      'Anda telah menyelesaikan 80% dari kursus "Bahasa Inggris Percakapan"',
    time: "1 hari yang lalu",
  },
  {
    id: 3,
    title: "Pengingat Tugas",
    message:
      'Tugas akhir untuk kursus "Desain Grafis untuk Pemula" akan segera berakhir',
    time: "3 hari yang lalu",
  },
  {
    id: 4,
    title: "Sertifikat Tersedia",
    message: 'Sertifikat untuk kursus "Python Dasar" sudah dapat diunduh',
    time: "5 hari yang lalu",
  },
  {
    id: 5,
    title: "Live Session Mendatang",
    message:
      "Live session Q&A dengan instruktur akan dilaksanakan besok jam 19:00",
    time: "1 minggu yang lalu",
  },
];

const recommendations = [
  {
    id: 7,
    title: "Python untuk Data Science",
    instructor: "Dr. Maria Chen",
    rating: 4.8,
    students: 1250,
    thumbnail:
      "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: 8,
    title: "Digital Marketing Mastery",
    instructor: "Rina Wijaya",
    rating: 4.9,
    students: 2100,
    thumbnail:
      "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: 9,
    title: "UI/UX Design Fundamentals",
    instructor: "David Lee",
    rating: 4.7,
    students: 890,
    thumbnail:
      "https://images.pexels.com/photos/1144265/pexels-photo-1144265.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: 10,
    title: "Machine Learning Basics",
    instructor: "Prof. Alex Johnson",
    rating: 4.6,
    students: 3200,
    thumbnail:
      "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: 11,
    title: "Mobile App Development",
    instructor: "Sarah Miller",
    rating: 4.8,
    students: 1800,
    thumbnail:
      "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: 12,
    title: "Cloud Computing Essentials",
    instructor: "Michael Brown",
    rating: 4.5,
    students: 950,
    thumbnail:
      "https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

export default function UserDashboard() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDeleteNotification = (id: number) => {
    setNotifications(
      notifications.filter((notification) => notification.id !== id)
    );
  };

  // Format number with consistent formatting
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="animate-fadeIn">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard Pembelajaran
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Selamat datang kembali! Lanjutkan perjalanan belajar Anda.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#005EB8]/10 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-[#005EB8]" />
                </div>
                <BarChart3 className="h-5 w-5 text-[#008A00]" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  6
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Kursus Aktif
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#008A00]/10 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-[#008A00]" />
                </div>
                <BarChart3 className="h-5 w-5 text-[#008A00]" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  4
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sertifikat
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#F4B400]/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-[#F4B400]" />
                </div>
                <BarChart3 className="h-5 w-5 text-[#008A00]" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  42
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Jam Belajar
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#005EB8]/10 flex items-center justify-center">
                  <Star className="h-6 w-6 text-[#005EB8]" />
                </div>
                <BarChart3 className="h-5 w-5 text-[#008A00]" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  57%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Rata-rata Progress
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - My Courses */}
          <div className="lg:col-span-2">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 h-full">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Kursus Saya</CardTitle>
                <CardDescription>
                  Lanjutkan pembelajaran dari terakhir kali Anda berhenti
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto p-6 space-y-4">
                  {enrolledCourses.map((course) => (
                    <Card
                      key={course.id}
                      className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 cursor-pointer"
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="w-full sm:w-32 h-32 sm:h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {course.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {course.instructor}
                            </p>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                  {course.completedLessons} dari{" "}
                                  {course.totalLessons} pelajaran
                                </span>
                                <span className="font-medium text-[#005EB8]">
                                  {course.progress}%
                                </span>
                              </div>
                              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#005EB8] rounded-full transition-all"
                                  style={{ width: `${course.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex sm:flex-col gap-2 self-center">
                            <Link
                              href={`/user/courses/${course.id}/player`}
                              className="flex-1"
                            >
                              <Button className="w-full bg-[#005EB8] hover:bg-[#004A93]">
                                <Play className="h-4 w-4 mr-2" />
                                Lanjutkan
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                  <Link href="/courses">
                    <Button
                      variant="outline"
                      className="w-full border-gray-300 dark:border-gray-600"
                    >
                      Jelajahi Kursus Lainnya
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Notifications */}
          <div>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">
                    Notifikasi
                  </CardTitle>
                  <Bell className="h-5 w-5 text-[#005EB8]" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6 space-y-4">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Tidak ada notifikasi
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200 relative group"
                      >
                        <button
                          onClick={() =>
                            handleDeleteNotification(notification.id)
                          }
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          <X className="h-3 w-3 text-gray-500" />
                        </button>
                        <p className="font-medium text-gray-900 dark:text-white text-sm mb-1 pr-6">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2 pr-6">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {notification.time}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recommendations Section - Full Width */}
        <div className="mt-8">
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                Rekomendasi Untuk Anda
              </CardTitle>
              <CardDescription>
                Kursus yang mungkin Anda sukai berdasarkan minat Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((course) => (
                  <Card
                    key={course.id}
                    className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700"
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col">
                        <div className="w-full h-48 rounded-t-lg overflow-hidden">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4 space-y-3">
                          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                            {course.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {course.instructor}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#F4B400] font-medium flex items-center gap-1">
                              ⭐ {course.rating}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {isClient
                                ? formatNumber(course.students)
                                : course.students}{" "}
                              siswa
                            </span>
                          </div>
                          <Button className="w-full bg-[#005EB8] hover:bg-[#004A93] mt-2">
                            Lihat Kursus
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UserLayout>
  );
}