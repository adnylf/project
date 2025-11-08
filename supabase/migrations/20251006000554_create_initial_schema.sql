/*
  # Initial Database Schema for EduAccess Platform

  ## Overview
  Creates the foundational database structure for the Online Course Disabilitas platform.

  ## New Tables Created

  ### 1. users_profile
    - `id` (uuid, primary key, references auth.users)
    - `full_name` (text, required)
    - `disability_type` (text, nullable)
    - `phone` (text, nullable)
    - `address` (text, nullable)
    - `date_of_birth` (date, nullable)
    - `bio` (text, nullable)
    - `avatar_url` (text, nullable)
    - `created_at` (timestamptz, default now())
    - `updated_at` (timestamptz, default now())

  ### 2. courses
    - `id` (uuid, primary key, auto-generated)
    - `title` (text, required)
    - `description` (text, required)
    - `mentor_id` (uuid, references users_profile)
    - `category` (text, required)
    - `level` (text, required)
    - `price` (numeric, default 0)
    - `duration` (text, nullable)
    - `thumbnail_url` (text, nullable)
    - `status` (text, default 'draft')
    - `rating` (numeric, default 0)
    - `total_students` (integer, default 0)
    - `created_at` (timestamptz, default now())
    - `updated_at` (timestamptz, default now())

  ### 3. modules
    - `id` (uuid, primary key, auto-generated)
    - `course_id` (uuid, references courses)
    - `title` (text, required)
    - `description` (text, nullable)
    - `order_index` (integer, required)
    - `created_at` (timestamptz, default now())
    - `updated_at` (timestamptz, default now())

  ### 4. lessons
    - `id` (uuid, primary key, auto-generated)
    - `module_id` (uuid, references modules)
    - `title` (text, required)
    - `content` (text, nullable)
    - `video_url` (text, nullable)
    - `duration` (integer, nullable, in minutes)
    - `order_index` (integer, required)
    - `created_at` (timestamptz, default now())
    - `updated_at` (timestamptz, default now())

  ### 5. enrollments
    - `id` (uuid, primary key, auto-generated)
    - `user_id` (uuid, references users_profile)
    - `course_id` (uuid, references courses)
    - `progress` (integer, default 0)
    - `completed` (boolean, default false)
    - `enrolled_at` (timestamptz, default now())
    - `completed_at` (timestamptz, nullable)

  ### 6. certificates
    - `id` (uuid, primary key, auto-generated)
    - `enrollment_id` (uuid, references enrollments)
    - `certificate_number` (text, unique, required)
    - `issued_at` (timestamptz, default now())

  ### 7. transactions
    - `id` (uuid, primary key, auto-generated)
    - `user_id` (uuid, references users_profile)
    - `course_id` (uuid, references courses)
    - `amount` (numeric, required)
    - `status` (text, default 'pending')
    - `payment_method` (text, nullable)
    - `created_at` (timestamptz, default now())
    - `updated_at` (timestamptz, default now())

  ### 8. reviews
    - `id` (uuid, primary key, auto-generated)
    - `user_id` (uuid, references users_profile)
    - `course_id` (uuid, references courses)
    - `rating` (integer, required, 1-5)
    - `comment` (text, nullable)
    - `created_at` (timestamptz, default now())
    - `updated_at` (timestamptz, default now())

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Implement policies for authenticated users to access their own data
  - Implement policies for mentors to manage their courses
  - Implement policies for public read access to published courses
*/

-- Create users_profile table
CREATE TABLE IF NOT EXISTS users_profile (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  disability_type text,
  phone text,
  address text,
  date_of_birth date,
  bio text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  mentor_id uuid REFERENCES users_profile(id) ON DELETE CASCADE,
  category text NOT NULL,
  level text NOT NULL,
  price numeric DEFAULT 0,
  duration text,
  thumbnail_url text,
  status text DEFAULT 'draft',
  rating numeric DEFAULT 0,
  total_students integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published courses"
  ON courses FOR SELECT
  USING (status = 'published' OR auth.uid() = mentor_id);

CREATE POLICY "Mentors can create courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = mentor_id);

CREATE POLICY "Mentors can update own courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (auth.uid() = mentor_id)
  WITH CHECK (auth.uid() = mentor_id);

CREATE POLICY "Mentors can delete own courses"
  ON courses FOR DELETE
  TO authenticated
  USING (auth.uid() = mentor_id);

-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view modules of accessible courses"
  ON modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = modules.course_id
      AND (courses.status = 'published' OR courses.mentor_id = auth.uid())
    )
  );

CREATE POLICY "Mentors can manage modules of own courses"
  ON modules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = modules.course_id
      AND courses.mentor_id = auth.uid()
    )
  );

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  video_url text,
  duration integer,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lessons of accessible modules"
  ON lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM modules
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id
      AND (courses.status = 'published' OR courses.mentor_id = auth.uid())
    )
  );

CREATE POLICY "Mentors can manage lessons of own courses"
  ON lessons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id
      AND courses.mentor_id = auth.uid()
    )
  );

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_profile(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  progress integer DEFAULT 0,
  completed boolean DEFAULT false,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(user_id, course_id)
);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own enrollments"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollments"
  ON enrollments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mentors can view enrollments of own courses"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = enrollments.course_id
      AND courses.mentor_id = auth.uid()
    )
  );

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,
  certificate_number text UNIQUE NOT NULL,
  issued_at timestamptz DEFAULT now()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates"
  ON certificates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.id = certificates.enrollment_id
      AND enrollments.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create certificates"
  ON certificates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.id = certificates.enrollment_id
      AND enrollments.user_id = auth.uid()
    )
  );

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_profile(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status text DEFAULT 'pending',
  payment_method text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mentors can view transactions for own courses"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = transactions.course_id
      AND courses.mentor_id = auth.uid()
    )
  );

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_profile(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_mentor_id ON courses(mentor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_course_id ON reviews(course_id);
