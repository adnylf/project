"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RegisterPage, Testimonial } from "@/components/ui/register";

export default function RegisterPageComponent() {
  const [isLoading, setIsLoading] = useState(false);
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

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    // Mengambil data form dari event
    const formData = new FormData(event.currentTarget);
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const disabilityType = formData.get("disabilityType") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Simulasi loading
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);

    // Di sini Anda bisa menambahkan logika registrasi
    console.log("Register attempt:", {
      fullName,
      email,
      disabilityType,
      password,
      confirmPassword,
    });

    // Redirect setelah registrasi berhasil
    // router.push('/dashboard');
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <RegisterPage
      title="Buat Akun Baru"
      description="Daftar untuk memulai perjalanan pembelajaran Anda"
      heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
      testimonials={sampleTestimonials}
      onRegister={handleRegister}
      onLogin={handleLogin}
      isLoading={isLoading}
    />
  );
}
