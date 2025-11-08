'use client';

import { use } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Clock, Users, Star, CircleCheck as CheckCircle2, CirclePlay as PlayCircle, Download, Award, MessageSquare } from 'lucide-react';
import Link from 'next/link';

const courseDetail = {
  id: 1,
  title: 'Dasar-Dasar Pemrograman Web',
  instructor: {
    name: 'Dr. Ahmad Fauzi',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
    bio: 'Dosen dan praktisi web development dengan 15 tahun pengalaman',
  },
  description: 'Kursus komprehensif untuk mempelajari pemrograman web dari dasar. Anda akan belajar HTML, CSS, dan JavaScript dengan pendekatan praktis dan project-based learning.',
  level: 'Pemula',
  duration: '12 minggu',
  students: 1250,
  rating: 4.8,
  reviews: 324,
  price: 'Gratis',
  thumbnail: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=1200',
  category: 'Teknologi',
  modules: [
    {
      id: 1,
      title: 'Pengenalan Web Development',
      lessons: 5,
      duration: '2 jam',
      topics: [
        'Apa itu Web Development?',
        'Tools yang Dibutuhkan',
        'Setup Environment',
        'Hello World Project',
        'Quiz Modul 1',
      ],
    },
    {
      id: 2,
      title: 'HTML Fundamental',
      lessons: 8,
      duration: '4 jam',
      topics: [
        'Struktur HTML',
        'Tags dan Elements',
        'Forms dan Input',
        'Semantic HTML',
        'Accessibility',
        'Project: Landing Page',
        'Quiz Modul 2',
      ],
    },
    {
      id: 3,
      title: 'CSS Styling',
      lessons: 10,
      duration: '5 jam',
      topics: [
        'CSS Basics',
        'Selectors dan Properties',
        'Box Model',
        'Flexbox',
        'Grid Layout',
        'Responsive Design',
        'Animations',
        'Project: Portfolio Page',
        'Quiz Modul 3',
      ],
    },
  ],
  features: [
    'Video pembelajaran berkualitas HD',
    'Subtitle dan transkrip lengkap',
    'Materi yang dapat diunduh',
    'Forum diskusi dengan instruktur',
    'Sertifikat setelah selesai',
    'Akses selamanya',
  ],
};

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-br from-primary/10 via-success/10 to-accent/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6 animate-fadeIn">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{courseDetail.category}</Badge>
                <Badge variant="outline">{courseDetail.level}</Badge>
              </div>

              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {courseDetail.title}
              </h1>

              <p className="text-lg text-gray-600 dark:text-gray-400">
                {courseDetail.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-accent text-accent" />
                  <span className="font-semibold">{courseDetail.rating}</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    ({courseDetail.reviews} ulasan)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Users className="h-5 w-5" />
                  {courseDetail.students} siswa
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock className="h-5 w-5" />
                  {courseDetail.duration}
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={courseDetail.instructor.avatar} />
                  <AvatarFallback>{courseDetail.instructor.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Instruktur</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {courseDetail.instructor.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {courseDetail.instructor.bio}
                  </p>
                </div>
              </div>
            </div>

            <div className="animate-scaleIn">
              <Card className="sticky top-8">
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
                    <div className="text-4xl font-bold text-primary mb-2">
                      {courseDetail.price}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Link href="/user/dashboard" className="block">
                      <Button className="w-full" size="lg">
                        <PlayCircle className="mr-2 h-5 w-5" />
                        Daftar Kursus
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Tanya Instruktur
                    </Button>
                  </div>

                  <div className="border-t pt-6 space-y-3">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Yang Anda dapatkan:
                    </p>
                    {courseDetail.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="modules" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="modules">Modul</TabsTrigger>
            <TabsTrigger value="reviews">Ulasan</TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="space-y-6">
            <Card className="animate-fadeSlide">
              <CardHeader>
                <CardTitle>Konten Kursus</CardTitle>
                <CardDescription>
                  {courseDetail.modules.length} modul • {courseDetail.modules.reduce((acc, m) => acc + m.lessons, 0)} pelajaran
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {courseDetail.modules.map((module, index) => (
                  <div
                    key={module.id}
                    className="border rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                          Modul {module.id}: {module.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {module.lessons} pelajaran
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {module.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ul className="space-y-2 pl-4">
                      {module.topics.map((topic, topicIndex) => (
                        <li
                          key={topicIndex}
                          className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card className="animate-fadeSlide">
              <CardHeader>
                <CardTitle>Ulasan Siswa</CardTitle>
                <CardDescription>
                  {courseDetail.reviews} ulasan dari siswa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-gray-900 dark:text-white">
                      {courseDetail.rating}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-5 w-5 fill-accent text-accent"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {courseDetail.reviews} ulasan
                    </p>
                  </div>
                </div>

                <div className="space-y-6 border-t pt-6">
                  {[1, 2, 3].map((review) => (
                    <div key={review} className="space-y-3">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={`https://i.pravatar.cc/150?img=${review}`} />
                          <AvatarFallback>U{review}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              User {review}
                            </p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-4 w-4 fill-accent text-accent"
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Kursus yang sangat bagus! Materinya mudah dipahami dan instrukturnya sangat responsif.
                          </p>
                        </div>
                      </div>
                    </div>
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
