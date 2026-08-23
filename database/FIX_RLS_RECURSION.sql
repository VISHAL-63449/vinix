-- =============================================================================
-- VINIX PLATFORM — FIX RLS RECURSION IN PROFILES AND CORE TABLES
-- Run this script in the Supabase SQL Editor (Settings → SQL Editor → New Query)
-- =============================================================================

-- 1. Create helper functions to safely check user roles without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_mentor(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles WHERE id = user_id AND role IN ('admin', 'mentor')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Create student_profiles table if it is missing
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    college TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_profiles TO authenticated;
GRANT SELECT ON public.student_profiles TO anon;


-- 3. Create the missing internship_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.internship_applications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    internship_id   UUID REFERENCES public.internships(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled')),
    student_name    TEXT,
    email           TEXT,
    phone           TEXT,
    college         TEXT,
    resume_url      TEXT,
    github_url      TEXT,
    linkedin_url    TEXT,
    year_of_study   TEXT,
    course_branch   TEXT,
    country         TEXT,
    state           TEXT,
    district        TEXT,
    city            TEXT,
    pin_code        TEXT,
    domain          TEXT,
    duration        TEXT,
    promo_code      TEXT,
    applied_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_student_internship_app UNIQUE (student_id, internship_id)
);
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.internship_applications TO authenticated;
GRANT SELECT ON public.internship_applications TO anon;


-- 4. Widen enrollments table constraint and restore uniqueness if table exists
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'enrollments') THEN
        ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_status_check;
        ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS unique_student_internship_enroll;
        ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_user_internship_unique;

        ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_status_check CHECK (status IN (
            'upcoming', 'active', 'completed', 'cancelled', 'enrolled', 'in_progress', 'dropped', 'pending'
        ));
        ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_user_internship_unique UNIQUE (student_id, internship_id);
    END IF;
END $$;


-- 5. Widen internship_enrollments table constraint if table exists
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'internship_enrollments') THEN
        ALTER TABLE public.internship_enrollments DROP CONSTRAINT IF EXISTS internship_enrollments_status_check;
        ALTER TABLE public.internship_enrollments ADD CONSTRAINT internship_enrollments_status_check CHECK (status IN (
            'enrolled', 'in_progress', 'completed', 'dropped', 'active', 'upcoming', 'cancelled', 'pending'
        ));
    END IF;
END $$;


-- 6. Apply RLS updates conditionally to avoid "relation does not exist" errors on missing/partially-migrated setups

-- Profiles Table
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
        DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
        CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
        CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
    END IF;
END $$;

-- Student Profiles Table
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'student_profiles') THEN
        DROP POLICY IF EXISTS "Admins can manage student profiles" ON public.student_profiles;
        CREATE POLICY "Admins can manage student profiles" ON public.student_profiles FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
    END IF;
END $$;

-- Domains Table
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'domains') THEN
        DROP POLICY IF EXISTS "Anyone can select active domains" ON public.domains;
        DROP POLICY IF EXISTS "Admins can manage domains" ON public.domains;
        CREATE POLICY "Anyone can select active domains" ON public.domains FOR SELECT USING (is_active = true OR public.is_admin(auth.uid()));
        CREATE POLICY "Admins can manage domains" ON public.domains FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
    END IF;
END $$;

-- Internships Table
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'internships') THEN
        DROP POLICY IF EXISTS "Anyone can select active internships" ON public.internships;
        DROP POLICY IF EXISTS "Admins can manage internships" ON public.internships;
        CREATE POLICY "Anyone can select active internships" ON public.internships FOR SELECT USING (status = 'active' OR is_active = true OR public.is_admin_or_mentor(auth.uid()));
        CREATE POLICY "Admins can manage internships" ON public.internships FOR ALL TO authenticated USING (public.is_admin_or_mentor(auth.uid()));
    END IF;
END $$;

-- Internship Tasks Table
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'internship_tasks') THEN
        DROP POLICY IF EXISTS "Admins can manage internship tasks" ON public.internship_tasks;
        CREATE POLICY "Admins can manage internship tasks" ON public.internship_tasks FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
    END IF;
END $$;

-- Internship Applications Table
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'internship_applications') THEN
        DROP POLICY IF EXISTS "Admins/Mentors can manage applications" ON public.internship_applications;
        DROP POLICY IF EXISTS "Admins can manage applications" ON public.internship_applications;
        CREATE POLICY "Admins/Mentors can manage applications" ON public.internship_applications FOR ALL TO authenticated USING (public.is_admin_or_mentor(auth.uid()));

        DROP POLICY IF EXISTS "Students can view own applications" ON public.internship_applications;
        CREATE POLICY "Students can view own applications" ON public.internship_applications FOR SELECT TO authenticated USING (student_id = auth.uid());

        DROP POLICY IF EXISTS "Students can create own applications" ON public.internship_applications;
        CREATE POLICY "Students can create own applications" ON public.internship_applications FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

        DROP POLICY IF EXISTS "Students can update own applications" ON public.internship_applications;
        CREATE POLICY "Students can update own applications" ON public.internship_applications FOR UPDATE TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
    END IF;
END $$;

-- Enrollments Table
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'enrollments') THEN
        DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.enrollments;
        CREATE POLICY "Admins can manage enrollments" ON public.enrollments FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
    END IF;
END $$;

-- Internship Enrollments Table
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'internship_enrollments') THEN
        DROP POLICY IF EXISTS "Admins can manage internship_enrollments" ON public.internship_enrollments;
        CREATE POLICY "Admins can manage internship_enrollments" ON public.internship_enrollments FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
    END IF;
END $$;

-- Submissions Table
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'submissions') THEN
        DROP POLICY IF EXISTS "Admins can manage submissions" ON public.submissions;
        CREATE POLICY "Admins can manage submissions" ON public.submissions FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
    END IF;
END $$;

-- Task Progress Table
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'task_progress') THEN
        DROP POLICY IF EXISTS "Admins can manage progress" ON public.task_progress;
        DROP POLICY IF EXISTS "Admins can manage task progress" ON public.task_progress;
        CREATE POLICY "Admins can manage task progress" ON public.task_progress FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
    END IF;
END $$;

-- Reviews Table
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
        DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
        CREATE POLICY "Admins can manage reviews" ON public.reviews FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
    END IF;
END $$;

-- Certificates Table
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'certificates') THEN
        DROP POLICY IF EXISTS "Admins can manage certificates" ON public.certificates;
        CREATE POLICY "Admins can manage certificates" ON public.certificates FOR ALL TO authenticated USING (public.is_admin_or_mentor(auth.uid()));
    END IF;
END $$;

-- Offer Letters Table
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'offer_letters') THEN
        DROP POLICY IF EXISTS "Admins can manage offer letters" ON public.offer_letters;
        DROP POLICY IF EXISTS "Admins can manage offer_letters" ON public.offer_letters;
        CREATE POLICY "Admins can manage offer letters" ON public.offer_letters FOR ALL TO authenticated USING (public.is_admin_or_mentor(auth.uid()));
    END IF;
END $$;

-- Audit Logs Table
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
        DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
        CREATE POLICY "Only admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
    END IF;
END $$;


-- 7. Trigger PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
