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
  onRegister?: (event: React.FormEvent<HTMLFormElement>) => void;
  onLogin?: () => void;
  isLoading?: boolean;
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

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw]">
      {/* Left column: register form */}
      <section className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">{title}</h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">{description}</p>

            <form className="space-y-5" onSubmit={onRegister}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-muted-foreground">Nama Lengkap</label>
                <GlassInputWrapper>
                  <input 
                    name="fullName" 
                    type="text" 
                    placeholder="Masukkan nama lengkap" 
                    className="w-full bg-transparent text-sm p-4 rounded-lg focus:outline-none" 
                    required 
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <GlassInputWrapper>
                  <input 
                    name="email" 
                    type="email" 
                    placeholder="nama@email.com" 
                    className="w-full bg-transparent text-sm p-4 rounded-lg focus:outline-none" 
                    required 
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500">
                <label className="text-sm font-medium text-muted-foreground">Jenis Disabilitas (Opsional)</label>
                <GlassInputWrapper>
                  <select 
                    name="disabilityType"
                    className="w-full bg-transparent text-sm p-4 rounded-lg focus:outline-none appearance-none"
                    defaultValue=""
                  >
                    <option value="" disabled className="bg-background text-foreground">Pilih jenis disabilitas</option>
                    <option value="none" className="bg-background text-foreground">Tidak Ada</option>
                    <option value="fisik" className="bg-background text-foreground">Fisik</option>
                    <option value="sensorik" className="bg-background text-foreground">Sensorik</option>
                    <option value="mental" className="bg-background text-foreground">Mental</option>
                    <option value="intelektual" className="bg-background text-foreground">Intelektual</option>
                  </select>
                </GlassInputWrapper>
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
                      required 
                      minLength={8}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
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
                      required 
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showConfirmPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
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