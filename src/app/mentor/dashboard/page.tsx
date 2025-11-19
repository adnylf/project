'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  Users,
  BarChart3,
  Star,
  Edit,
  Eye,
  MessageSquare,
  X,
  Bell
} from 'lucide-react';
import Link from 'next/link';
import MentorLayout from '@/components/mentor/mentor-layout';
import { useState } from 'react';

const mentorCourses = [
  {
    id: 1,
    title: 'Dasar-Dasar Pemrograman Web',
    students: 1250,
    revenue: 15000000,
    rating: 4.8,
    status: 'active',
    thumbnail: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 2,
    title: 'JavaScript Advanced',
    students: 890,
    revenue: 12000000,
    rating: 4.7,
    status: 'active',
    thumbnail: 'https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 3,
    title: 'React untuk Pemula',
    students: 650,
    revenue: 9500000,
    rating: 4.9,
    status: 'draft',
    thumbnail: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 4,
    title: 'Node.js Mastery',
    students: 420,
    revenue: 7500000,
    rating: 4.6,
    status: 'active',
    thumbnail: 'https://images.pexels.com/photos/11035386/pexels-photo-11035386.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 5,
    title: 'Vue.js Fundamentals',
    students: 380,
    revenue: 6800000,
    rating: 4.8,
    status: 'active',
    thumbnail: 'https://images.pexels.com/photos/11035387/pexels-photo-11035387.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 6,
    title: 'TypeScript Professional',
    students: 720,
    revenue: 11000000,
    rating: 4.9,
    status: 'active',
    thumbnail: 'https://images.pexels.com/photos/11035388/pexels-photo-11035388.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

const initialMessages = [
  {
    id: 1,
    student: 'Ahmad Fauzi',
    message: 'Pertanyaan tentang materi modul 3 pada kursus React untuk Pemula',
    time: '2 jam yang lalu',
  },
  {
    id: 2,
    student: 'Sarah Putri',
    message: 'Ingin konfirmasi mengenai tugas akhir yang sudah dikumpulkan',
    time: '4 jam yang lalu',
  },
  {
    id: 3,
    student: 'John Smith',
    message: 'Meminta penjelasan tambahan tentang konsep hooks dalam React',
    time: '1 hari yang lalu',
  },
  {
    id: 4,
    student: 'Maria Chen',
    message: 'Kendala dalam implementasi API di project akhir',
    time: '1 hari yang lalu',
  },
  {
    id: 5,
    student: 'David Lee',
    message: 'Feedback untuk submission tugas minggu ini',
    time: '2 hari yang lalu',
  },
];

export default function MentorDashboard() {
  const [messages, setMessages] = useState(initialMessages);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDeleteMessage = (id: number) => {
    setMessages(messages.filter((message) => message.id !== id));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'jt';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const totalStudents = mentorCourses.reduce((sum, course) => sum + course.students, 0);
  const totalRevenue = mentorCourses.reduce((sum, course) => sum + course.revenue, 0);
  const averageRating = (mentorCourses.reduce((sum, course) => sum + course.rating, 0) / mentorCourses.length).toFixed(1);

  return (
    <MentorLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fadeIn">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Dashboard Mentor
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Kelola kursus dan pantau performa Anda
            </p>
          </div>
          <Link href="/mentor/courses/create">
            <Button size="lg" className="bg-[#005EB8] hover:bg-[#004A93]">
              <GraduationCap className="h-5 w-5 mr-2" />
              Buat Kursus Baru
            </Button>
          </Link>
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
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{mentorCourses.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Kursus</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#008A00]/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-[#008A00]" />
                </div>
                <BarChart3 className="h-5 w-5 text-[#008A00]" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(totalStudents)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Siswa</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#F4B400]/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-[#F4B400]" />
                </div>
                <BarChart3 className="h-5 w-5 text-[#008A00]" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(totalRevenue)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Pendapatan</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-[#005EB8]/10 flex items-center justify-center">
                  <Star className="h-6 w-6 text-[#F4B400]" />
                </div>
                <BarChart3 className="h-5 w-5 text-[#008A00]" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{averageRating}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rating Rata-rata</p>
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
                  Kelola dan pantau performa kursus Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto p-6 space-y-4">
                  {mentorCourses.map((course) => (
                    <Card 
                      key={course.id}
                      className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700"
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
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                {course.title}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                course.status === 'active'
                                  ? 'bg-[#008A00]/10 text-[#008A00]'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                              }`}>
                                {course.status === 'active' ? 'Aktif' : 'Draft'}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {formatNumber(course.students)}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Siswa</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-[#F4B400]">
                                  {course.rating}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Rating</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {formatNumber(course.revenue)}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Pendapatan</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex sm:flex-col gap-2 self-center">
                            <Link href={`/mentor/courses/${course.id}/edit`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full border-gray-300 dark:border-gray-600">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </Link>
                            <Link href={`/courses/${course.id}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full border-gray-300 dark:border-gray-600">
                                <Eye className="h-4 w-4 mr-1" />
                                Lihat
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                  <Link href="/mentor/courses">
                    <Button variant="outline" className="w-full border-gray-300 dark:border-gray-600">
                      Lihat Semua Kursus
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Messages */}
          <div>
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">
                    Pesan Terbaru
                  </CardTitle>
                  <MessageSquare className="h-5 w-5 text-[#005EB8]" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Tidak ada pesan
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200 relative group"
                      >
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          <X className="h-3 w-3 text-gray-500" />
                        </button>
                        <p className="font-medium text-gray-900 dark:text-white text-sm mb-1 pr-6">
                          {message.student}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2 pr-6">
                          {message.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {message.time}
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
                Analisis Performa
              </CardTitle>
              <CardDescription>
                Statistik dan wawasan tentang performa kursus Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 rounded-full bg-[#008A00]/10 flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-[#008A00]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        +245
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Siswa Baru Bulan Ini
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 rounded-full bg-[#005EB8]/10 flex items-center justify-center">
                        <Star className="h-6 w-6 text-[#F4B400]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        98%
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Ulasan Positif
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 rounded-full bg-[#F4B400]/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-[#F4B400]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        189
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Kursus Diselesaikan
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MentorLayout>
  );
}