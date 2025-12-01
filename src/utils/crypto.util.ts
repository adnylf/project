import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Hash string with SHA256
 */
export function sha256Hash(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * Generate HMAC signature
 */
export function generateHMAC(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

/**
 * Verify HMAC signature
 */
export function verifyHMAC(
  data: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateHMAC(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Encrypt text (AES-256-GCM)
 */
export function encrypt(text: string, key: string): string {
  const algorithm = "aes-256-gcm";
  const keyBuffer = crypto.scryptSync(key, "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt text (AES-256-GCM)
 */
export function decrypt(encryptedText: string, key: string): string {
  const algorithm = "aes-256-gcm";
  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");

  const keyBuffer = crypto.scryptSync(key, "salt", 32);
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Generate certificate number
 */
export function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `CERT-${year}${month}-${random}`;
}

/**
 * Generate order ID
 */
export function generateOrderId(): string {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

/**
 * Generate verification code (6 digits)
 */
export function generateVerificationCode(
  userId: string,
  courseId: string,
  certificateNumber: string
): string {
  const secret =
    process.env.CERTIFICATE_SECRET || "default-secret-key-change-in-production";
  const data = `${userId}-${courseId}-${certificateNumber}`;
  return crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("hex")
    .substring(0, 16)
    .toUpperCase();
}
