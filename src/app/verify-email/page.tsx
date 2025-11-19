"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmailVerificationPage } from "@/components/ui/email-verification";

export default function VerifyEmailPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    // Jika ada token di URL, langsung verifikasi
    if (token) {
      handleVerifyEmail(token);
    }
  }, [token]);

  const handleVerifyEmail = async (verificationToken: string) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/verify-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: verificationToken }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Terjadi kesalahan saat verifikasi email"
        );
      }

      setIsSuccess(true);
      setMessage(
        "Email berhasil diverifikasi! Anda sekarang dapat masuk ke akun Anda."
      );
    } catch (error) {
      console.error("Verifikasi email gagal:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat verifikasi email"
      );
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async (email: string) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/resend-verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Terjadi kesalahan saat mengirim ulang verifikasi"
        );
      }

      setMessage(
        "Email verifikasi telah dikirim ulang. Silakan cek inbox email Anda."
      );
    } catch (error) {
      console.error("Gagal mengirim ulang verifikasi:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengirim ulang verifikasi"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <div>
      <EmailVerificationPage
        title="Verifikasi Email Anda"
        description="Kami telah mengirimkan link verifikasi ke email Anda"
        heroImageSrc="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=2160&q=80"
        isLoading={isLoading}
        message={message}
        isSuccess={isSuccess}
        onResendVerification={handleResendVerification}
        onLogin={handleLogin}
        token={token}
      />
    </div>
  );
}
