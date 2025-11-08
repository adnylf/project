export type DisabilityType = 'fisik' | 'sensorik' | 'mental' | 'intelektual' | 'none';
export type Gender = 'L' | 'P' | 'other';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type UserRole = 'user' | 'mentor' | 'admin';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
export type CourseStatus = 'draft' | 'published' | 'archived' | 'under_review';
export type MaterialType = 'video' | 'article' | 'quiz' | 'assignment' | 'live_session' | 'download';
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'e-wallet' | 'voucher';
export type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed' | 'expired' | 'refunded' | 'partial_refund';
export type EnrollmentType = 'free' | 'paid' | 'scholarship';
export type EnrollmentStatus = 'pending_payment' | 'active' | 'expired';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  disability_type?: DisabilityType;
  birth_date?: string;
  gender?: Gender;
  address?: string;
  status: UserStatus;
  role: UserRole;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  bio?: string;
  province?: string;
  city?: string;
  postal_code?: string;
  disability_detail?: string;
  accessibility_preferences?: {
    screen_reader: boolean;
    subtitle: boolean;
    sign_language: boolean;
    audio_description: boolean;
    keyboard_navigation: boolean;
  };
  language_pref: string;
  timezone: string;
  profile_picture?: string;
  default_avatar?: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  short_description?: string;
  full_description?: string;
  thumbnail?: string;
  promo_video?: string;
  instructor_id: string;
  price: number;
  discount_price?: number;
  discount_percentage?: number;
  discount_start?: string;
  discount_end?: string;
  level: CourseLevel;
  language: string;
  total_duration?: number;
  total_materials?: number;
  total_students: number;
  rating_average: number;
  total_reviews: number;
  requirements?: string[];
  what_you_will_learn?: string[];
  target_audience?: string[];
  certificate_included: boolean;
  lifetime_access: boolean;
  access_duration_days?: number;
  accessibility_features?: any;
  tags?: string[];
  status: CourseStatus;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_type: EnrollmentType;
  payment_required: boolean;
  transaction_id?: string;
  enrollment_date: string;
  access_granted: boolean;
  access_granted_at?: string;
  voucher_code?: string;
  voucher_discount: number;
  final_price: number;
  enrollment_status: EnrollmentStatus;
  auto_enroll: boolean;
  progress_percentage: number;
  last_accessed?: string;
  completed_at?: string;
  certificate_id?: string;
  total_watch_time_seconds: number;
  current_material_id?: string;
  rating?: number;
  review?: string;
  reviewed_at?: string;
}

export interface Transaction {
  id: string;
  transaction_id: string;
  invoice_number: string;
  user_id: string;
  course_id: string;
  amount: number;
  platform_fee: number;
  mentor_payout: number;
  payment_method: PaymentMethod;
  payment_gateway?: string;
  payment_status: PaymentStatus;
  transaction_date: string;
  paid_at?: string;
  payment_proof?: string;
  voucher_code?: string;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  currency: string;
  exchange_rate: number;
  payout_status?: string;
  payout_date?: string;
  notes?: string;
}

export interface Certificate {
  id: string;
  certificate_number: string;
  user_id: string;
  course_id: string;
  enrollment_id: string;
  user_name_snapshot: string;
  course_title_snapshot: string;
  instructor_name: string;
  completion_date: string;
  issue_date: string;
  certificate_template_id: string;
  certificate_file_path?: string;
  certificate_hash: string;
  verification_code: string;
  qr_code_path?: string;
  verification_url?: string;
  is_valid: boolean;
  revoked_at?: string;
  revocation_reason?: string;
  download_count: number;
  last_downloaded?: string;
  shared_count: number;
  created_at: string;
}
