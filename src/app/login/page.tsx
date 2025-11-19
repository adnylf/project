"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignInPage, Testimonial, LoginCredentials } from "@/components/ui/login";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Sample testimonials data
  const sampleTestimonials: Testimonial[] = [
    {
      avatarSrc: "https://randomuser.me/api/portraits/women/57.jpg",
      name: "Sarah Chen",
      handle: "@sarahdigital",
      text: "Platform yang luar biasa! Pengalaman pengguna sangat lancar dan fiturnya tepat sesuai yang saya butuhkan.",
    },
    {
      avatarSrc: "https://randomuser.me/api/portraits/men/64.jpg",
      name: "Marcus Johnson",
      handle: "@marcustech",
      text: "Layanan ini telah mengubah cara saya bekerja. Desain bersih, fitur powerful, dan dukungan yang excellent.",
    },
    {
      avatarSrc: "https://randomuser.me/api/portraits/men/32.jpg",
      name: "David Martinez",
      handle: "@davidcreates",
      text: "Saya sudah mencoba banyak platform, tapi yang ini benar-benar menonjol. Intuitif, reliable, dan sangat membantu produktivitas.",
    },
  ];

  const handleSignIn = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Terjadi kesalahan saat login');
      }

      // Login successful
      console.log('Login berhasil:', data);
      
      // Simpan token jika ada (sesuai response backend)
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Redirect ke dashboard setelah login berhasil
      router.push('/user/dashboard');
      
    } catch (error) {
      console.error('Login gagal:', error);
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = () => {
    router.push("/forgot-password");
  };

  const handleCreateAccount = () => {
    router.push("/register");
  };

  return (
    <SignInPage
      title="Selamat Datang Kembali"
      description="Masuk ke akun Anda untuk melanjutkan pembelajaran"
      heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
      testimonials={sampleTestimonials}
      onSignIn={handleSignIn}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
      isLoading={isLoading}
      error={error}
    />
  );
}