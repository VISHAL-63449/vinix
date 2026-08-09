INSERT INTO public.courses (slug, name, short_description, icon, domain, difficulty, duration_weeks, total_topics, total_tasks, quiz_marks, pass_marks, quiz_duration_min, is_published)
VALUES
  ('mernstack', 'MERN Stack Development', 'MongoDB, Express, React, Node.js — build full-stack apps end-to-end.', 'Globe', 'mernstack', 'Intermediate', 8, 0, 0, 100, 60, 60, true),
  ('meanstack', 'MEAN Stack Development', 'MongoDB, Express, Angular, Node.js — build full-stack apps with Angular.', 'Layers', 'meanstack', 'Intermediate', 8, 0, 0, 100, 60, 60, true)
ON CONFLICT (slug) DO NOTHING;


-- RPC functions to safely expose enrollment/application counts (bypass RLS via SECURITY DEFINER)

CREATE OR REPLACE FUNCTION public.count_course_enrollments(p_course_id UUID)
RETURNS BIGINT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) FROM public.enrollments WHERE course_id = p_course_id
$$;

CREATE OR REPLACE FUNCTION public.count_domain_applications(p_domain TEXT)
RETURNS BIGINT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) FROM public.applications WHERE domain = p_domain
$$;

-- Add duration columns to applications table
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS duration INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_tasks INTEGER NOT NULL DEFAULT 5;

-- Email logs table for tracking all sent emails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_to TEXT NOT NULL,
  student_name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('offer_letter', 'certificate')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  subject TEXT NOT NULL,
  reference_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_user ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_document_type ON public.email_logs(document_type);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_logs;

-- Admins can do everything
CREATE POLICY "Admins can manage email logs" ON public.email_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can view their own email logs
CREATE POLICY "Users can view own email logs" ON public.email_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;

DROP TRIGGER IF EXISTS email_logs_updated_at ON public.email_logs;
CREATE TRIGGER email_logs_updated_at BEFORE UPDATE ON public.email_logs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_to TEXT NOT NULL,
  student_name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('offer_letter', 'certificate')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  subject TEXT NOT NULL,
  reference_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_user ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_document_type ON public.email_logs(document_type);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_logs;

-- Admins can do everything
CREATE POLICY "Admins can manage email logs" ON public.email_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can view their own email logs
CREATE POLICY "Users can view own email logs" ON public.email_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;

DROP TRIGGER IF EXISTS email_logs_updated_at ON public.email_logs;
CREATE TRIGGER email_logs_updated_at BEFORE UPDATE ON public.email_logs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- Add 'rejected' value to the application_status enum
-- Run this in your Supabase SQL Editor

DO $$
BEGIN
  ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'rejected';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RPC to fetch approved reviews with profile data (bypasses RLS on profiles)
CREATE OR REPLACE FUNCTION public.get_reviews_with_profiles(
  p_target_type TEXT,
  p_target_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::json)
    FROM (
      SELECT
        r.id,
        r.user_id,
        r.target_type,
        r.target_id,
        r.rating,
        r.title,
        r.content,
        r.status,
        r.created_at,
        r.updated_at,
        json_build_object(
          'full_name', p.full_name,
          'photo_url', p.photo_url
        ) AS profiles
      FROM public.reviews r
      LEFT JOIN public.profiles p ON r.user_id = p.id
      WHERE r.target_type = p_target_type
        AND r.target_id = p_target_id
        AND r.status = 'approved'
    ) t
  );
END;
$$;

-- RPC to fetch recent approved reviews with profiles
CREATE OR REPLACE FUNCTION public.get_recent_reviews_with_profiles(
  p_limit INT DEFAULT 6
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::json)
    FROM (
      SELECT
        r.id,
        r.user_id,
        r.target_type,
        r.target_id,
        r.rating,
        r.title,
        r.content,
        r.status,
        r.created_at,
        r.updated_at,
        json_build_object(
          'full_name', p.full_name,
          'photo_url', p.photo_url
        ) AS profiles
      FROM public.reviews r
      LEFT JOIN public.profiles p ON r.user_id = p.id
      WHERE r.status = 'approved'
      ORDER BY r.created_at DESC
      LIMIT p_limit
    ) t
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_reviews_with_profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_reviews_with_profiles TO anon, authenticated;

-- =========================================================
-- SKYROVIX — Expand tasks from 5 to 12 per domain
-- Run this in your Supabase SQL Editor
-- =========================================================

-- 1. Drop the old CHECK constraint (limited to 1-5)
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_task_number_check;

-- 2. Insert tasks 6-12 for all 30 domains
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('fullstack', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('fullstack', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('fullstack', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('fullstack', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('fullstack', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('fullstack', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('fullstack', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('frontend', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('frontend', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('frontend', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('frontend', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('frontend', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('frontend', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('frontend', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('backend', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('backend', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('backend', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('backend', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('backend', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('backend', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('backend', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('datascience', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('datascience', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('datascience', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('datascience', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('datascience', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('datascience', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('datascience', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('aiml', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('aiml', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('aiml', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('aiml', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('aiml', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('aiml', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('aiml', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('uiux', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('uiux', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('uiux', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('uiux', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('uiux', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('uiux', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('uiux', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('python', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('python', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('python', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('python', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('python', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('python', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('python', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('java', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('java', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('java', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('java', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('java', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('java', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('java', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cybersecurity', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cybersecurity', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cybersecurity', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cybersecurity', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cybersecurity', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cybersecurity', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cybersecurity', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('digitalmarketing', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('digitalmarketing', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('digitalmarketing', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('digitalmarketing', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('digitalmarketing', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('digitalmarketing', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('digitalmarketing', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cprogramming', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cprogramming', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cprogramming', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cprogramming', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cprogramming', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cprogramming', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cprogramming', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cppprogramming', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cppprogramming', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cppprogramming', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cppprogramming', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cppprogramming', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cppprogramming', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cppprogramming', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('mernstack', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('mernstack', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('mernstack', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('mernstack', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('mernstack', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('mernstack', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('mernstack', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('meanstack', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('meanstack', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('meanstack', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('meanstack', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('meanstack', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('meanstack', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('meanstack', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('dataanalytics', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('dataanalytics', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('dataanalytics', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('dataanalytics', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('dataanalytics', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('dataanalytics', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('dataanalytics', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('machinelearning', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('machinelearning', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('machinelearning', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('machinelearning', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('machinelearning', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('machinelearning', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('machinelearning', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('deeplearning', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('deeplearning', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('deeplearning', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('deeplearning', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('deeplearning', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('deeplearning', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('deeplearning', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('generativeai', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('generativeai', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('generativeai', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('generativeai', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('generativeai', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('generativeai', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('generativeai', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('promptengineering', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('promptengineering', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('promptengineering', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('promptengineering', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('promptengineering', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('promptengineering', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('promptengineering', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cloudcomputing', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cloudcomputing', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cloudcomputing', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cloudcomputing', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cloudcomputing', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cloudcomputing', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('cloudcomputing', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('ethicalhacking', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('ethicalhacking', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('ethicalhacking', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('ethicalhacking', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('ethicalhacking', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('ethicalhacking', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('ethicalhacking', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('androiddevelopment', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('androiddevelopment', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('androiddevelopment', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('androiddevelopment', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('androiddevelopment', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('androiddevelopment', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('androiddevelopment', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('flutterdevelopment', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('flutterdevelopment', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('flutterdevelopment', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('flutterdevelopment', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('flutterdevelopment', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('flutterdevelopment', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('flutterdevelopment', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('reactnative', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('reactnative', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('reactnative', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('reactnative', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('reactnative', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('reactnative', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('reactnative', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('graphicdesign', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('graphicdesign', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('graphicdesign', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('graphicdesign', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('graphicdesign', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('graphicdesign', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('graphicdesign', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('motiongraphics', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('motiongraphics', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('motiongraphics', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('motiongraphics', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('motiongraphics', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('motiongraphics', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('motiongraphics', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('videoediting', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('videoediting', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('videoediting', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('videoediting', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('videoediting', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('videoediting', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('videoediting', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('animation', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('animation', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('animation', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('animation', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('animation', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('animation', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('animation', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('threeddesign', 6, 'Advanced Feature Implementation', 'Implement advanced features with complex business logic and third-party integrations.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('threeddesign', 7, 'API Development & Integration', 'Design and build RESTful APIs or integrate third-party services relevant to your domain.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('threeddesign', 8, 'Database Design & Optimization', 'Design efficient schemas, write optimized queries, and implement indexing strategies.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('threeddesign', 9, 'Performance Optimization', 'Profile and optimize your application for speed, scalability, and resource efficiency.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('threeddesign', 10, 'Testing & Quality Assurance', 'Write unit and integration tests, perform QA, and ensure code quality standards.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('threeddesign', 11, 'Deployment & DevOps', 'Set up CI/CD pipelines, containerize your application, and deploy to a cloud platform.') ON CONFLICT (domain, task_number) DO NOTHING;
INSERT INTO public.tasks (domain, task_number, title, description) VALUES ('threeddesign', 12, 'Portfolio & Documentation', 'Create comprehensive documentation, record a demo, and prepare your portfolio showcase.') ON CONFLICT (domain, task_number) DO NOTHING;

-- 3. Add the expanded constraint (0-12)
ALTER TABLE public.tasks ADD CONSTRAINT tasks_task_number_check CHECK (task_number BETWEEN 0 AND 12);

