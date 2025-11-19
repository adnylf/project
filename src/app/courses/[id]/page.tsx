// app/courses/[id]/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  CheckCircle2, 
  PlayCircle, 
  Download, 
  Award, 
  MessageSquare, 
  ArrowLeft,
  Shield,
  Globe,
  Calendar,
  BarChart3,
  Heart,
  Share2
} from 'lucide-react';
import Link from 'next/link';

// Interface untuk tipe data
interface User {
  name: string;
  avatar: string;
  role: string;
}

interface Review {
  id: number;
  user: User;
  rating: number;
  date: string;
  comment: string;
  likes: number;
}

interface Topic {
  id: number;
  title: string;
  duration: string;
  type: 'video' | 'quiz' | 'project';
  isCompleted: boolean;
}

interface Module {
  id: number;
  title: string;
  description: string;
  lessons: number;
  duration: string;
  progress: number;
  topics: Topic[];
}

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}

interface Instructor {
  name: string;
  avatar: string;
  bio: string;
  rating: number;
  students: number;
  courses: number;
}

interface CourseDetail {
  id: number;
  title: string;
  instructor: Instructor;
  description: string;
  fullDescription: string;
  level: string;
  duration: string;
  totalHours: string;
  students: number;
  rating: number;
  reviews: number;
  price: string;
  originalPrice: string;
  thumbnail: string;
  category: string;
  lastUpdated: string;
  language: string;
  captions: string[];
  modules: Module[];
  features: Feature[];
  skills: string[];
  requirements: string[];
  reviewList: Review[];
}

const courseDetail: CourseDetail = {
  id: 1,
  title: 'Dasar-Dasar Pemrograman Web Modern',
  instructor: {
    name: 'Dr. Ahmad Fauzi',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
    bio: 'Senior Web Developer dengan 15+ tahun pengalaman. Spesialis dalam JavaScript ecosystem dan modern web development.',
    rating: 4.9,
    students: 15000,
    courses: 12,
  },
  description: 'Kursus komprehensif untuk mempelajari pemrograman web dari dasar hingga mahir. Anda akan belajar HTML, CSS, dan JavaScript dengan pendekatan praktis, project-based learning, dan best practices industri terkini.',
  fullDescription: `Dalam kursus ini, Anda akan mempelajari fundamental pengembangan web modern mulai dari nol. Kami akan membimbing Anda melalui setiap konsep dengan contoh praktis dan project nyata yang dapat digunakan dalam portfolio Anda.

Kursus ini dirancang untuk pemula yang ingin memulai karir di bidang web development atau profesional yang ingin memperbarui skill mereka dengan teknologi terkini.`,
  
  level: 'Pemula',
  duration: '12 minggu',
  totalHours: '48 jam',
  students: 1250,
  rating: 4.8,
  reviews: 324,
  price: 'Gratis',
  originalPrice: 'Rp 499.000',
  thumbnail: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=1200',
  category: 'Teknologi',
  lastUpdated: 'September 2024',
  language: 'Bahasa Indonesia',
  captions: ['Indonesia', 'English'],
  
  modules: [
    {
      id: 1,
      title: 'Pengenalan Web Development',
      description: 'Memahami dasar-dasar pengembangan web dan tools yang digunakan',
      lessons: 5,
      duration: '2 jam 30 menit',
      progress: 100,
      topics: [
        { id: 1, title: 'Apa itu Web Development?', duration: '15:30', type: 'video', isCompleted: true },
        { id: 2, title: 'Tools dan Environment Setup', duration: '25:45', type: 'video', isCompleted: true },
        { id: 3, title: 'Memahami Browser dan Developer Tools', duration: '20:15', type: 'video', isCompleted: true },
        { id: 4, title: 'Project: Setup Development Environment', duration: '45:00', type: 'project', isCompleted: true },
        { id: 5, title: 'Quiz: Fundamental Concepts', duration: '30 menit', type: 'quiz', isCompleted: true },
      ],
    },
    {
      id: 2,
      title: 'HTML Fundamental',
      description: 'Menguasai struktur dan semantic HTML untuk web modern',
      lessons: 8,
      duration: '4 jam 15 menit',
      progress: 75,
      topics: [
        { id: 6, title: 'Struktur Dasar HTML Document', duration: '18:20', type: 'video', isCompleted: true },
        { id: 7, title: 'HTML Tags dan Elements', duration: '25:30', type: 'video', isCompleted: true },
        { id: 8, title: 'Forms dan Input Elements', duration: '32:15', type: 'video', isCompleted: true },
        { id: 9, title: 'Semantic HTML5', duration: '28:45', type: 'video', isCompleted: true },
        { id: 10, title: 'Accessibility Best Practices', duration: '22:10', type: 'video', isCompleted: false },
        { id: 11, title: 'Project: Company Landing Page', duration: '1 jam 30 menit', type: 'project', isCompleted: false },
        { id: 12, title: 'Code Review Session', duration: '45:00', type: 'video', isCompleted: false },
        { id: 13, title: 'Quiz: HTML Mastery', duration: '45 menit', type: 'quiz', isCompleted: false },
      ],
    },
    {
      id: 3,
      title: 'CSS Styling dan Layout',
      description: 'Membuat design yang responsive dan modern dengan CSS',
      lessons: 10,
      duration: '6 jam 20 menit',
      progress: 20,
      topics: [
        { id: 14, title: 'CSS Basics dan Selectors', duration: '25:40', type: 'video', isCompleted: true },
        { id: 15, title: 'Box Model dan Positioning', duration: '35:20', type: 'video', isCompleted: true },
        { id: 16, title: 'Flexbox Layout', duration: '40:15', type: 'video', isCompleted: false },
        { id: 17, title: 'CSS Grid System', duration: '45:30', type: 'video', isCompleted: false },
        { id: 18, title: 'Responsive Design Principles', duration: '38:25', type: 'video', isCompleted: false },
        { id: 19, title: 'CSS Variables dan Custom Properties', duration: '28:10', type: 'video', isCompleted: false },
        { id: 20, title: 'Animations dan Transitions', duration: '32:45', type: 'video', isCompleted: false },
        { id: 21, title: 'Project: Responsive Portfolio', duration: '2 jam', type: 'project', isCompleted: false },
        { id: 22, title: 'CSS Framework Overview', duration: '35:20', type: 'video', isCompleted: false },
        { id: 23, title: 'Quiz: CSS Proficiency', duration: '1 jam', type: 'quiz', isCompleted: false },
      ],
    },
  ],

  features: [
    { icon: PlayCircle, text: '48 jam video on-demand' },
    { icon: Download, text: '100+ resources yang dapat diunduh' },
    { icon: MessageSquare, text: 'Akses forum diskusi premium' },
    { icon: Award, text: 'Sertifikat kelulusan resmi' },
    { icon: Globe, text: 'Akses seumur hidup' },
    { icon: Shield, text: 'Jaminan uang kembali 30 hari' },
  ],

  skills: ['HTML5', 'CSS3', 'JavaScript', 'Responsive Design', 'Web Accessibility', 'Git & GitHub', 'Developer Tools', 'Modern Workflow'],

  requirements: [
    'Koneksi internet yang stabil',
    'Laptop/PC dengan spesifikasi minimal 4GB RAM',
    'Text editor (VS Code recommended)',
    'Browser modern (Chrome, Firefox, Safari)',
    'Semangat belajar dan konsistensi',
  ],

  reviewList: [
    {
      id: 1,
      user: { name: 'Sarah Wijaya', avatar: 'https://i.pravatar.cc/150?img=1', role: 'UI Designer' },
      rating: 5,
      date: '2 minggu yang lalu',
      comment: 'Kursus yang sangat bagus! Penjelasannya detail dan mudah dipahami. Instrukturnya sangat responsif di forum.',
      likes: 24,
    },
    {
      id: 2,
      user: { name: 'Budi Pratama', avatar: 'https://i.pravatar.cc/150?img=2', role: 'Mahasiswa' },
      rating: 5,
      date: '1 bulan yang lalu',
      comment: 'Project-based learning-nya sangat membantu. Sekarang saya bisa buat website dari nol!',
      likes: 18,
    },
    {
      id: 3,
      user: { name: 'Maya Sari', avatar: 'https://i.pravatar.cc/150?img=3', role: 'Freelancer' },
      rating: 4,
      date: '3 minggu yang lalu',
      comment: 'Materinya up-to-date dan relevan dengan kebutuhan industri. Sangat recommended untuk pemula!',
      likes: 15,
    },
  ],
};

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const [enrolled, setEnrolled] = useState(false);
  const [activeModule, setActiveModule] = useState(1);

  const totalLessons = courseDetail.modules.reduce((acc, module) => acc + module.lessons, 0);
  const totalDuration = courseDetail.modules.reduce((acc, module) => {
    const hours = parseInt(module.duration.split(' ')[0]);
    return acc + hours;
  }, 0);

  const completedLessons = courseDetail.modules.flatMap(module => 
    module.topics.filter(topic => topic.isCompleted)
  ).length;

  const progress = Math.round((completedLessons / totalLessons) * 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/courses" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span>Kembali ke Katalog</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="flex items-center gap-2 border-gray-300 dark:border-gray-600">
                <Heart className="h-4 w-4" />
                Simpan
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2 border-gray-300 dark:border-gray-600">
                <Share2 className="h-4 w-4" />
                Bagikan
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6 animate-fadeIn">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {courseDetail.category}
                </Badge>
                <Badge variant="outline" className="border-gray-300 dark:border-gray-600">
                  {courseDetail.level}
                </Badge>
                <Badge variant="outline" className="border-gray-300 dark:border-gray-600">
                  <Clock className="h-3 w-3 mr-1" />
                  {courseDetail.duration}
                </Badge>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-gray-900 dark:text-white">
                {courseDetail.title}
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                {courseDetail.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">{courseDetail.rating}</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    ({courseDetail.reviews} ulasan)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Users className="h-5 w-5" />
                  {courseDetail.students.toLocaleString()} siswa
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="h-5 w-5" />
                  Terakhir update: {courseDetail.lastUpdated}
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Globe className="h-5 w-5" />
                  {courseDetail.language}
                </div>
              </div>

              {/* Instructor Card */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-gray-200 dark:border-gray-600">
                      <AvatarImage src={courseDetail.instructor.avatar} />
                      <AvatarFallback>{courseDetail.instructor.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Instruktur</p>
                      <p className="font-semibold text-gray-900 dark:text-white text-lg">
                        {courseDetail.instructor.name}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        {courseDetail.instructor.bio}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>⭐ {courseDetail.instructor.rating}/5.0 Rating</span>
                        <span>👨‍🏫 {courseDetail.instructor.courses} Kursus</span>
                        <span>🎓 {courseDetail.instructor.students.toLocaleString()} Siswa</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enrollment Card */}
            <div className="animate-scaleIn">
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 sticky top-24">
                <CardHeader className="p-0">
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <img
                      src={courseDetail.thumbnail}
                      alt={courseDetail.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {courseDetail.price}
                    </div>
                    {courseDetail.originalPrice && (
                      <div className="text-lg text-gray-600 dark:text-gray-400 line-through">
                        {courseDetail.originalPrice}
                      </div>
                    )}
                    <div className="text-green-600 dark:text-green-400 text-sm font-semibold mt-1">
                      ⚡ Limited Time Offer
                    </div>
                  </div>

                  <div className="space-y-3">
                    {enrolled ? (
                      <Link href={`/learn/${courseDetail.id}`}>
                        <Button className="w-full bg-[#005EB8] hover:bg-[#004A93] border-0 text-white" size="lg">
                          <PlayCircle className="mr-2 h-5 w-5" />
                          Lanjutkan Belajar
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        className="w-full bg-[#005EB8] hover:bg-[#004A93] border-0 text-white shadow-lg" 
                        size="lg"
                        onClick={() => setEnrolled(true)}
                      >
                        <PlayCircle className="mr-2 h-5 w-5" />
                        Daftar Sekarang
                      </Button>
                    )}
                    <Button variant="outline" className="w-full border-gray-300 dark:border-gray-600">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Tanya Instruktur
                    </Button>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                    <p className="font-semibold text-gray-900 dark:text-white text-lg">
                      Yang Anda dapatkan:
                    </p>
                    <div className="grid gap-3">
                      {courseDetail.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <feature.icon className="h-5 w-5 text-[#005EB8] flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Guarantee Badge */}
                  <Card className="rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            30-Day Money-Back Guarantee
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Puas atau uang kembali
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="curriculum" className="space-y-8">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-lg">
            <TabsTrigger value="curriculum" className="rounded-md">Kurikulum</TabsTrigger>
            <TabsTrigger value="overview" className="rounded-md">Overview</TabsTrigger>
            <TabsTrigger value="instructor" className="rounded-md">Instruktur</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-md">Ulasan</TabsTrigger>
          </TabsList>

          {/* Curriculum Tab */}
          <TabsContent value="curriculum" className="space-y-6">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">Konten Kursus</CardTitle>
                    <CardDescription>
                      {courseDetail.modules.length} modul • {totalLessons} pelajaran • {totalDuration} jam materi
                    </CardDescription>
                  </div>
                  {enrolled && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#008A00]">{progress}%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Progress</div>
                    </div>
                  )}
                </div>
                {enrolled && (
                  <Progress value={progress} className="h-2 bg-gray-200 dark:bg-gray-700" />
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {courseDetail.modules.map((module) => (
                  <Card
                    key={module.id}
                    className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#005EB8] rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {module.id}
                            </div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                              {module.title}
                            </h3>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {module.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              {module.lessons} pelajaran
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {module.duration}
                            </span>
                            {enrolled && (
                              <span className="flex items-center gap-1 text-[#008A00]">
                                <BarChart3 className="h-4 w-4" />
                                {module.progress}% selesai
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {module.topics.map((topic) => (
                          <div
                            key={topic.id}
                            className={`flex items-center gap-4 p-3 rounded-lg border transition-all duration-200 ${
                              topic.isCompleted
                                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                                : 'bg-gray-50 border-gray-200 dark:bg-gray-700/50 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              topic.isCompleted
                                ? 'bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                            }`}>
                              {topic.type === 'video' && <PlayCircle className="h-4 w-4" />}
                              {topic.type === 'quiz' && <BookOpen className="h-4 w-4" />}
                              {topic.type === 'project' && <Award className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium ${
                                topic.isCompleted
                                  ? 'text-green-900 dark:text-green-100'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {topic.title}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {topic.duration}
                              </p>
                            </div>
                            {topic.isCompleted && (
                              <CheckCircle2 className="h-5 w-5 text-[#008A00] flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Deskripsi Lengkap</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {courseDetail.fullDescription}
                  </p>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Yang akan Anda pelajari</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {courseDetail.skills.map((skill, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-[#008A00]" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Persyaratan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {courseDetail.requirements.map((req, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <div className="w-2 h-2 bg-[#005EB8] rounded-full"></div>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Kursus Ini Cocok Untuk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        'Pemula yang ingin memulai karir di web development',
                        'Profesional yang ingin memperbarui skill mereka',
                        'Mahasiswa yang membutuhkan skill tambahan',
                        'Freelancer yang ingin meningkatkan portofolio'
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-[#005EB8] dark:text-blue-400" />
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Instructor Tab */}
          <TabsContent value="instructor" className="space-y-6">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Tentang Instruktur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <Avatar className="h-24 w-24 border-2 border-[#005EB8]">
                    <AvatarImage src={courseDetail.instructor.avatar} />
                    <AvatarFallback>{courseDetail.instructor.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {courseDetail.instructor.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {courseDetail.instructor.bio}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-[#005EB8] dark:text-blue-400">
                            {courseDetail.instructor.rating}/5
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Rating Instruktur</div>
                        </CardContent>
                      </Card>
                      <Card className="rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-[#008A00] dark:text-green-400">
                            {courseDetail.instructor.students.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Total Siswa</div>
                        </CardContent>
                      </Card>
                      <Card className="rounded-lg border bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {courseDetail.instructor.courses}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Total Kursus</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Ulasan Siswa</CardTitle>
                <CardDescription>
                  {courseDetail.reviewList.length} dari {courseDetail.reviews} ulasan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Card className="rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-gray-900 dark:text-white">
                          {courseDetail.rating}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-6 w-6 ${
                                i < Math.floor(courseDetail.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {courseDetail.reviews} ulasan
                        </p>
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => (
                          <div key={star} className="flex items-center gap-3">
                            <div className="flex items-center gap-1 w-16">
                              <span className="text-sm text-gray-600 dark:text-gray-400">{star}</span>
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            </div>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-yellow-400 h-2 rounded-full" 
                                style={{ width: `${(star / 5) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                              {Math.round((star / 5) * courseDetail.reviews)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  {courseDetail.reviewList.map((review) => (
                    <Card key={review.id} className="rounded-lg border bg-card text-card-foreground shadow-sm border-gray-200 dark:border-gray-700">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarImage src={review.user.avatar} />
                            <AvatarFallback>{review.user.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {review.user.name}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {review.user.role}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {review.date}
                                </span>
                              </div>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                              {review.comment}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                              <button className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                <Heart className="h-4 w-4" />
                                {review.likes}
                              </button>
                              <button className="hover:text-gray-700 dark:hover:text-gray-300">
                                Balas
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}