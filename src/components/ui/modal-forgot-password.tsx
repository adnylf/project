import React from 'react';
import { X, CheckCircle2, ArrowLeft, Mail, Clock, RefreshCw, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SuccessModalProps {
  email: string;
  onClose: () => void;
  onBackToLogin: () => void;
  isOpen: boolean;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  email,
  onClose,
  onBackToLogin,
  isOpen,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <Card 
        className="relative w-full max-w-2xl rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header kompak */}
        <div className="bg-green-50 dark:bg-green-900/20 px-6 py-4 border-b border-green-100 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 dark:bg-green-800 rounded-full">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Reset Password Berhasil!
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Instruksi reset password telah dikirim
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Konten utama - lebih kompak */}
        <CardContent className="p-6 flex flex-col md:flex-row gap-6">
          {/* Bagian kiri - Konfirmasi email */}
          <div className="flex-1">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Detail Pengiriman
                </h3>
              </div>
              
              <Card className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <CardContent className="p-4">
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email yang dituju</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white break-all">{email}</p>
                  </div>
                  
                  <Card className="rounded-md border bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
                    <CardContent className="p-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Link reset password telah dikirim ke{' '}
                        <strong className="text-blue-600 dark:text-blue-400">{email}</strong>.
                        Silakan cek email Anda.
                      </p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>

            {/* Tombol aksi untuk mobile */}
            <div className="md:hidden flex flex-col gap-2 mt-4">
              <button
                onClick={onBackToLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg py-3 px-4 text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Login
              </button>
              
              <button
                onClick={onClose}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg py-3 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-all"
              >
                Tutup
              </button>
            </div>
          </div>

          {/* Bagian kanan - Tips */}
          <div className="flex-1">
            <Card className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                      <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">
                      Tips dan Informasi
                    </h3>
                  </div>
                </div>
                
                <div className="space-y-4 mb-6">
                  <Card className="rounded-md border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md flex-shrink-0 mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Periksa Spam/Junk</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Cek folder spam jika tidak ada di inbox
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-md border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-md flex-shrink-0 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Link kadaluarsa</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Berlaku 1 jam dari waktu pengiriman
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-md border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-md flex-shrink-0 mt-0.5">
                          <RefreshCw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Tidak menerima?</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Kirim ulang permintaan setelah 5 menit
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tombol aksi untuk desktop */}
                <div className="hidden md:flex flex-col gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={onBackToLogin}
                    className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg py-3 px-4 text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Kembali ke Login
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg py-3 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-all"
                  >
                    Tutup
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
        
        {/* Footer kompak */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Butuh bantuan? Hubungi support@email.com
          </p>
        </div>
      </Card>
    </div>
  );
};