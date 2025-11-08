import Link from 'next/link';
import { BookOpen, Mail, Phone, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-primary">EduAccess</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Platform pembelajaran online yang dirancang khusus untuk penyandang disabilitas dengan fitur aksesibilitas lengkap.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-gray-600 hover:text-primary transition-colors dark:text-gray-400">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-600 hover:text-primary transition-colors dark:text-gray-400">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-600 hover:text-primary transition-colors dark:text-gray-400">
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4 dark:text-white">Tentang</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-gray-600 hover:text-primary transition-colors dark:text-gray-400">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="/courses" className="text-sm text-gray-600 hover:text-primary transition-colors dark:text-gray-400">
                  Kursus
                </Link>
              </li>
              <li>
                <Link href="/instructors" className="text-sm text-gray-600 hover:text-primary transition-colors dark:text-gray-400">
                  Instruktur
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-gray-600 hover:text-primary transition-colors dark:text-gray-400">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4 dark:text-white">Dukungan</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-sm text-gray-600 hover:text-primary transition-colors dark:text-gray-400">
                  Pusat Bantuan
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="text-sm text-gray-600 hover:text-primary transition-colors dark:text-gray-400">
                  Aksesibilitas
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-primary transition-colors dark:text-gray-400">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-primary transition-colors dark:text-gray-400">
                  Syarat & Ketentuan
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4 dark:text-white">Kontak</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-5 w-5 flex-shrink-0 text-primary" />
                <span>Jl. Pendidikan No. 123, Jakarta, Indonesia</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Phone className="h-5 w-5 text-primary" />
                <span>+62 21 1234 5678</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Mail className="h-5 w-5 text-primary" />
                <span>info@eduaccess.id</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            &copy; {new Date().getFullYear()} EduAccess. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
