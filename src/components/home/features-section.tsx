import { 
  Accessibility, 
  Volume2, 
  Type, 
  Keyboard, 
  Languages, 
  Award,
  LucideIcon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

const features: Feature[] = [
  {
    icon: Accessibility,
    title: 'Screen Reader Support',
    description: 'Dukungan penuh untuk pembaca layar membantu pengguna tunanetra mengakses semua konten dengan mudah.',
    color: 'text-[#005EB8]',
    bgColor: 'bg-[#005EB8]/10',
  },
  {
    icon: Volume2,
    title: 'Subtitle & Transkrip',
    description: 'Semua video dilengkapi subtitle dan transkrip lengkap untuk pengguna tunarungu.',
    color: 'text-[#008A00]',
    bgColor: 'bg-[#008A00]/10',
  },
  {
    icon: Type,
    title: 'Ukuran Teks Fleksibel',
    description: 'Sesuaikan ukuran teks sesuai kenyamanan Anda untuk pengalaman belajar yang optimal.',
    color: 'text-[#F4B400]',
    bgColor: 'bg-[#F4B400]/10',
  },
  {
    icon: Keyboard,
    title: 'Navigasi Keyboard',
    description: 'Navigasi lengkap menggunakan keyboard untuk aksesibilitas maksimal tanpa mouse.',
    color: 'text-[#005EB8]',
    bgColor: 'bg-[#005EB8]/10',
  },
  {
    icon: Languages,
    title: 'Bahasa Isyarat',
    description: 'Video instruksi dengan interpreter bahasa isyarat untuk pemahaman yang lebih baik.',
    color: 'text-[#008A00]',
    bgColor: 'bg-[#008A00]/10',
  },
  {
    icon: Award,
    title: 'Sertifikat Resmi',
    description: 'Dapatkan sertifikat resmi yang diakui setelah menyelesaikan kursus.',
    color: 'text-[#F4B400]',
    bgColor: 'bg-[#F4B400]/10',
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-16 lg:py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fadeIn">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#005EB8]/10 text-[#005EB8] text-sm font-medium mb-4">
            <Accessibility className="h-4 w-4" />
            Fitur Aksesibilitas
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Fitur Aksesibilitas Lengkap
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Kami berkomitmen menyediakan pengalaman belajar yang inklusif untuk semua orang dengan berbagai kebutuhan aksesibilitas.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="h-full rounded-lg border bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 border-gray-200 dark:border-gray-700 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6 space-y-4 h-full flex flex-col">
                {/* Icon */}
                <div className={`h-12 w-12 rounded-lg ${feature.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                
                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                
                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed flex-grow text-sm">
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