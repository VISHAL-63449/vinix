-- =============================================================================
-- Migration: Create internship_applications and student_profiles Tables
-- =============================================================================

-- 1. Create internship_applications table
CREATE TABLE IF NOT EXISTS public.internship_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled')),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    student_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    college TEXT,
    resume_url TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    year_of_study TEXT,
    course_branch TEXT,
    country TEXT,
    state TEXT,
    district TEXT,
    city TEXT,
    pin_code TEXT,
    domain TEXT,
    duration TEXT,
    promo_code TEXT,
    CONSTRAINT unique_student_internship_app UNIQUE (student_id, internship_id)
);

-- Enable RLS on internship_applications
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;

-- Create Policies for internship_applications
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internship_applications' AND policyname = 'Students can view own applications') THEN
        CREATE POLICY "Students can view own applications" ON public.internship_applications 
            FOR SELECT TO authenticated USING (student_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internship_applications' AND policyname = 'Students can create own applications') THEN
        CREATE POLICY "Students can create own applications" ON public.internship_applications 
            FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internship_applications' AND policyname = 'Students can update own applications') THEN
        CREATE POLICY "Students can update own applications" ON public.internship_applications 
            FOR UPDATE TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internship_applications' AND policyname = 'Admins/Mentors can manage applications') THEN
        CREATE POLICY "Admins/Mentors can manage applications" ON public.internship_applications 
            FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor')));
    END IF;
END $$;


-- 2. Create student_profiles table
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    college TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on student_profiles
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Create Policies for student_profiles
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_profiles' AND policyname = 'Students can view own student profile') THEN
        CREATE POLICY "Students can view own student profile" ON public.student_profiles 
            FOR SELECT TO authenticated USING (id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_profiles' AND policyname = 'Students can manage own student profile') THEN
        CREATE POLICY "Students can manage own student profile" ON public.student_profiles 
            FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_profiles' AND policyname = 'Admins can manage student profiles') THEN
        CREATE POLICY "Admins can manage student profiles" ON public.student_profiles 
            FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor')));
    END IF;
END $$;


-- 3. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internship_applications TO authenticated;
GRANT SELECT, INSERT ON public.internship_applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_profiles TO authenticated;
GRANT SELECT, INSERT ON public.student_profiles TO anon;


-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_internship_applications_student_id ON public.internship_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_id ON public.student_profiles(id);

-- Refresh the cache
SELECT pg_reload_conf();
