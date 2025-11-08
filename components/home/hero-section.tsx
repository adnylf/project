"use client";

import Link from "next/link";
import NeuButton from "@/components/ui/new-button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRight, 
  Play, 
  Users, 
  Trophy, 
  BookOpen 
} from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fadeIn">
            <div className="inline-block">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Trophy className="h-4 w-4" />
                Platform Pembelajaran Inklusif
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
              Belajar Tanpa Batas untuk{" "}
              <span className="text-primary">Semua Orang</span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Platform pembelajaran online yang dirancang khusus dengan fitur
              aksesibilitas lengkap. Belajar dengan nyaman sesuai kebutuhan
              Anda, kapan saja dan di mana saja.
            </p>

            {/* Updated Button Container */}
            <div className="flex flex-wrap gap-4">
              <Link href="/register" className="flex-1 min-w-[200px]">
                <NeuButton className="group flex items-center justify-center gap-2 w-full">
                  Mulai Belajar Gratis
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </NeuButton>
              </Link>
              <Link href="/courses" className="flex-1 min-w-[200px]">
                <NeuButton className="group flex items-center justify-center gap-2 w-full">
                  <Play className="h-5 w-5" />
                  Jelajahi Kursus
                </NeuButton>
              </Link>
            </div>

            {/* Updated Statistics Section */}
            <div className="grid grid-cols-3 gap-2 sm:gap-6 pt-8 border-t">
              <div className="space-y-1 text-center">
                <div className="stat-number text-2xl sm:text-3xl">
                  <NumberTicker value={10000} />+
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Siswa Aktif
                </p>
              </div>
              <div className="space-y-1 text-center">
                <div className="stat-number text-2xl sm:text-3xl">
                  <NumberTicker value={500} />+
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Kursus
                </p>
              </div>
              <div className="space-y-1 text-center">
                <div className="stat-number text-2xl sm:text-3xl">
                  <NumberTicker value={95} />%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Kepuasan
                </p>
              </div>
            </div>
          </div>

          <div className="relative animate-fadeIn delay-200">
            {/* Card Utama */}
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="aspect-[4/3] w-full overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-success/20 flex items-center justify-center">
                  <div className="text-center space-y-4 p-8">
                    <BookOpen className="h-24 w-24 mx-auto text-primary animate-float" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      Akses Pembelajaran Inklusif
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Card Kecil Kanan Bawah - Diperbaiki untuk mobile/tablet */}
            <Card className="absolute -bottom-4 -right-4 lg:-bottom-6 lg:-right-6 animate-scaleIn delay-400 rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 w-[180px] sm:w-[200px] lg:w-auto">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                      Komunitas Aktif
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      Bergabung bersama ribuan pelajar
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Kecil Kiri Atas - Diperbaiki untuk mobile/tablet */}
            <Card className="absolute -top-4 -left-4 lg:-top-6 lg:-left-6 animate-scaleIn delay-300 rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md border-gray-200 dark:border-gray-700 w-[180px] sm:w-[200px] lg:w-auto">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                      Sertifikat Resmi
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      Dapatkan pengakuan kemampuan
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}