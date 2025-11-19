import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface RegisterPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onRegister?: (formData: RegisterFormData) => void;
  onLogin?: () => void;
  isLoading?: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  name: string;
  disability_type: DisabilityType;
  role: 'STUDENT';
}

export enum DisabilityType {
  BUTA_WARNA = 'BUTA_WARNA',
  DISLEKSIA = 'DISLEKSIA',
  KOGNITIF = 'KOGNITIF',
  LOW_VISION = 'LOW_VISION',
  MENTOR = 'MENTOR',
  MOTORIK = 'MOTORIK',
  TUNARUNGU = 'TUNARUNGU'
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-lg bg-card/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-5 w-64`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-lg" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
      <p className="text-muted-foreground">{testimonial.handle}</p>
      <p className="mt-1 text-foreground/80">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const RegisterPage: React.FC<RegisterPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Buat Akun Baru</span>,
  description = "Daftar untuk memulai perjalanan pembelajaran Anda",
  heroImageSrc,
  testimonials = [],
  onRegister,
  onLogin,
  isLoading = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    disability_type: '' as DisabilityType,
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama lengkap harus diisi';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email harus diisi';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!formData.disability_type) {
      newErrors.disability_type = 'Jenis disabilitas harus dipilih';
    }

    if (!formData.password) {
      newErrors.password = 'Password harus diisi';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password minimal 8 karakter';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password harus diisi';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare data for backend
    const registerData: RegisterFormData = {
      email: formData.email,
      password: formData.password,
      name: formData.name,
      disability_type: formData.disability_type,
      role: 'STUDENT'
    };

    // Call the onRegister callback with the formatted data
    onRegister?.(registerData);
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw]">
      {/* Left column: register form */}
      <section className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">{title}</h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">{description}</p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-muted-foreground">Nama Lengkap</label>
                <GlassInputWrapper>
                  <input 
                    name="name" 
                    type="text" 
                    placeholder="Masukkan nama lengkap" 
                    className="w-full bg-transparent text-sm p-4 rounded-lg focus:outline-none" 
                    value={formData.name}
                    onChange={handleInputChange}
                    required 
                  />
                </GlassInputWrapper>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <GlassInputWrapper>
                  <input 
                    name="email" 
                    type="email" 
                    placeholder="nama@email.com" 
                    className="w-full bg-transparent text-sm p-4 rounded-lg focus:outline-none" 
                    value={formData.email}
                    onChange={handleInputChange}
                    required 
                  />
                </GlassInputWrapper>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div className="animate-element animate-delay-500">
                <label className="text-sm font-medium text-muted-foreground">Jenis Disabilitas</label>
                <GlassInputWrapper>
                  <select 
                    name="disability_type"
                    className="w-full bg-transparent text-sm p-4 rounded-lg focus:outline-none appearance-none"
                    value={formData.disability_type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled className="bg-background text-foreground">Pilih jenis disabilitas</option>
                    <option value={DisabilityType.BUTA_WARNA} className="bg-background text-foreground">Buta Warna</option>
                    <option value={DisabilityType.DISLEKSIA} className="bg-background text-foreground">Disleksia</option>
                    <option value={DisabilityType.KOGNITIF} className="bg-background text-foreground">Disabilitas Kognitif</option>
                    <option value={DisabilityType.LOW_VISION} className="bg-background text-foreground">Low Vision</option>
                    <option value={DisabilityType.MENTOR} className="bg-background text-foreground">Mentor (tanpa disabilitas)</option>
                    <option value={DisabilityType.MOTORIK} className="bg-background text-foreground">Disabilitas Motorik</option>
                    <option value={DisabilityType.TUNARUNGU} className="bg-background text-foreground">Tunarungu</option>
                  </select>
                </GlassInputWrapper>
                {errors.disability_type && <p className="text-red-500 text-xs mt-1">{errors.disability_type}</p>}
              </div>

              <div className="animate-element animate-delay-600">
                <label className="text-sm font-medium text-muted-foreground">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input 
                      name="password" 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="Minimal 8 karakter" 
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-lg focus:outline-none" 
                      value={formData.password}
                      onChange={handleInputChange}
                      required 
                      minLength={8}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div className="animate-element animate-delay-700">
                <label className="text-sm font-medium text-muted-foreground">Konfirmasi Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input 
                      name="confirmPassword" 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      placeholder="Masukkan password kembali" 
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-lg focus:outline-none" 
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required 
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showConfirmPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="animate-element animate-delay-800 w-full rounded-lg bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mendaftar...
                  </>
                ) : (
                  'Daftar'
                )}
              </button>
            </form>

            <div className="animate-element animate-delay-900 relative flex items-center justify-center">
              <span className="w-full border-t border-border"></span>
              <span className="px-4 text-sm text-muted-foreground bg-background absolute">Atau</span>
            </div>

            <p className="animate-element animate-delay-1000 text-center text-sm text-muted-foreground">
              Sudah punya akun? <a href="#" onClick={(e) => { e.preventDefault(); onLogin?.(); }} className="text-violet-400 hover:underline transition-colors">Masuk di sini</a>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }}></div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1100" />
              {testimonials[1] && <div className="hidden xl:flex"><TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1300" /></div>}
              {testimonials[2] && <div className="hidden 2xl:flex"><TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1500" /></div>}
            </div>
          )}
        </section>
      )}
    </div>
  );
};