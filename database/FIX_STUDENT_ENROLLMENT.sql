-- ============================================================
-- VINIX - Permanent Fix for enrollment check constraint errors
-- Run this ONCE in your Supabase SQL Editor
-- ============================================================

-- ============================================================
-- FIX 1: Drop & Recreate enrollments status constraint
--         (Adds 'pending', 'enrolled', 'in_progress', 'dropped')
-- ============================================================
ALTER TABLE public.enrollments
    DROP CONSTRAINT IF EXISTS enrollments_status_check;

ALTER TABLE public.enrollments
    DROP CONSTRAINT IF EXISTS unique_student_internship_enroll;

-- Widen the status column to allow all values used by the app
ALTER TABLE public.enrollments
    ADD CONSTRAINT enrollments_status_check
    CHECK (status IN (
        'upcoming', 'active', 'completed', 'cancelled',
        'enrolled', 'in_progress', 'dropped', 'pending'
    ));

-- Restore the uniqueness constraint (if it was dropped above)
ALTER TABLE public.enrollments
    DROP CONSTRAINT IF EXISTS enrollments_user_internship_unique;

ALTER TABLE public.enrollments
    ADD CONSTRAINT enrollments_user_internship_unique
    UNIQUE (student_id, internship_id);

-- ============================================================
-- FIX 2: Drop & Recreate internship_enrollments status constraint
--         (Adds 'pending')
-- ============================================================
ALTER TABLE public.internship_enrollments
    DROP CONSTRAINT IF EXISTS internship_enrollments_status_check;

ALTER TABLE public.internship_enrollments
    ADD CONSTRAINT internship_enrollments_status_check
    CHECK (status IN (
        'enrolled', 'in_progress', 'completed', 'dropped',
        'active', 'upcoming', 'cancelled', 'pending'
    ));

-- ============================================================
-- FIX 3: Create internship_applications table if missing
-- ============================================================
CREATE TABLE IF NOT EXISTS public.internship_applications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    internship_id   UUID REFERENCES public.internships(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled')),
    applied_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
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
    CONSTRAINT unique_student_internship_app UNIQUE (student_id, internship_id)
);

ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own applications" ON public.internship_applications;
DROP POLICY IF EXISTS "Students can create own applications" ON public.internship_applications;
DROP POLICY IF EXISTS "Students can update own applications" ON public.internship_applications;
DROP POLICY IF EXISTS "Admins can manage applications" ON public.internship_applications;

CREATE POLICY "Students can view own applications"
    ON public.internship_applications FOR SELECT TO authenticated
    USING (student_id = auth.uid());

CREATE POLICY "Students can create own applications"
    ON public.internship_applications FOR INSERT TO authenticated
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own applications"
    ON public.internship_applications FOR UPDATE TO authenticated
    USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins can manage applications"
    ON public.internship_applications FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor')));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.internship_applications TO authenticated;
GRANT ALL ON public.internship_applications TO service_role;

-- ============================================================
-- FIX 4: Insert missing enrollment records for student
-- Student ID  : 4d564805-ebf3-4208-8059-602b75eb3ee9
-- Internship  : c37a2171-7412-488b-9ab1-ccf01f0fb90e
-- ============================================================

-- internship_applications
INSERT INTO public.internship_applications (student_id, internship_id, status, student_name, email)
VALUES (
    '4d564805-ebf3-4208-8059-602b75eb3ee9',
    'c37a2171-7412-488b-9ab1-ccf01f0fb90e',
    'approved',
    'Test Student Name 123',
    'vr271028@gmail.com'
)
ON CONFLICT (student_id, internship_id) DO UPDATE SET status = 'approved', updated_at = now();

-- internship_enrollments (what dashboard reads)
INSERT INTO public.internship_enrollments (student_id, user_id, internship_id, status, application_status, progress, joined_at)
VALUES (
    '4d564805-ebf3-4208-8059-602b75eb3ee9',
    '4d564805-ebf3-4208-8059-602b75eb3ee9',
    'c37a2171-7412-488b-9ab1-ccf01f0fb90e',
    'active', 'approved', 0, now()
)
ON CONFLICT (user_id, internship_id) DO UPDATE SET status = 'active', updated_at = now();

-- enrollments (backup table)
INSERT INTO public.enrollments (student_id, user_id, internship_id, status, progress)
VALUES (
    '4d564805-ebf3-4208-8059-602b75eb3ee9',
    '4d564805-ebf3-4208-8059-602b75eb3ee9',
    'c37a2171-7412-488b-9ab1-ccf01f0fb90e',
    'active', 0
)
ON CONFLICT (student_id, internship_id) DO UPDATE SET status = 'active', updated_at = now();

-- task_progress (unlock first milestone)
INSERT INTO public.task_progress (student_id, user_id, internship_id, task_id, status)
SELECT
    '4d564805-ebf3-4208-8059-602b75eb3ee9',
    '4d564805-ebf3-4208-8059-602b75eb3ee9',
    t.internship_id,
    t.id,
    CASE WHEN t.task_number = 1 THEN 'available' ELSE 'locked' END
FROM public.internship_tasks t
WHERE t.internship_id = 'c37a2171-7412-488b-9ab1-ccf01f0fb90e'
ON CONFLICT (student_id, task_id) DO NOTHING;

-- ============================================================
-- FIX 5: Sync profile name from offer letter (real application name)
-- ============================================================

-- Update the profile name to the name entered by the student in their application
-- (offer_letters.student_name = the real name filled in the application form)
UPDATE public.profiles
SET
    full_name  = ol.student_name,
    updated_at = now()
FROM (
    SELECT student_name
    FROM public.offer_letters
    WHERE student_id = '4d564805-ebf3-4208-8059-602b75eb3ee9'
      AND student_name IS NOT NULL
      AND student_name != ''
    LIMIT 1
) ol
WHERE public.profiles.id = '4d564805-ebf3-4208-8059-602b75eb3ee9'
  AND public.profiles.full_name = 'Test Student Name 123';

-- ============================================================
-- FIX 6: Refresh PostgREST schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT
    'internship_enrollments' AS tbl, count(*) AS rows
FROM public.internship_enrollments
WHERE user_id = '4d564805-ebf3-4208-8059-602b75eb3ee9'
UNION ALL
SELECT 'enrollments', count(*) FROM public.enrollments
WHERE user_id = '4d564805-ebf3-4208-8059-602b75eb3ee9'
UNION ALL
SELECT 'internship_applications', count(*) FROM public.internship_applications
WHERE student_id = '4d564805-ebf3-4208-8059-602b75eb3ee9'
UNION ALL
SELECT 'task_progress', count(*) FROM public.task_progress
WHERE student_id = '4d564805-ebf3-4208-8059-602b75eb3ee9';
