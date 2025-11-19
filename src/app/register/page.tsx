"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RegisterPage, Testimonial, RegisterFormData } from "@/components/ui/register";

export default function RegisterPageComponent() {
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

  const handleRegister = async (formData: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Terjadi kesalahan saat mendaftar');
      }

      // Registration successful
      console.log('Registrasi berhasil:', data);
      
      // Redirect to login page or dashboard
      router.push('/login');
      
    } catch (error) {
      console.error('Registrasi gagal:', error);
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat mendaftar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <div>
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
          {error}
          <button 
            onClick={() => setError(null)} 
            className="ml-4 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}
      
      <RegisterPage
        title="Buat Akun Baru"
        description="Daftar untuk memulai perjalanan pembelajaran Anda"
        heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
        testimonials={sampleTestimonials}
        onRegister={handleRegister}
        onLogin={handleLogin}
        isLoading={isLoading}
      />
    </div>
  );
}