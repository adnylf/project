// services/email.service.ts
import nodemailer from "nodemailer";
import { createTransport, Transporter, SendMailOptions } from "nodemailer";

// Konfigurasi Email - Enhanced with environment detection
const emailConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  from: {
    name: process.env.APP_NAME || "Course Online Disabilitas",
    address: process.env.EMAIL_FROM || "noreply@example.com",
  },
  // Environment-specific settings
  isDevelopment: process.env.NODE_ENV === "development",
  debug:
    process.env.EMAIL_DEBUG === "true" ||
    process.env.NODE_ENV === "development",
};

// Interface untuk Email Options
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Email Result Interface
export interface EmailResult {
  success: boolean;
  message?: string;
  error?: string;
  messageId?: string;
}

/**
 * Email Service Class
 * Menangani pengiriman email menggunakan Nodemailer dengan connection pooling
 * dan penanganan sertifikat yang lebih baik untuk development
 */
export class EmailService {
  private transporter: Transporter;
  private isConnected: boolean = false;
  private connectionPromise: Promise<boolean> | null = null;
  private maxRetries: number = 3;
  private retryDelay: number = 2000; // 2 detik

  constructor() {
    console.log("📧 Initializing Email Service...");
    console.log("🔧 SMTP Config:", {
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      user: emailConfig.auth.user,
      env: process.env.NODE_ENV,
      debug: emailConfig.debug,
    });

    // Create transporter with proper TLS configuration
    this.transporter = this.createTransporter();

    // Handle transporter events
    this.setupTransporterEvents();

    // Initialize connection (async, tidak blocking)
    this.initializeConnection();
  }

  /**
   * Create transporter dengan konfigurasi TLS yang tepat
   */
  private createTransporter(): Transporter {
    const transporterConfig: any = {
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass,
      },
      connectionTimeout: 15000, // 15 detik
      greetingTimeout: 15000,
      socketTimeout: 30000,
      // Pooling configuration untuk koneksi yang lebih stabil
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      debug: emailConfig.debug,
      logger: emailConfig.debug,
    };

    // Konfigurasi khusus untuk development environment
    if (emailConfig.isDevelopment) {
      console.log("🔧 Applying development-specific email configurations...");

      // Nonaktifkan verifikasi sertifikat untuk development
      // Ini aman untuk development, TAPI JANGAN DIGUNAKAN DI PRODUCTION
      transporterConfig.tls = {
        rejectUnauthorized: false,
      };

      // Jika menggunakan Gmail, pastikan konfigurasi sesuai
      if (emailConfig.host.includes("gmail.com")) {
        console.log("🔧 Gmail detected, applying Gmail-specific settings...");
        transporterConfig.service = "gmail";

        // Check if OAuth is configured
        if (
          process.env.GMAIL_CLIENT_ID &&
          process.env.GMAIL_CLIENT_SECRET &&
          process.env.GMAIL_REFRESH_TOKEN
        ) {
          transporterConfig.auth = {
            type: "OAuth2",
            user: emailConfig.auth.user,
            clientId: process.env.GMAIL_CLIENT_ID,
            clientSecret: process.env.GMAIL_CLIENT_SECRET,
            refreshToken: process.env.GMAIL_REFRESH_TOKEN,
            accessToken: process.env.GMAIL_ACCESS_TOKEN,
          };
        } else {
          console.warn(
            "⚠️ Gmail OAuth not configured, falling back to password authentication"
          );
          transporterConfig.auth = {
            user: emailConfig.auth.user,
            pass: emailConfig.auth.pass,
          };

          // Untuk Gmail dengan password, perlu konfigurasi tambahan
          transporterConfig.tls = {
            rejectUnauthorized: false,
          };
        }
      }
    }

    return createTransport(transporterConfig);
  }

  /**
   * Setup event handlers untuk transporter
   */
  private setupTransporterEvents(): void {
    this.transporter.on("idle", () => {
      console.log("📧 Email transporter is idle");
    });

    this.transporter.on("error", (error: Error) => {
      console.error("❌ Email transporter connection error:", error.message);
      this.isConnected = false;
    });

    // Remove the 'close' event handler since it's not supported by the Transporter type
    // Instead, we'll handle connection closure through other mechanisms
  }

  /**
   * Initialize connection dengan retry mechanism
   */
  private async initializeConnection(): Promise<void> {
    if (this.connectionPromise) {
      return;
    }

    this.connectionPromise = this.connectWithRetry();

    try {
      const connected = await this.connectionPromise;
      if (connected) {
        console.log("🎉 Email service initialized successfully!");
        console.log("✅ SMTP Connection is ready to send emails");
      } else {
        console.error("💥 Email service failed to initialize after retries");
      }
    } catch (error) {
      console.error("💥 Email service initialization error:", error);
    } finally {
      this.connectionPromise = null;
    }
  }

  /**
   * Connect dengan retry mechanism - Enhanced untuk development
   */
  private async connectWithRetry(retryCount: number = 0): Promise<boolean> {
    if (retryCount >= this.maxRetries) {
      console.error("💥 Max retries reached. SMTP connection failed.");
      this.isConnected = false;
      return false;
    }

    try {
      console.log(
        `🔄 Attempting SMTP connection (attempt ${retryCount + 1}/${
          this.maxRetries
        })...`
      );

      // Untuk development, coba koneksi sederhana terlebih dahulu
      if (emailConfig.isDevelopment) {
        console.log(
          "🔧 Development mode: Testing connection with simpler approach..."
        );

        // Coba kirim email test sederhana
        await this.transporter.verify();
        this.isConnected = true;
        console.log(
          "✅ SMTP Connection verified successfully in development mode!"
        );
        return true;
      }

      // Untuk production, gunakan verifikasi penuh
      await this.transporter.verify();
      this.isConnected = true;

      console.log("✅ SMTP Connection verified successfully!");
      return true;
    } catch (error: unknown) {
      // Type guard untuk error
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `❌ SMTP Connection failed (attempt ${retryCount + 1}/${
          this.maxRetries
        }):`,
        errorMessage
      );

      // Analisis error untuk diagnosa lebih baik
      if (errorMessage.includes("self-signed certificate")) {
        console.warn(
          "⚠️ Self-signed certificate error detected. This is common in development environments."
        );
        console.warn("🔧 Applying development certificate workaround...");

        // Terapkan workaround khusus untuk error sertifikat
        try {
          // Buat transporter ulang dengan konfigurasi TLS yang lebih longgar
          const originalConfig = this.transporter.options;

          this.transporter = createTransport({
            ...originalConfig,
            tls: {
              rejectUnauthorized: false,
            },
          });

          console.log("🔧 Retrying connection with certificate workaround...");
          await this.transporter.verify();
          this.isConnected = true;
          console.log("✅ Connection successful after certificate workaround!");
          return true;
        } catch (retryError: unknown) {
          // Type guard untuk retryError
          const retryErrorMessage =
            retryError instanceof Error
              ? retryError.message
              : String(retryError);
          console.error("❌ Certificate workaround failed:", retryErrorMessage);
        }
      }

      // Jika masih gagal, coba retry
      if (retryCount < this.maxRetries - 1) {
        console.log(`⏳ Retrying in ${this.retryDelay / 1000} seconds...`);
        await this.delay(this.retryDelay);
        return this.connectWithRetry(retryCount + 1);
      }

      console.error(
        "💥 All connection attempts failed. Email service unavailable."
      );
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Wait for connection to be ready with timeout
   */
  private async waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
    const startTime = Date.now();

    // Helper function untuk menunggu dengan timeout
    const waitForConnectionHelper = async (): Promise<boolean> => {
      while (!this.isConnected && Date.now() - startTime < timeoutMs) {
        if (this.isConnected) {
          return true;
        }

        if (!this.connectionPromise && !this.isConnected) {
          console.log(
            "🔄 Connection not active, initializing new connection..."
          );
          this.initializeConnection();
        }

        await this.delay(500); // Check every 500ms
      }

      return this.isConnected;
    };

    try {
      const isReady = await Promise.race([
        waitForConnectionHelper(),
        new Promise<boolean>((resolve) =>
          setTimeout(() => resolve(false), timeoutMs)
        ),
      ]);

      if (!isReady) {
        console.warn(`⚠️ Connection timeout after ${timeoutMs}ms`);

        // Force a new connection attempt if timed out
        if (!this.connectionPromise) {
          console.log("🔄 Forcing new connection attempt after timeout...");
          this.initializeConnection();
          return this.waitForConnection(timeoutMs);
        }
      }

      return isReady;
    } catch (error) {
      console.error("❌ Error waiting for connection:", error);
      return false;
    }
  }

  /**
   * Send email dengan connection waiting dan fallback untuk development
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      console.log("📤 Preparing to send email to:", options.to);
      console.log("📝 Subject:", options.subject);

      // Tunggu koneksi siap dengan timeout
      const isReady = await this.waitForConnection(30000);

      if (!isReady) {
        // Fallback untuk development: simpan email ke console/file
        if (emailConfig.isDevelopment) {
          console.warn(
            "⚠️ Development mode: SMTP not connected, falling back to console output"
          );
          this.logEmailToConsole(options);

          return {
            success: true,
            message:
              "Development mode: Email content logged to console instead of being sent",
          };
        }

        const errorMsg =
          "SMTP connection not established after waiting. Email cannot be sent.";
        console.error("❌", errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }

      console.log("✅ Connection ready, sending email...");

      const mailOptions: SendMailOptions = {
        from: `"${emailConfig.from.name}" <${emailConfig.from.address}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
      };

      if (emailConfig.debug) {
        console.log(
          "🔍 Debug: Email options:",
          JSON.stringify(mailOptions, null, 2)
        );
      }

      const info = await this.transporter.sendMail(mailOptions);

      console.log("✅ Email sent successfully!");
      console.log("📨 Message ID:", info.messageId);
      if (info.response) {
        console.log("📤 SMTP Response:", info.response);
      }

      return {
        success: true,
        message: `Email sent successfully to ${options.to}`,
        messageId: info.messageId,
      };
    } catch (error: unknown) {
      console.error("❌ Error sending email:", error);

      // Reset connection status jika error
      this.isConnected = false;

      // Type guard untuk error
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const errorMessage = errorObj.message;
      const errorCode = (errorObj as any).code || "UNKNOWN_ERROR";

      // Mapping error codes to user-friendly messages
      let userFriendlyMessage = "Unknown error occurred";

      if (errorCode === "EAUTH") {
        userFriendlyMessage =
          "Authentication failed. Check your email credentials.";
      } else if (errorCode === "ECONNECTION") {
        userFriendlyMessage =
          "Connection to SMTP server failed. Check your network connection and SMTP settings.";
      } else if (errorCode === "ETIMEDOUT") {
        userFriendlyMessage =
          "SMTP connection timed out. The server might be busy or unreachable.";
      } else if (errorCode === "EENVELOPE") {
        userFriendlyMessage =
          "Invalid recipient email address. Please check the email format.";
      } else if (errorCode === "EFROM") {
        userFriendlyMessage =
          "Invalid sender email address. Please check your configuration.";
      } else if (errorCode === "EDNS") {
        userFriendlyMessage =
          "DNS lookup failed. Please check your internet connection.";
      } else if (errorCode === "EPROTOCOL") {
        userFriendlyMessage =
          "SMTP protocol error. This might be a configuration issue.";
      } else {
        if (errorMessage.includes("self-signed certificate")) {
          userFriendlyMessage =
            "SSL certificate error. This is common in development environments.";

          if (emailConfig.isDevelopment) {
            userFriendlyMessage +=
              " In development mode, try setting NODE_TLS_REJECT_UNAUTHORIZED=0 or configure proper certificates.";
          }
        } else if (errorMessage.includes("Invalid login")) {
          userFriendlyMessage =
            "Invalid email login credentials. Check your username and password.";
        } else if (errorMessage.includes("Connection refused")) {
          userFriendlyMessage =
            "Connection refused by SMTP server. Check host and port settings.";
        } else {
          userFriendlyMessage = errorMessage || "Failed to send email";
        }
      }

      console.error(
        `❌ Email sending failed with error code ${errorCode}: ${userFriendlyMessage}`
      );

      // Development fallback - log email content
      if (emailConfig.isDevelopment) {
        console.warn(
          "⚠️ Development mode: Logging email content due to send failure"
        );
        this.logEmailToConsole(options, userFriendlyMessage);
      }

      return {
        success: false,
        error: userFriendlyMessage,
      };
    }
  }

  /**
   * Log email content to console for development
   */
  private logEmailToConsole(options: EmailOptions, error?: string): void {
    console.log("📧 DEVELOPMENT MODE EMAIL LOG 📧");
    console.log("========================================");
    console.log("TO:", options.to);
    console.log("SUBJECT:", options.subject);
    console.log(
      "FROM:",
      `${emailConfig.from.name} <${emailConfig.from.address}>`
    );
    console.log("TEXT VERSION:", options.text || this.htmlToText(options.html));
    console.log(
      "\nHTML VERSION (truncated):",
      options.html.substring(0, 200) + "..."
    );

    if (error) {
      console.log("\n❌ ERROR:", error);
    }

    console.log("========================================");
    console.log(
      "💡 TIP: Configure SMTP settings in .env file to send real emails"
    );
    console.log(
      "💡 TIP: For Gmail, you may need to enable 'Less secure apps' or use App Passwords"
    );

    if (process.env.NODE_ENV === "development") {
      console.log(
        "💡 TIP: You can also set NODE_TLS_REJECT_UNAUTHORIZED=0 for development (not recommended for production)"
      );
    }

    console.log("========================================");
  }

  /**
   * Convert HTML to plain text (fallback)
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(
    to: string,
    userName: string,
    token: string
  ): Promise<EmailResult> {
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const verificationUrl = `${appUrl}/verify-email?token=${token}`;

    const subject = "Verify Your Email Address - Course Online Disabilitas";

    const html = this.generateVerificationTemplate(userName, verificationUrl);
    const text = `Hi ${userName},\n\nPlease verify your email address by clicking the link below:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.`;

    console.log("🔐 Sending verification email to:", to);
    console.log("🔗 Verification URL:", verificationUrl);

    const result = await this.sendEmail({
      to,
      subject,
      html,
      text,
    });

    if (result.success) {
      console.log("✅ Verification email sent successfully to:", to);
    } else {
      console.error(
        "❌ Failed to send verification email to:",
        to,
        result.error
      );
    }

    return result;
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    userName: string,
    token: string
  ): Promise<EmailResult> {
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    const subject = "Reset Your Password - Course Online Disabilitas";

    const html = this.generatePasswordResetTemplate(userName, resetUrl);
    const text = `Hi ${userName},\n\nYou requested to reset your password. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`;

    console.log("🔑 Sending password reset email to:", to);
    console.log("🔗 Reset URL:", resetUrl);

    const result = await this.sendEmail({
      to,
      subject,
      html,
      text,
    });

    if (result.success) {
      console.log("✅ Password reset email sent successfully to:", to);
    } else {
      console.error(
        "❌ Failed to send password reset email to:",
        to,
        result.error
      );
    }

    return result;
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to: string, userName: string): Promise<EmailResult> {
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const subject = "Welcome to Course Online Disabilitas!";

    const html = this.generateWelcomeTemplate(userName, appUrl);
    const text = `Hi ${userName},\n\nWelcome to Course Online Disabilitas! We're excited to have you on board.\n\nStart exploring our courses and begin your learning journey today.\n\nIf you have any questions, feel free to reach out to our support team.\n\nHappy learning!`;

    console.log("👋 Sending welcome email to:", to);

    const result = await this.sendEmail({
      to,
      subject,
      html,
      text,
    });

    return result;
  }

  // Template generators tetap sama seperti sebelumnya...
  private generateVerificationTemplate(
    userName: string,
    verificationUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  margin: 0;
                  padding: 0;
                  background-color: #f9fafb;
              }
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background: #ffffff;
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                  background: linear-gradient(135deg, #4F46E5, #7E22CE);
                  color: white;
                  padding: 30px 20px;
                  text-align: center;
              }
              .header h1 {
                  margin: 0;
                  font-size: 24px;
                  font-weight: 600;
              }
              .content {
                  padding: 30px;
              }
              .greeting {
                  font-size: 18px;
                  margin-bottom: 20px;
                  color: #374151;
              }
              .message {
                  margin-bottom: 25px;
                  color: #6B7280;
              }
              .button {
                  display: inline-block;
                  padding: 14px 28px;
                  background: linear-gradient(135deg, #4F46E5, #7E22CE);
                  color: white;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 600;
                  text-align: center;
                  margin: 20px 0;
              }
              .verification-link {
                  background: #f3f4f6;
                  padding: 15px;
                  border-radius: 6px;
                  word-break: break-all;
                  font-family: monospace;
                  font-size: 14px;
                  color: #374151;
                  margin: 20px 0;
              }
              .footer {
                  padding: 20px;
                  text-align: center;
                  color: #9CA3AF;
                  font-size: 14px;
                  border-top: 1px solid #E5E7EB;
              }
              .warning {
                  background: #FEF3C7;
                  border: 1px solid #F59E0B;
                  padding: 15px;
                  border-radius: 6px;
                  margin: 20px 0;
                  color: #92400E;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Verify Your Email Address</h1>
              </div>
              <div class="content">
                  <div class="greeting">Hi ${userName},</div>
                  
                  <div class="message">
                      Thank you for signing up! Please verify your email address to activate your account and start using our platform.
                  </div>

                  <div style="text-align: center;">
                      <a href="${verificationUrl}" class="button">Verify Email Address</a>
                  </div>

                  <div class="message">
                      Or copy and paste this link in your browser:
                  </div>

                  <div class="verification-link">
                      ${verificationUrl}
                  </div>

                  <div class="warning">
                      <strong>Important:</strong> This verification link will expire in 24 hours.
                  </div>

                  <div class="message">
                      If you didn't create an account with us, please ignore this email.
                  </div>
              </div>
              <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} Course Online Disabilitas. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  private generatePasswordResetTemplate(
    userName: string,
    resetUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  margin: 0;
                  padding: 0;
                  background-color: #f9fafb;
              }
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background: #ffffff;
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                  background: linear-gradient(135deg, #DC2626, #EF4444);
                  color: white;
                  padding: 30px 20px;
                  text-align: center;
              }
              .header h1 {
                  margin: 0;
                  font-size: 24px;
                  font-weight: 600;
              }
              .content {
                  padding: 30px;
              }
              .greeting {
                  font-size: 18px;
                  margin-bottom: 20px;
                  color: #374151;
              }
              .message {
                  margin-bottom: 25px;
                  color: #6B7280;
              }
              .button {
                  display: inline-block;
                  padding: 14px 28px;
                  background: linear-gradient(135deg, #DC2626, #EF4444);
                  color: white;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 600;
                  text-align: center;
                  margin: 20px 0;
              }
              .reset-link {
                  background: #f3f4f6;
                  padding: 15px;
                  border-radius: 6px;
                  word-break: break-all;
                  font-family: monospace;
                  font-size: 14px;
                  color: #374151;
                  margin: 20px 0;
              }
              .footer {
                  padding: 20px;
                  text-align: center;
                  color: #9CA3AF;
                  font-size: 14px;
                  border-top: 1px solid #E5E7EB;
              }
              .warning {
                  background: #FEF3C7;
                  border: 1px solid #F59E0B;
                  padding: 15px;
                  border-radius: 6px;
                  margin: 20px 0;
                  color: #92400E;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Reset Your Password</h1>
              </div>
              <div class="content">
                  <div class="greeting">Hi ${userName},</div>
                  
                  <div class="message">
                      We received a request to reset your password for your Course Online Disabilitas account.
                  </div>

                  <div style="text-align: center;">
                      <a href="${resetUrl}" class="button">Reset Password</a>
                  </div>

                  <div class="message">
                      Or copy and paste this link in your browser:
                  </div>

                  <div class="reset-link">
                      ${resetUrl}
                  </div>

                  <div class="warning">
                      <strong>Important:</strong> This password reset link will expire in 1 hour.
                  </div>

                  <div class="message">
                      If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                  </div>
              </div>
              <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} Course Online Disabilitas. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeTemplate(userName: string, appUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Course Online Disabilitas</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  margin: 0;
                  padding: 0;
                  background-color: #f9fafb;
              }
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background: #ffffff;
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                  background: linear-gradient(135deg, #059669, #10B981);
                  color: white;
                  padding: 30px 20px;
                  text-align: center;
              }
              .header h1 {
                  margin: 0;
                  font-size: 24px;
                  font-weight: 600;
              }
              .content {
                  padding: 30px;
              }
              .greeting {
                  font-size: 18px;
                  margin-bottom: 20px;
                  color: #374151;
              }
              .message {
                  margin-bottom: 25px;
                  color: #6B7280;
              }
              .button {
                  display: inline-block;
                  padding: 14px 28px;
                  background: linear-gradient(135deg, #059669, #10B981);
                  color: white;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 600;
                  text-align: center;
                  margin: 20px 0;
              }
              .features {
                  margin: 25px 0;
              }
              .feature {
                  display: flex;
                  align-items: center;
                  margin-bottom: 15px;
              }
              .feature-icon {
                  background: #10B981;
                  color: white;
                  border-radius: 50%;
                  width: 24px;
                  height: 24px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin-right: 15px;
                  font-size: 14px;
              }
              .footer {
                  padding: 20px;
                  text-align: center;
                  color: #9CA3AF;
                  font-size: 14px;
                  border-top: 1px solid #E5E7EB;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Welcome to Course Online Disabilitas!</h1>
              </div>
              <div class="content">
                  <div class="greeting">Hi ${userName},</div>
                  
                  <div class="message">
                      Welcome to our platform! We're excited to have you join our community of learners.
                  </div>

                  <div class="features">
                      <div class="feature">
                          <div class="feature-icon">✓</div>
                          <span>Access to specialized courses for different abilities</span>
                      </div>
                      <div class="feature">
                          <div class="feature-icon">✓</div>
                          <span>Learn at your own pace with flexible scheduling</span>
                      </div>
                      <div class="feature">
                          <div class="feature-icon">✓</div>
                          <span>Connect with mentors and fellow students</span>
                      </div>
                      <div class="feature">
                          <div class="feature-icon">✓</div>
                          <span>Earn certificates upon course completion</span>
                      </div>
                  </div>

                  <div style="text-align: center;">
                      <a href="${appUrl}/courses" class="button">Explore Courses</a>
                  </div>

                  <div class="message">
                      If you have any questions or need assistance, feel free to contact our support team.
                  </div>

                  <div class="message">
                      Happy learning!<br>
                      The Course Online Disabilitas Team
                  </div>
              </div>
              <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} Course Online Disabilitas. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  /**
   * Check email service status
   */
  getStatus(): {
    connected: boolean;
    config: any;
    lastError?: string;
  } {
    return {
      connected: this.isConnected,
      config: {
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        user: emailConfig.auth.user,
        hasPassword: !!emailConfig.auth.pass,
        environment: process.env.NODE_ENV,
        isDevelopment: emailConfig.isDevelopment,
      },
    };
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<EmailResult> {
    try {
      console.log("🧪 Testing email connection...");

      // Gunakan timeout lebih lama untuk test connection
      const isReady = await this.waitForConnection(45000);

      if (isReady) {
        console.log("✅ Email service connection test successful!");
        return {
          success: true,
          message: "Email service is connected and ready",
        };
      } else {
        const errorMsg = "Email service is not connected after timeout";
        console.error("❌", errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("❌ Email connection test failed:", errorMessage);
      return {
        success: false,
        error: errorMessage || "Connection test failed",
      };
    }
  }
}

// Export singleton instance
const emailService = new EmailService();
export default emailService;
