"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Play, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  Star 
} from "lucide-react";
import Link from "next/link";
import UserLayout from "@/components/user/user-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const courses = [
  {
    id: 1,
    title: "Dasar-Dasar Pemrograman Web",
    instructor: "Dr. Ahmad Fauzi",
    progress: 65,
    totalLessons: 12,
    completedLessons: 8,
    duration: "8 jam",
    rating: 4.8,
    thumbnail:
      "https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800",
    category: "Programming",
    lastAccessed: "2 jam yang lalu",
  },
  {
    id: 2,
    title: "Desain Grafis untuk Pemula",
    instructor: "Sarah Putri",
    progress: 40,
    totalLessons: 10,
    completedLessons: 4,
    duration: "6 jam",
    rating: 4.6,
    thumbnail:
      "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800",
    category: "Design",
    lastAccessed: "1 hari yang lalu",
  },
  {
    id: 3,
    title: "Bahasa Inggris Percakapan",
    instructor: "John Smith",
    progress: 80,
    totalLessons: 15,
    completedLessons: 12,
    duration: "10 jam",
    rating: 4.9,
    thumbnail:
      "https://images.pexels.com/photos/256417/pexels-photo-256417.jpeg?auto=compress&cs=tinysrgb&w=800",
    category: "Language",
    lastAccessed: "3 jam yang lalu",
  },
  {
    id: 4,
    title: "Data Science dengan Python",
    instructor: "Dr. Maria Chen",
    progress: 25,
    totalLessons: 20,
    completedLessons: 5,
    duration: "15 jam",
    rating: 4.7,
    thumbnail:
      "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800",
    category: "Programming",
    lastAccessed: "5 hari yang lalu",
  },
  {
    id: 5,
    title: "Digital Marketing Fundamentals",
    instructor: "Rina Wijaya",
    progress: 55,
    totalLessons: 12,
    completedLessons: 7,
    duration: "9 jam",
    rating: 4.8,
    thumbnail:
      "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800",
    category: "Marketing",
    lastAccessed: "1 hari yang lalu",
  },
  {
    id: 6,
    title: "UI/UX Design Mastery",
    instructor: "Budi Santoso",
    progress: 90,
    totalLessons: 14,
    completedLessons: 13,
    duration: "11 jam",
    rating: 4.9,
    thumbnail:
      "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800",
    category: "Design",
    lastAccessed: "4 jam yang lalu",
  },
];

export default function UserLearn() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const filteredCourses = courses
    .filter((course) => {
      const matchesSearch = course.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        filterCategory === "all" || course.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "progress") {
        return b.progress - a.progress;
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-[#008A00]";
    if (progress >= 50) return "bg-[#F4B400]";
    return "bg-[#005EB8]";
  };

  return (
    <UserLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeIn">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Kursus Saya
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Kelola dan lanjutkan pembelajaran Anda
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total:{" "}
                  <span className="font-bold text-[#005EB8]">
                    {courses.length}
                  </span>{" "}
                  Kursus
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-scaleIn">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Cari kursus..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    <SelectItem value="Programming">Programming</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Language">Language</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Terbaru Diakses</SelectItem>
                    <SelectItem value="progress">Progress Tertinggi</SelectItem>
                    <SelectItem value="title">Nama A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <Card
              key={course.id}
              className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 overflow-hidden animate-fadeSlide h-full flex flex-col"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 dark:bg-gray-900/90 rounded-full text-xs font-medium text-gray-900 dark:text-white">
                  {course.category}
                </div>
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/70 text-white rounded-full text-xs flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {course.duration}
                </div>
              </div>

              <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {course.instructor}
                  </p>

                  <div className="flex items-center gap-4 text-sm mb-4">
                    <div className="flex items-center gap-1 text-[#F4B400]">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-medium">{course.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <CheckCircle className="h-4 w-4" />
                      <span>
                        {course.completedLessons}/{course.totalLessons}{" "}
                        pelajaran
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Progress
                      </span>
                      <span className="font-bold text-[#005EB8]">
                        {course.progress}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getProgressColor(
                          course.progress
                        )} rounded-full transition-all duration-500`}
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700 mt-4">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {course.lastAccessed}
                  </span>
                  <Link href={`/user/courses/${course.id}/player`}>
                    <Button
                      size="sm"
                      className="bg-[#005EB8] hover:bg-[#004A93]"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Lanjutkan
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 animate-fadeIn">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Search className="h-10 w-10 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Tidak ada kursus ditemukan
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Coba ubah filter atau kata kunci pencarian Anda
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-lg border bg-gradient-to-r from-[#005EB8] to-[#004A93] text-white shadow-sm transition-all duration-300 hover:shadow-md border-[#005EB8] animate-fadeIn">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">
                  Jelajahi Lebih Banyak Kursus
                </h3>
                <p className="text-white/90">
                  Temukan ribuan kursus berkualitas untuk meningkatkan
                  keterampilan Anda
                </p>
              </div>
              <Link href="/courses">
                <Button
                  size="lg"
                  className="bg-white text-[#005EB8] hover:bg-gray-100 font-semibold"
                >
                  Lihat Semua Kursus
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}