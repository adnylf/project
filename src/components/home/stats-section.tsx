import { 
  Users, 
  BookOpen, 
  Award, 
  Star,
  TrendingUp,
  LucideIcon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Stat {
  icon: LucideIcon;
  value: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

const stats: Stat[] = [
  {
    icon: Users,
    value: '10,000+',
    label: 'Siswa Aktif',
    description: 'Bergabung dalam komunitas',
    color: 'text-[#005EB8]',
    bgColor: 'bg-[#005EB8]/10',
  },
  {
    icon: BookOpen,
    value: '500+',
    label: 'Kursus Tersedia',
    description: 'Berbagai topik & level',
    color: 'text-[#008A00]',
    bgColor: 'bg-[#008A00]/10',
  },
  {
    icon: Award,
    value: '8,500+',
    label: 'Sertifikat',
    description: 'Telah diterbitkan',
    color: 'text-[#F4B400]',
    bgColor: 'bg-[#F4B400]/10',
  },
  {
    icon: Star,
    value: '4.9/5',
    label: 'Rating',
    description: 'Dari ribuan ulasan',
    color: 'text-[#005EB8]',
    bgColor: 'bg-[#005EB8]/10',
  },
];

export default function StatsSection() {
  return (
    <section className="py-16 lg:py-20 bg-gray-50 dark:bg-gray-800/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fadeIn">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#008A00]/10 text-[#008A00] text-sm font-medium mb-4">
            <TrendingUp className="h-4 w-4" />
            Statistik Platform
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Dipercaya oleh Ribuan Pelajar
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Bergabunglah dengan komunitas pembelajaran yang terus berkembang dan raih tujuan pendidikan Anda.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="rounded-lg border bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 border-gray-200 dark:border-gray-700 text-center group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6 space-y-3">
                {/* Icon */}
                <div className={`h-14 w-14 mx-auto rounded-lg ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`h-7 w-7 ${stat.color}`} />
                </div>
                
                {/* Value */}
                <div className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                
                {/* Label */}
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {stat.label}
                </h3>
                
                {/* Description */}
                <p className="text-sm text-gray-500 dark:text-gray-400">
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