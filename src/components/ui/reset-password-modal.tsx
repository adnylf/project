import React from 'react';
import { X, CheckCircle2, ArrowLeft, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ResetPasswordSuccessModalProps {
  onClose: () => void;
  onBackToLogin: () => void;
  isOpen: boolean;
}

export const ResetPasswordSuccessModal: React.FC<ResetPasswordSuccessModalProps> = ({
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
        {/* Header */}
        <div className="bg-green-50 dark:bg-green-900/20 px-6 py-4 border-b border-green-100 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 dark:bg-green-800 rounded-full">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Password Berhasil Diubah!
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Anda dapat login dengan password baru Anda
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

        {/* Main Content */}
        <CardContent className="p-6 flex flex-col md:flex-row gap-6">
          {/* Left Section - Confirmation */}
          <div className="flex-1">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Konfirmasi Perubahan
                </h3>
              </div>
              
              <Card className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Password Anda telah berhasil diubah. 
                    Anda sekarang dapat menggunakan password baru untuk login ke akun Anda.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Action Buttons */}
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

          {/* Right Section - Security Tips */}
          <div className="flex-1">
            <Card className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                      <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">
                      Tips Keamanan
                    </h3>
                  </div>
                </div>
                
                <div className="space-y-4 mb-6">
                  <Card className="rounded-md border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Simpan Password</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Simpan password baru Anda di tempat yang aman
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-md border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-md flex-shrink-0 mt-0.5">
                          <ArrowLeft className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Login Ulang</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Gunakan password baru Anda untuk login
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-md border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-md flex-shrink-0 mt-0.5">
                          <X className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Jangan Berikan</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Jangan bagikan password Anda kepada siapapun
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Desktop Action Buttons */}
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
        
        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Butuh bantuan? Hubungi support@email.com
          </p>
        </div>
      </Card>
    </div>
  );
};