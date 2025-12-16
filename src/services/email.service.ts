// services/emailService.ts
import nodemailer from 'nodemailer';

// Hanya eksekusi di lingkungan Node.js
if (typeof window !== 'undefined') {
  throw new Error('Email service can only be used on the server side');
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Konfigurasi SMTP dari environment variables
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER;

// Log konfigurasi saat startup (tanpa password)
console.log('📧 Email Service Configuration:', {
  SMTP_USER: SMTP_USER ? `${SMTP_USER.substring(0, 5)}...` : 'NOT SET',
  EMAIL_FROM: EMAIL_FROM ? `${EMAIL_FROM.substring(0, 5)}...` : 'NOT SET',
  BASE_URL,
});

// Fungsi untuk membuat transporter secara lazy
function createTransporter(): nodemailer.Transporter {
  if (!SMTP_USER || !SMTP_PASSWORD) {
    console.error('❌ SMTP_USER atau SMTP_PASSWORD tidak dikonfigurasi!');
    console.error('📝 Tambahkan ke file .env:');
    console.error('   SMTP_USER=emailanda@gmail.com');
    console.error('   SMTP_PASSWORD=xxxx xxxx xxxx xxxx (App Password dari Google)');
    throw new Error('SMTP credentials not configured');
  }

  // Gunakan konfigurasi SMTP langsung dengan opsi TLS yang lebih permissive
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
    tls: {
      // Abaikan validasi sertifikat (untuk mengatasi proxy/antivirus)
      rejectUnauthorized: false
    }
  });
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Helper untuk membuat ikon Lucide React dalam email
const lucideIcon = (name: string, color = '#4a5568', size = 16) => `
<img 
  src="${BASE_URL}/icons/${name}.svg" 
  alt="${name}" 
  width="${size}" 
  height="${size}" 
  style="display: inline-block; vertical-align: middle; margin-right: 6px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));"
/>
`;

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Validasi email address
    if (!options.to || !/^\S+@\S+\.\S+$/.test(options.to)) {
      throw new Error(`Invalid email address: ${options.to}`);
    }

    // Buat transporter
    const transporter = createTransporter();

    const mailOptions = {
      from: `"E-Learning Platform" <${EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    };

    console.log(`📧 Attempting to send email to ${options.to}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${options.to} (Message ID: ${info.messageId})`);
    return true;
  } catch (error: any) {
    console.error('❌ Email sending failed:', {
      to: options.to,
      subject: options.subject,
      error: error.message || 'Unknown error',
    });
    
    // Throw error agar pemanggil tahu email gagal
    throw error;
  }
}

// Template email yang lebih baik dan responsif
const createEmailTemplate = (content: string, footerText = '') => `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px;">
  <div style="background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #e2e8f0;">
    <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 30px 20px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">E-Learning Platform</h1>
      <p style="color: rgba(255, 255, 255, 0.9); margin-top: 8px; font-size: 16px;">Tingkatkan Skill Anda Bersama Kami</p>
    </div>
    
    <div style="padding: 30px; background: #f8fafc;">
      ${content}
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
        <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">
          ${footerText || 'Jika Anda tidak meminta email ini, silakan abaikan.'}
        </p>
      </div>
    </div>
    
    <div style="background: #edf2f7; padding: 20px; text-align: center; color: #4a5568; font-size: 13px;">
      <p style="margin: 0 0 8px;">© ${new Date().getFullYear()} E-Learning Platform. All rights reserved.</p>
      <p style="margin: 0; color: #718096;">Jl. Pendidikan No. 123, Jakarta, Indonesia</p>
    </div>
  </div>
</div>
`;

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const verifyUrl = `${BASE_URL}/verify-email?token=${token}`;
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString('id-ID');
  
  const content = `
    <h2 style="color: #1e293b; margin-top: 0;">Halo, ${name}!</h2>
    <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
      Terima kasih telah mendaftar di E-Learning Platform. Silakan verifikasi alamat email Anda untuk mengaktifkan akun.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verifyUrl}" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; font-weight: 600; padding: 14px 32px; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
        Verifikasi Email Sekarang
      </a>
    </div>
    
    <p style="color: #475569; line-height: 1.6; margin-bottom: 15px;">
      Atau salin dan tempel link berikut ke browser Anda:
    </p>
    <p style="word-break: break-all; background: #f1f5f9; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 14px; color: #1e3a8a; margin-bottom: 20px;">
      ${verifyUrl}
    </p>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 6px 6px 0; margin: 20px 0; display: flex; align-items: center;">
      ${lucideIcon('clock', '#92400e', 18)}
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        Link verifikasi ini akan kadaluarsa pada <strong>${expires}</strong>
      </p>
    </div>
  `;

  const html = createEmailTemplate(content, 'Jika Anda tidak mendaftar di platform kami, abaikan email ini.');

  return sendEmail({
    to: email,
    subject: 'Verifikasi Email Anda - E-Learning Platform',
    html,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
) {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;
  const expires = new Date(Date.now() + 60 * 60 * 1000).toLocaleString('id-ID');
  
  const content = `
    <h2 style="color: #1e293b; margin-top: 0;">Permintaan Reset Password</h2>
    <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
      Halo ${name}, kami menerima permintaan untuk mengubah password akun Anda.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; font-weight: 600; padding: 14px 32px; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
        Reset Password Sekarang
      </a>
    </div>
    
    <p style="color: #475569; line-height: 1.6; margin-bottom: 15px;">
      Atau salin dan tempel link berikut ke browser Anda:
    </p>
    <p style="word-break: break-all; background: #f1f5f9; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 14px; color: #1e3a8a; margin-bottom: 20px;">
      ${resetUrl}
    </p>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 6px 6px 0; margin: 20px 0; display: flex; align-items: center;">
      ${lucideIcon('clock', '#92400e', 18)}
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        Link reset password ini akan kadaluarsa pada <strong>${expires}</strong>
      </p>
    </div>
    
    <p style="color: #475569; line-height: 1.6; font-style: italic; margin-top: 10px; display: flex; align-items: center;">
      ${lucideIcon('shield-alert', '#64748b', 16)}
      Jika Anda tidak meminta perubahan password, abaikan email ini. Keamanan akun Anda adalah prioritas kami.
    </p>
  `;

  const html = createEmailTemplate(content);

  return sendEmail({
    to: email,
    subject: 'Permintaan Reset Password - E-Learning Platform',
    html,
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  const content = `
    <h2 style="color: #1e293b; margin-top: 0;">Selamat Datang di E-Learning Platform, ${name}!</h2>
    <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
      Terima kasih telah bergabung bersama kami. Mulai jelajahi berbagai kursus berkualitas tinggi yang dirancang untuk membantu Anda mencapai tujuan pembelajaran.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${BASE_URL}/courses" style="display: inline-block; background: #10b981; color: white; text-decoration: none; font-weight: 600; padding: 14px 32px; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
        Jelajahi Kursus
      </a>
    </div>
    
    <div style="background: #dbeafe; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #1e3a8a; margin-top: 0; display: flex; align-items: center;">
        ${lucideIcon('award', '#1e3a8a', 20)}
        Fitur Platform Kami:
      </h3>
      <ul style="color: #1e3a8a; padding-left: 20px; margin-bottom: 0;">
        <li style="margin-bottom: 12px; display: flex; align-items: flex-start;">
          ${lucideIcon('circle-check', '#10b981', 18)}
          <span>Sertifikat resmi untuk setiap kursus yang diselesaikan</span>
        </li>
        <li style="margin-bottom: 12px; display: flex; align-items: flex-start;">
          ${lucideIcon('clock', '#10b981', 18)}
          <span>Pembelajaran fleksibel kapan saja dan di mana saja</span>
        </li>
        <li style="margin-bottom: 12px; display: flex; align-items: flex-start;">
          ${lucideIcon('school', '#10b981', 18)}
          <span>Materi berkualitas dari instruktur berpengalaman</span>
        </li>
        <li style="display: flex; align-items: flex-start;">
          ${lucideIcon('users', '#10b981', 18)}
          <span>Komunitas belajar yang mendukung</span>
        </li>
      </ul>
    </div>
    
    <p style="color: #475569; line-height: 1.6; margin-top: 10px; display: flex; align-items: center;">
      ${lucideIcon('message-circle', '#4a5568', 16)}
      Jika Anda memiliki pertanyaan, balas email ini atau hubungi tim dukungan kami.
    </p>
  `;

  const html = createEmailTemplate(content);

  return sendEmail({
    to: email,
    subject: 'Selamat Datang di E-Learning Platform!',
    html,
  });
}

export async function sendEnrollmentEmail(
  email: string,
  name: string,
  courseTitle: string,
  courseSlug: string
) {
  const courseUrl = `${BASE_URL}/courses/${courseSlug}`;
  
  const content = `
    <h2 style="color: #1e293b; margin-top: 0;">Pendaftaran Berhasil!</h2>
    <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
      Halo ${name}, selamat! Anda telah berhasil mendaftar ke kursus:
    </p>
    
    <div style="background: #f0f9ff; border: 2px solid #3b82f6; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
      <h3 style="color: #1e3a8a; margin: 0 0 10px; font-size: 20px; display: flex; align-items: center; justify-content: center;">
        ${lucideIcon('graduation-cap', '#1e3a8a', 22)}
        ${courseTitle}
      </h3>
      <p style="color: #334155; margin: 0; font-style: italic;">"Investasi terbaik adalah investasi pada diri sendiri"</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${courseUrl}" style="display: inline-block; background: #8b5cf6; color: white; text-decoration: none; font-weight: 600; padding: 14px 32px; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);">
        Mulai Belajar Sekarang
      </a>
    </div>
    
    <p style="color: #475569; line-height: 1.6; margin-top: 10px; display: flex; align-items: center;">
      ${lucideIcon('book-open', '#4a5568', 16)}
      Akses kursus kapan saja melalui dashboard pembelajaran Anda. Kami berharap Anda mendapatkan pengalaman belajar yang berharga!
    </p>
  `;

  const html = createEmailTemplate(content);

  return sendEmail({
    to: email,
    subject: `Pendaftaran Berhasil: ${courseTitle}`,
    html,
  });
}

export async function sendCertificateEmail(
  email: string,
  name: string,
  courseTitle: string,
  certificateNumber: string
) {
  const certificateUrl = `${BASE_URL}/certificates/${certificateNumber}`;
  
  const content = `
    <h2 style="color: #1e293b; margin-top: 0;">Selamat, ${name}! </h2>
    <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
      Kami dengan bangga mengumumkan bahwa Anda telah berhasil menyelesaikan kursus:
    </p>
    
    <div style="background: linear-gradient(135deg, #0ea5e9, #3b82f6); border-radius: 12px; padding: 25px; text-align: center; margin: 20px 0; color: white; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);">
      <h3 style="margin: 0 0 15px; font-size: 22px; text-shadow: 0 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
        ${lucideIcon('trophy', 'white', 28)}
        ${courseTitle}
      </h3>
      <div style="background: rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 12px; display: inline-block; margin: 0 auto;">
        <span style="font-weight: 600; font-size: 18px; letter-spacing: 1px;">${certificateNumber}</span>
      </div>
      <p style="margin: 15px 0 0; opacity: 0.9; font-size: 15px; display: flex; align-items: center; justify-content: center;">
        ${lucideIcon('hash', 'rgba(255,255,255,0.8)', 16)}
        Nomor Sertifikat Resmi
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${certificateUrl}" style="display: inline-block; background: #f59e0b; color: white; text-decoration: none; font-weight: 600; padding: 14px 32px; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);">
        Lihat & Unduh Sertifikat
      </a>
    </div>
    
    <p style="color: #475569; line-height: 1.6; margin-top: 10px; display: flex; align-items: center;">
      ${lucideIcon('share-2', '#4a5568', 16)}
      Sertifikat ini dapat Anda bagikan di LinkedIn, CV, atau portofolio profesional Anda. Tetap semangat untuk terus belajar!
    </p>
  `;

  const html = createEmailTemplate(content);

  return sendEmail({
    to: email,
    subject: `Sertifikat Kelulusan: ${courseTitle}`,
    html,
  });
}

export async function sendPaymentConfirmationEmail(
  email: string,
  name: string,
  courseTitle: string,
  amount: number,
  orderId: string
) {
  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
  
  const content = `
    <h2 style="color: #1e293b; margin-top: 0;">Pembayaran Berhasil! </h2>
    <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
      Terima kasih, ${name}! Pembayaran Anda untuk kursus berikut telah berhasil diproses:
    </p>
    
    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; width: 30%; display: flex; align-items: center;">
            ${lucideIcon('file-text', '#64748b', 16)}
            Order ID:
          </td>
          <td style="padding: 8px 0; font-weight: 600; color: #1e293b;">${orderId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; display: flex; align-items: center;">
            ${lucideIcon('book', '#64748b', 16)}
            Kursus:
          </td>
          <td style="padding: 8px 0; font-weight: 600; color: #1e293b;">${courseTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; display: flex; align-items: center;">
            ${lucideIcon('credit-card', '#0ea5e9', 16)}
            Total Pembayaran:
          </td>
          <td style="padding: 8px 0; font-weight: 700; color: #0ea5e9; font-size: 18px;">${formattedAmount}</td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${BASE_URL}/dashboard/orders/${orderId}" style="display: inline-block; background: #0ea5e9; color: white; text-decoration: none; font-weight: 600; padding: 14px 32px; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 6px rgba(14, 165, 233, 0.3);">
        Lihat Detail Transaksi
      </a>
    </div>
    
    <p style="color: #475569; line-height: 1.6; margin-top: 10px; display: flex; align-items: center;">
      ${lucideIcon('file-check', '#4a5568', 16)}
      Kami telah mengirimkan invoice resmi ke email Anda. Akses kursus kapan saja melalui dashboard pembelajaran Anda.
    </p>
    
    <div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 12px 16px; border-radius: 0 6px 6px 0; margin: 20px 0; display: flex; align-items: center;">
      ${lucideIcon('circle-check', '#166534', 18)}
      <p style="color: #166534; margin: 0; font-size: 14px;">
        Pembayaran telah dikonfirmasi dan kursus siap diakses
      </p>
    </div>
  `;

  const html = createEmailTemplate(content);

  return sendEmail({
    to: email,
    subject: `Konfirmasi Pembayaran - ${orderId}`,
    html,
  });
}