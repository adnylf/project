"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SignInPage,
  Testimonial,
  LoginCredentials,
} from "@/components/ui/login";
import SweetAlert, { AlertType } from "@/components/ui/sweet-alert";
export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    type: AlertType;
    title: string;
    message: string;
  }>({
    type: "success",
    title: "",
    message: "",
  });
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
  const showSweetAlert = (type: AlertType, title: string, message: string) => {
    setAlertConfig({ type, title, message });
    setShowAlert(true);
  };
  const handleSignIn = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      if (!response.ok) {
        // Map backend errors to user-friendly messages
        let errorMessage = "Terjadi kesalahan saat login";
        // Handle specific error messages from backend
        if (
          data.message?.includes("Invalid email or password") ||
          data.error?.includes("Invalid email or password")
        ) {
          errorMessage = "Email atau password salah";
        } else if (
          data.message?.includes("Account is suspended or inactive") ||
          data.error?.includes("Account is suspended or inactive")
        ) {
          errorMessage = "Akun dinonaktifkan sementara";
        } else if (
          data.message?.includes("Too many requests") ||
          data.error?.includes("Too many requests")
        ) {
          errorMessage =
            "Terlalu banyak percobaan login, coba lagi dalam 15 menit";
        } else if (
          data.message?.includes("User not found") ||
          data.error?.includes("User not found")
        ) {
          errorMessage = "Email tidak terdaftar";
        }
        setError(errorMessage);
        return;
      }
      // Login successful - debug the response structure
      console.log("Login response structure:", JSON.stringify(data, null, 2));
      
      // Extract tokens - handle different possible response structures
      let tokens = null;
      if (data.tokens) {
        tokens = data.tokens;
      } else if (data.data?.tokens) {
        tokens = data.data.tokens;
      } else if (data.payload?.tokens) {
        tokens = data.payload.tokens;
      }

      // Save auth tokens and user data
      if (tokens?.accessToken) {
        localStorage.setItem("accessToken", tokens.accessToken);
        document.cookie = `accessToken=${tokens.accessToken}; path=/; max-age=86400`;
      }
      if (tokens?.refreshToken) {
        localStorage.setItem("refreshToken", tokens.refreshToken);
        document.cookie = `refreshToken=${tokens.refreshToken}; path=/; max-age=604800`;
      }
      
      // Extract user data - handle different possible response structures
      let userData = null;
      if (data.user) {
        userData = data.user;
      } else if (data.data?.user) {
        userData = data.data.user;
      } else if (data.payload?.user) {
        userData = data.payload.user;
      }
      
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
        document.cookie = `user=${encodeURIComponent(
          JSON.stringify(userData)
        )}; path=/; max-age=86400`;
        // Get the role from user data - handle different possible structures
        const role = userData.role || userData.user_role || userData.user?.role;
        console.log("User data:", userData);
        console.log("Detected role:", role);
        // Show success notification
        showSweetAlert(
          "success",
          "Login Berhasil!",
          "Login berhasil! Selamat datang kembali."
        );
        // Redirect based on role after delay for notification
        setTimeout(() => {
          if (role && role.toUpperCase() === "ADMIN") {
            router.push("/admin/dashboard");
          } else if (role && role.toUpperCase() === "MENTOR") {
            router.push("/mentor/dashboard");
          } else {
            router.push("/user/dashboard");
          }
        }, 2000);
        return;
      }
      // Fallback if user data is not found in expected structure
      console.error("User data not found in response structure");
      setError("Terjadi kesalahan saat memproses data login");
    } catch (error) {
      console.error("Login gagal:", error);
      setError("Terjadi kesalahan saat login");
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
    <div>
      {/* Sweet Alert Component for success notification */}
      <SweetAlert
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        show={showAlert}
        onClose={() => setShowAlert(false)}
        duration={alertConfig.type === "success" ? 2000 : 5000}
        showCloseButton={false}
      />
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
    </div>
  );
}