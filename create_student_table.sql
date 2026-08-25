-- ==========================================================
-- SQL Script: Create Students DB Schema & Views
-- This script contains table definitions, indices, and view structures
-- for the Students tab in the Vinix Admin Dashboard.
-- ==========================================================

-- 1. Create a students view to easily join profiles, internship_enrollments, and offer letters
CREATE OR REPLACE VIEW public.students_dashboard_view AS
SELECT 
    p.id AS student_id,
    p.full_name AS student_name,
    p.email AS student_email,
    ie.status AS enrollment_status,
    ie.progress AS internship_progress,
    i.title AS domain_name,
    p.college AS college_name,
    ol.offer_letter_id AS intern_id,
    p.updated_at AS last_login,
    ie.joined_at AS joined_date
FROM 
    public.profiles p
INNER JOIN 
    public.internship_enrollments ie ON p.id = ie.student_id OR p.id = ie.user_id
LEFT JOIN 
    public.internships i ON ie.internship_id = i.id
LEFT JOIN 
    public.offer_letters ol ON p.id = ol.student_id OR p.id = ol.user_id
WHERE 
    p.role = 'student';

-- 2. Grant permissions to access the view
GRANT SELECT ON public.students_dashboard_view TO authenticated;
GRANT SELECT ON public.students_dashboard_view TO anon;
GRANT SELECT ON public.students_dashboard_view TO service_role;

-- 3. Dedicated students table structure (if needed as a standalone schema table)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    intern_id VARCHAR(50) UNIQUE,
    status VARCHAR(50) DEFAULT 'Offline',
    last_login TIMESTAMPTZ,
    joined TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for students table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create simple policy for admin management
CREATE POLICY "Admins can manage students table" ON public.students 
    FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone authenticated can view student statuses" ON public.students 
    FOR SELECT TO authenticated USING (true);
