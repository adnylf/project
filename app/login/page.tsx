"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignInPage, Testimonial } from "@/components/ui/login";

export default function LoginPage() {
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

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    // Mengambil data form dari event
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Simulasi loading
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);

    // Di sini Anda bisa menambahkan logika autentikasi
    console.log("Login attempt:", { email, password });

    // Redirect setelah login berhasil
    // router.push('/dashboard');
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
    />
  );
}
