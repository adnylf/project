import { 
  Eye, 
  Volume2, 
  Settings, 
  Terminal, 
  MessageCircle, 
  Trophy 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Eye,
    title: 'Screen Reader Support',
    description: 'Dukungan penuh untuk pembaca layar membantu pengguna tunanetra mengakses semua konten dengan mudah.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Volume2,
    title: 'Subtitle & Transkrip',
    description: 'Semua video dilengkapi subtitle dan transkrip lengkap untuk pengguna tunarungu.',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    icon: Settings,
    title: 'Ukuran Teks Fleksibel',
    description: 'Sesuaikan ukuran teks sesuai kenyamanan Anda untuk pengalaman belajar yang optimal.',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    icon: Terminal,
    title: 'Navigasi Keyboard',
    description: 'Navigasi lengkap menggunakan keyboard untuk aksesibilitas maksimal tanpa mouse.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: MessageCircle,
    title: 'Bahasa Isyarat',
    description: 'Video instruksi dengan interpreter bahasa isyarat untuk pemahaman yang lebih baik.',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    icon: Trophy,
    title: 'Sertifikat Resmi',
    description: 'Dapatkan sertifikat resmi yang diakui setelah menyelesaikan kursus.',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fadeIn">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Fitur Aksesibilitas Lengkap
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Kami berkomitmen menyediakan pengalaman belajar yang inklusif untuk semua orang dengan berbagai kebutuhan aksesibilitas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="h-full rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6 space-y-4 h-full flex flex-col">
                <div className={`h-14 w-14 rounded-xl ${feature.bgColor} flex items-center justify-center`}>
                  <feature.icon className={`h-7 w-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed flex-grow">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}