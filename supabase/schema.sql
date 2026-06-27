-- ============================================================
-- Chemistry Teaching Platform - Database Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- Organizations (High School, College 1, College 2)
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('high_school', 'college')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (linked to Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('teacher', 'student')),
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons
CREATE TABLE lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements / Guidance
CREATE TABLE announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments
CREATE TABLE assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submissions
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  file_url TEXT,
  grade TEXT,
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  graded_at TIMESTAMPTZ,
  UNIQUE(assignment_id, student_id)
);

-- ============================================================
-- Seed the 3 organizations
-- ============================================================
INSERT INTO organizations (name, type) VALUES
  ('High School', 'high_school'),
  ('College 1', 'college'),
  ('College 2', 'college');

-- ============================================================
-- Enable Row Level Security on all tables
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies
-- ============================================================

-- Organizations: anyone authenticated can see all orgs (needed for signup dropdown)
CREATE POLICY "Anyone can view organizations" ON organizations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Profiles
CREATE POLICY "Users see own profile or teacher sees all" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'teacher')
  );
CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Courses: students see only their org, teacher sees all
CREATE POLICY "Scoped course select" ON courses FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid()
    AND (p.organization_id = courses.organization_id OR p.role = 'teacher')
  )
);
CREATE POLICY "Teacher manages courses" ON courses FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'teacher')
);

-- Lessons
CREATE POLICY "Scoped lesson select" ON lessons FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid()
    AND (p.organization_id = lessons.organization_id OR p.role = 'teacher')
  )
);
CREATE POLICY "Teacher manages lessons" ON lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'teacher')
);

-- Announcements
CREATE POLICY "Scoped announcement select" ON announcements FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid()
    AND (p.organization_id = announcements.organization_id OR p.role = 'teacher')
  )
);
CREATE POLICY "Teacher manages announcements" ON announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'teacher')
);

-- Assignments
CREATE POLICY "Scoped assignment select" ON assignments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid()
    AND (p.organization_id = assignments.organization_id OR p.role = 'teacher')
  )
);
CREATE POLICY "Teacher manages assignments" ON assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'teacher')
);

-- Submissions: students see only their own; teacher sees all
CREATE POLICY "Students see own submissions" ON submissions FOR SELECT USING (
  student_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'teacher')
);
CREATE POLICY "Students can submit" ON submissions FOR INSERT
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students update own ungraded submission" ON submissions FOR UPDATE
  USING (student_id = auth.uid() AND grade IS NULL);
CREATE POLICY "Teacher grades submissions" ON submissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'teacher')
);

-- ============================================================
-- Auto-create profile row when a user signs up
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
