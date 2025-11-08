"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ForgotPasswordPage,
  Testimonial,
} from "@/components/ui/forgot-password";

export default function ForgotPasswordPageComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    // Mengambil data form dari event
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;

    // Simulasi loading
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsSuccess(true);

    // Di sini Anda bisa menambahkan logika reset password
    console.log("Reset password request for:", email);
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  return (
    <ForgotPasswordPage
      title="Lupa Password"
      description="Masukkan email Anda untuk reset password"
      successDescription="Kami telah mengirimkan instruksi reset password"
      heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
      testimonials={sampleTestimonials}
      onSubmit={handleSubmit}
      onBackToLogin={handleBackToLogin}
      isLoading={isLoading}
      isSuccess={isSuccess}
    />
  );
}
