'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, DollarSign, TrendingUp, Award, UserCheck, MoveVertical as MoreVertical } from 'lucide-react';

const recentUsers = [
  { id: 1, name: 'Ahmad Hidayat', email: 'ahmad@email.com', role: 'Siswa', status: 'Aktif', joined: '2024-01-15' },
  { id: 2, name: 'Sarah Putri', email: 'sarah@email.com', role: 'Mentor', status: 'Aktif', joined: '2024-01-14' },
  { id: 3, name: 'Budi Santoso', email: 'budi@email.com', role: 'Siswa', status: 'Aktif', joined: '2024-01-13' },
  { id: 4, name: 'Linda Wijaya', email: 'linda@email.com', role: 'Mentor', status: 'Pending', joined: '2024-01-12' },
];

const recentCourses = [
  { id: 1, title: 'Web Development Basics', mentor: 'Dr. Ahmad Fauzi', students: 1250, status: 'Aktif' },
  { id: 2, title: 'Graphic Design 101', mentor: 'Sarah Putri', students: 890, status: 'Aktif' },
  { id: 3, title: 'Digital Marketing', mentor: 'Maya Kusuma', students: 1500, status: 'Review' },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fadeIn">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard Admin
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Kelola platform dan pantau aktivitas sistem
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="stat-card animate-scaleIn">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">10,245</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Pengguna</p>
                <p className="text-xs text-success">+12% dari bulan lalu</p>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card animate-scaleIn delay-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-success" />
                </div>
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">542</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Kursus</p>
                <p className="text-xs text-success">+8% dari bulan lalu</p>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card animate-scaleIn delay-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-accent" />
                </div>
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">1.2B</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Pendapatan</p>
                <p className="text-xs text-success">+15% dari bulan lalu</p>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card animate-scaleIn delay-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">8,542</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sertifikat Diterbitkan</p>
                <p className="text-xs text-success">+20% dari bulan lalu</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card className="main-card animate-fadeSlide">
            <CardHeader>
              <CardTitle>Pengguna Terbaru</CardTitle>
              <CardDescription>Daftar pengguna yang baru bergabung</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUsers.map((user) => (
                    <TableRow key={user.id} className="table-row">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.status === 'Aktif' ? 'default' : 'secondary'}
                          className={user.status === 'Aktif' ? 'bg-success' : ''}
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="main-card animate-fadeSlide delay-200">
            <CardHeader>
              <CardTitle>Kursus Terbaru</CardTitle>
              <CardDescription>Kursus yang baru ditambahkan</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kursus</TableHead>
                    <TableHead>Siswa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCourses.map((course) => (
                    <TableRow key={course.id} className="table-row">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{course.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{course.mentor}</p>
                        </div>
                      </TableCell>
                      <TableCell>{course.students}</TableCell>
                      <TableCell>
                        <Badge
                          variant={course.status === 'Aktif' ? 'default' : 'secondary'}
                          className={course.status === 'Aktif' ? 'bg-success' : course.status === 'Review' ? 'bg-accent' : ''}
                        >
                          {course.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="main-card animate-fadeSlide delay-100">
            <CardHeader>
              <CardTitle>Distribusi Pengguna</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Siswa</span>
                  <span className="font-semibold text-gray-900 dark:text-white">8,542 (83%)</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '83%' }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Mentor</span>
                  <span className="font-semibold text-gray-900 dark:text-white">1,523 (15%)</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Admin</span>
                  <span className="font-semibold text-gray-900 dark:text-white">180 (2%)</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: '2%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="main-card animate-fadeSlide delay-200">
            <CardHeader>
              <CardTitle>Kategori Populer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Teknologi</span>
                <span className="font-semibold text-gray-900 dark:text-white">245 kursus</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Bisnis</span>
                <span className="font-semibold text-gray-900 dark:text-white">178 kursus</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Desain</span>
                <span className="font-semibold text-gray-900 dark:text-white">156 kursus</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Bahasa</span>
                <span className="font-semibold text-gray-900 dark:text-white">132 kursus</span>
              </div>
            </CardContent>
          </Card>

          <Card className="main-card animate-fadeSlide delay-300">
            <CardHeader>
              <CardTitle>Aktivitas Sistem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="h-4 w-4 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    45 pengguna baru
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Hari ini</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    12 kursus baru
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Minggu ini</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Award className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    234 sertifikat
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Bulan ini</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
