import React, { useState } from 'react';
import { ArrowLeft, Loader2, CircleCheck as CheckCircle2 } from 'lucide-react';

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface ForgotPasswordPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  successDescription?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  onBackToLogin?: () => void;
  isLoading?: boolean;
  isSuccess?: boolean;
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

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Lupa Password</span>,
  description = "Masukkan email Anda untuk reset password",
  successDescription = "Kami telah mengirimkan instruksi reset password",
  heroImageSrc,
  testimonials = [],
  onSubmit,
  onBackToLogin,
  isLoading = false,
  isSuccess = false,
}) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.(event);
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw]">
      {/* Left column: forgot password form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">{title}</h1>
            
            {!isSuccess ? (
              <>
                <p className="animate-element animate-delay-200 text-muted-foreground">{description}</p>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="animate-element animate-delay-300">
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <GlassInputWrapper>
                      <input 
                        name="email" 
                        type="email" 
                        placeholder="nama@email.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-transparent text-sm p-4 rounded-lg focus:outline-none" 
                        required 
                      />
                    </GlassInputWrapper>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="animate-element animate-delay-400 w-full rounded-lg bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      'Kirim Instruksi Reset'
                    )}
                  </button>

                  <button 
                    type="button"
                    onClick={onBackToLogin}
                    className="animate-element animate-delay-500 w-full flex items-center justify-center gap-2 border border-border rounded-lg py-4 hover:bg-secondary transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Login
                  </button>
                </form>
              </>
            ) : (
              <div className="animate-element animate-delay-200 space-y-5">
                <div className="flex justify-center">
                  <CheckCircle2 className="h-16 w-16 text-success" />
                </div>
                <p className="text-muted-foreground text-center">
                  {successDescription}
                </p>
                <p className="text-foreground/80 text-center">
                  Kami telah mengirimkan link reset password ke <strong>{email}</strong>.
                  Silakan cek email Anda dan ikuti instruksi selanjutnya.
                </p>
                <button 
                  onClick={onBackToLogin}
                  className="animate-element animate-delay-300 w-full flex items-center justify-center gap-2 border border-border rounded-lg py-4 hover:bg-secondary transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke Halaman Login
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }}></div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] && <div className="hidden xl:flex"><TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" /></div>}
              {testimonials[2] && <div className="hidden 2xl:flex"><TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" /></div>}
            </div>
          )}
        </section>
      )}
    </div>
  );
};