import { 
  Users, 
  BookOpen, 
  Trophy, 
  Star 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const stats = [
  {
    icon: Users,
    value: '10,000+',
    label: 'Siswa Aktif',
    description: 'Bergabung dalam komunitas pembelajaran',
  },
  {
    icon: BookOpen,
    value: '500+',
    label: 'Kursus Tersedia',
    description: 'Berbagai topik dan tingkat kesulitan',
  },
  {
    icon: Trophy,
    value: '8,500+',
    label: 'Sertifikat Diterbitkan',
    description: 'Pengakuan pencapaian belajar',
  },
  {
    icon: Star,
    value: '4.9/5',
    label: 'Rating Pengguna',
    description: 'Kepuasan dari ribuan ulasan',
  },
];

export default function StatsSection() {
  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fadeIn">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Dipercaya oleh Ribuan Pelajar
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Bergabunglah dengan komunitas pembelajaran yang terus berkembang dan raih tujuan pendidikan Anda.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 text-center"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-8 space-y-4">
                <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stat.label}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}