'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  User, 
  BookOpen,
  ArrowLeft,
  Loader2,
  Shield
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';

const API_BASE_URL = 'http://localhost:3000/api';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  price: number;
  discount_price: number | null;
  is_free: boolean;
  level: string;
  total_duration: number;
  total_lectures: number;
  mentor: {
    user: {
      full_name: string;
    };
  };
  category: {
    name: string;
  };
}

declare global {
  interface Window {
    snap: {
      pay: (token: string, options: {
        onSuccess: (result: unknown) => void;
        onPending: (result: unknown) => void;
        onError: (result: unknown) => void;
        onClose: () => void;
      }) => void;
    };
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}j ${mins}m` : `${hours} jam`;
};

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapLoaded, setSnapLoaded] = useState(false);

  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || localStorage.getItem('accessToken');
    }
    return null;
  }, []);

  // Fetch course details
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}`);

        if (!response.ok) {
          throw new Error('Kursus tidak ditemukan');
        }

        const data = await response.json();
        setCourse(data.course || data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  // Handle payment
  const handlePayment = async () => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login?redirect=/checkout/' + courseId);
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ course_id: courseId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal membuat transaksi');
      }

      // If free course, redirect to success
      if (result.is_free) {
        router.push(`/user/courses/${courseId}/success`);
        return;
      }

      // Open Midtrans Snap
      if (result.token && window.snap) {
        window.snap.pay(result.token, {
          onSuccess: () => {
            router.push(`/user/courses/${courseId}/success`);
          },
          onPending: () => {
            router.push(`/user/courses/${courseId}/pending`);
          },
          onError: () => {
            setError('Pembayaran gagal');
          },
          onClose: () => {
            setProcessing(false);
          },
        });
      } else if (result.payment_url) {
        // Fallback to redirect
        window.location.href = result.payment_url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses pembayaran');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#005EB8] mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Memuat...</p>
        </div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="text-red-500 mb-4">⚠️</div>
            <p className="text-red-600">{error}</p>
            <Link href="/courses">
              <Button className="mt-4">Kembali ke Kursus</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!course) return null;

  const finalPrice = course.discount_price || course.price;
  const discount = course.discount_price ? course.price - course.discount_price : 0;

  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        onLoad={() => setSnapLoaded(true)}
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href={`/courses/${course.slug || course.id}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
                <span>Kembali</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Checkout
            </h1>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Course Details */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Detail Pesanan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          oleh {course.mentor?.user?.full_name}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <Badge variant="secondary">{course.category?.name}</Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDuration(course.total_duration)}
                          </span>
                          <span>{course.total_lectures} materi</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Jaminan Keamanan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Akses Selamanya</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Belajar kapan saja tanpa batas waktu
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Sertifikat</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Dapatkan sertifikat setelah selesai
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Pembayaran Aman</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Diproses oleh Midtrans
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Support 24/7</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Bantuan kapan saja Anda butuhkan
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Summary */}
              <div>
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Ringkasan Pembayaran
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Harga Kursus</span>
                        <span className="text-gray-900 dark:text-white">
                          {formatCurrency(course.price)}
                        </span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">Diskon</span>
                          <span className="text-green-600">-{formatCurrency(discount)}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                        <span className="text-2xl font-bold text-[#005EB8]">
                          {course.is_free ? 'Gratis' : formatCurrency(finalPrice)}
                        </span>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                      </div>
                    )}

                    <Button
                      className="w-full bg-[#005EB8] hover:bg-[#004A93]"
                      size="lg"
                      onClick={handlePayment}
                      disabled={processing || (!snapLoaded && !course.is_free)}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          {course.is_free ? 'Daftar Gratis' : 'Bayar Sekarang'}
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                      Dengan melanjutkan, Anda menyetujui Syarat & Ketentuan kami
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
