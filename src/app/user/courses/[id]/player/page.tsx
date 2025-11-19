// app/user/courses/[id]/player/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Pause,
  Volume2,
  Settings,
  Maximize,
  ChevronLeft,
  Clock,
  CheckCircle,
  FileText,
  MessageSquare,
  Download
} from "lucide-react";
import Link from "next/link";
import UserLayout from "@/components/user/user-layout";
import { useParams } from "next/navigation";

const courseData = {
  id: 1,
  title: "Dasar-Dasar Pemrograman Web",
  instructor: "Dr. Ahmad Fauzi",
  progress: 65,
  totalLessons: 12,
  completedLessons: 8,
  duration: "8 jam",
  rating: 4.8,
  category: "Programming",
  description: "Pelajari fundamental pemrograman web modern dengan teknologi terkini. Kursus ini mencakup HTML, CSS, JavaScript, dan konsep web development lainnya.",
  videoUrl: "https://www.youtube.com/embed/3IkCryiG4Dc?si=NtEGjQJ7cG1F2fgA"
};

const lessons = [
  { id: 1, title: "Pengenalan HTML", duration: "15:30", completed: true, type: "video" },
  { id: 2, title: "Struktur Dasar HTML", duration: "22:15", completed: true, type: "video" },
  { id: 3, title: "Semantic HTML", duration: "18:45", completed: true, type: "video" },
  { id: 4, title: "Form dan Input Elements", duration: "25:20", completed: true, type: "video" },
  { id: 5, title: "Pengenalan CSS", duration: "20:10", completed: true, type: "video" },
  { id: 6, title: "CSS Selectors dan Box Model", duration: "28:35", completed: true, type: "video" },
  { id: 7, title: "Flexbox Layout", duration: "32:45", completed: true, type: "video" },
  { id: 8, title: "CSS Grid System", duration: "35:20", completed: false, type: "video" },
  { id: 9, title: "Responsive Design", duration: "29:15", completed: false, type: "video" },
  { id: 10, title: "Pengenalan JavaScript", duration: "26:40", completed: false, type: "video" },
  { id: 11, title: "Quiz: HTML & CSS", duration: "20 menit", completed: false, type: "quiz" },
  { id: 12, title: "Project Akhir", duration: "1 jam", completed: false, type: "project" }
];

const materials = [
  { id: 1, title: "Slide Presentasi HTML", type: "pdf", size: "2.4 MB" },
  { id: 2, title: "Cheatsheet CSS Grid", type: "pdf", size: "1.1 MB" },
  { id: 3, title: "Source Code Contoh", type: "zip", size: "4.8 MB" },
  { id: 4, title: "Referensi Tambahan", type: "doc", size: "3.2 MB" }
];

export default function CoursePlayer() {
  const params = useParams();
  const id = params.id;
  const [activeTab, setActiveTab] = useState("materi");
  const [currentLesson, setCurrentLesson] = useState(8);

  const completedLessons = lessons.filter(lesson => lesson.completed).length;
  const progress = Math.round((completedLessons / lessons.length) * 100);

  return (
    <UserLayout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/user/courses">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Kembali
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {courseData.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {courseData.instructor} • {completedLessons}/{lessons.length} pelajaran selesai
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
              <p className="font-bold text-[#005EB8]">{progress}%</p>
            </div>
            <Link href={`/user/courses/${id}/discussion`}>
              <Button className="bg-[#005EB8] hover:bg-[#004A93]">
                <MessageSquare className="h-4 w-4 mr-2" />
                Diskusi
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="aspect-video bg-black relative">
                <iframe
                  src={courseData.videoUrl}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {lessons.find(lesson => lesson.id === currentLesson)?.title}
                </h2>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {lessons.find(lesson => lesson.id === currentLesson)?.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      {completedLessons}/{lessons.length} selesai
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#005EB8] rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tab Navigation */}
            <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
              <CardContent className="p-0">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <div className="flex">
                    <button
                      onClick={() => setActiveTab("materi")}
                      className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === "materi"
                          ? "border-[#005EB8] text-[#005EB8]"
                          : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      Materi Pembelajaran
                    </button>
                    <button
                      onClick={() => setActiveTab("deskripsi")}
                      className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === "deskripsi"
                          ? "border-[#005EB8] text-[#005EB8]"
                          : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      Deskripsi Kursus
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {activeTab === "materi" && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        Materi Tambahan
                      </h3>
                      <div className="grid gap-3">
                        {materials.map((material) => (
                          <div
                            key={material.id}
                            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-[#005EB8]" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {material.title}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {material.type.toUpperCase()} • {material.size}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "deskripsi" && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        Tentang Kursus Ini
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {courseData.description}
                      </p>
                      
                      <div className="grid md:grid-cols-2 gap-6 mt-6">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            Yang akan Anda pelajari
                          </h4>
                          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-[#008A00]" />
                              Fundamental HTML, CSS, dan JavaScript
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-[#008A00]" />
                              Responsive Web Design
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-[#008A00]" />
                              Modern CSS Layout (Flexbox & Grid)
                            </li>
                          </ul>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            Persyaratan
                          </h4>
                          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-[#008A00]" />
                              Laptop/PC dengan koneksi internet
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-[#008A00]" />
                              Text Editor (VS Code recommended)
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-[#008A00]" />
                              Browser modern (Chrome, Firefox, etc.)
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lessons List */}
          <div className="lg:col-span-1">
            <Card className="rounded-lg border border-gray-200 dark:border-gray-700">
              <CardContent className="p-0">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Daftar Pelajaran
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {lessons.length} pelajaran • {courseData.duration}
                  </p>
                </div>

                <div className="max-h-[600px] overflow-y-auto">
                  {lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors ${
                        lesson.id === currentLesson
                          ? "bg-[#005EB8] bg-opacity-10 border-l-4 border-l-[#005EB8]"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => setCurrentLesson(lesson.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          lesson.completed
                            ? "bg-[#008A00] text-white"
                            : lesson.id === currentLesson
                            ? "bg-[#005EB8] text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        }`}>
                          {lesson.completed ? "✓" : index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${
                            lesson.id === currentLesson
                              ? "text-[#005EB8]"
                              : "text-gray-900 dark:text-white"
                          }`}>
                            {lesson.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {lesson.duration}
                            </span>
                            {lesson.type !== "video" && (
                              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                                {lesson.type}
                              </span>
                            )}
                          </div>
                        </div>
                        {lesson.completed && (
                          <CheckCircle className="h-4 w-4 text-[#008A00] flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}