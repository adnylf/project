import Link from "next/link";
import NeuButton from "@/components/ui/new-button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-success/5 to-accent/5 dark:from-primary/10 dark:via-success/10 dark:to-accent/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-800 shadow-sm">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Mulai Perjalanan Belajar Anda
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
            Siap untuk Memulai Pembelajaran Anda?
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan pelajar lainnya dan dapatkan akses ke
            ratusan kursus berkualitas dengan fitur aksesibilitas lengkap. Mulai
            gratis hari ini!
          </p>

          {/* Updated Button Container */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/register" className="w-full sm:w-auto">
              <NeuButton className="group flex items-center justify-center gap-2 w-full sm:w-auto">
                Daftar Sekarang
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </NeuButton>
            </Link>
            <Link href="/courses" className="w-full sm:w-auto">
              <NeuButton className="flex items-center justify-center gap-2 w-full sm:w-auto">
                Lihat Semua Kursus
              </NeuButton>
            </Link>
          </div>

          <div className="pt-8 flex flex-wrap justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success"></div>
              <span>Gratis untuk memulai</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success"></div>
              <span>Tidak perlu kartu kredit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success"></div>
              <span>Akses selamanya</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}