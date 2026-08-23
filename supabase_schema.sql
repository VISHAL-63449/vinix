-- VINIX PostgreSQL Supabase Schema Setup
-- Paste this script into your Supabase SQL Editor and click 'RUN'.

-- Enable extension for UUID generation if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. DEPARTMENTS, YEARS, SEMESTERS, SUBJECTS (ACADEMIC SYSTEM)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_number INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_number INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE
);

-- ==========================================
-- 2. USER PROFILE TABLES (ZOD & ZERO DUPLICATE PATTERN)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    bio TEXT,
    skills TEXT[] DEFAULT '{}',
    github TEXT,
    linkedin TEXT,
    portfolio TEXT,
    resume_url TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'mentor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_profiles (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
    semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
    college TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL
);

-- Academic Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    semester_id UUID REFERENCES public.semesters(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    UNIQUE(course_id, semester_id, code)
);

-- ==========================================
-- 3. INTERNSHIPS AND MODULES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.internships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    company TEXT NOT NULL DEFAULT 'VINIX',
    category TEXT NOT NULL, -- e.g. "Web Development", "AI & ML"
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    eligible_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
    eligible_semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
    duration TEXT NOT NULL, -- "4 Weeks", "8 Weeks", "3 Months", "6 Months"
    mode TEXT NOT NULL DEFAULT 'Remote' CHECK (mode IN ('Remote', 'Hybrid', 'In-office')),
    difficulty TEXT NOT NULL DEFAULT 'Intermediate' CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    skills TEXT[] DEFAULT '{}',
    description TEXT NOT NULL,
    learning_outcomes TEXT[] DEFAULT '{}',
    seats INTEGER NOT NULL DEFAULT 50,
    application_deadline TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.internship_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    UNIQUE(internship_id, order_index)
);

CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES public.internship_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_text TEXT,
    image_url TEXT,
    code_example TEXT,
    video_url TEXT,
    resources TEXT[] DEFAULT '{}',
    quiz_questions JSONB DEFAULT '[]'::jsonb, -- [{question, options, answer}]
    order_index INTEGER NOT NULL,
    UNIQUE(module_id, order_index)
);

CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT TRUE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(student_id, lesson_id)
);

-- ==========================================
-- 4. APPLICATION & ENROLLMENT WORKFLOW
-- ==========================================
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

CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_student_internship_enroll UNIQUE (student_id, internship_id)
);

-- ==========================================
-- 5. TASKS AND SUBMISSIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT,
    module_id UUID REFERENCES public.internship_modules(id) ON DELETE SET NULL,
    difficulty TEXT NOT NULL DEFAULT 'Medium',
    due_days INTEGER DEFAULT 7,
    points INTEGER DEFAULT 100,
    submission_type TEXT NOT NULL DEFAULT 'github_live' CHECK (submission_type IN ('text', 'link', 'file', 'github_live', 'any')),
    resources TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('not_started', 'in_progress', 'submitted', 'under_review', 'approved', 'changes_requested')),
    submission_text TEXT,
    github_url TEXT,
    live_url TEXT,
    file_url TEXT,
    screenshot_url TEXT,
    points_awarded INTEGER DEFAULT 0,
    feedback TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    CONSTRAINT unique_student_task UNIQUE (student_id, task_id)
);

-- ==========================================
-- 6. PROJECTS AND SUBMISSIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[] DEFAULT '{}',
    skills TEXT[] DEFAULT '{}',
    resources TEXT[] DEFAULT '{}',
    deadline_days INTEGER NOT NULL DEFAULT 14,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected', 'changes_requested')),
    project_name TEXT NOT NULL,
    description TEXT,
    github_url TEXT,
    live_url TEXT,
    screenshot_url TEXT,
    file_url TEXT,
    feedback TEXT,
    score INTEGER CHECK (score BETWEEN 0 AND 100),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    CONSTRAINT unique_student_project UNIQUE (student_id, project_id)
);

-- ==========================================
-- 7. EVALUATION AND GRADE GENERATION
-- ==========================================
CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
    technical_skills INTEGER NOT NULL CHECK (technical_skills BETWEEN 0 AND 100),
    problem_solving INTEGER NOT NULL CHECK (problem_solving BETWEEN 0 AND 100),
    project_quality INTEGER NOT NULL CHECK (project_quality BETWEEN 0 AND 100),
    task_completion INTEGER NOT NULL CHECK (task_completion BETWEEN 0 AND 100),
    communication INTEGER NOT NULL CHECK (communication BETWEEN 0 AND 100),
    overall_performance INTEGER NOT NULL CHECK (overall_performance BETWEEN 0 AND 100),
    score INTEGER GENERATED ALWAYS AS ((technical_skills + problem_solving + project_quality + task_completion + communication + overall_performance) / 6) STORED,
    grade TEXT NOT NULL, -- e.g. "Excellent", "Very Good", "Good", "Pass", "Not Passed"
    feedback TEXT,
    evaluated_by UUID REFERENCES auth.users(id),
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_student_internship_eval UNIQUE (student_id, internship_id)
);

-- ==========================================
-- 8. OFFER LETTERS, ID CARDS, CERTIFICATES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.offer_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.internship_applications(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE,
    offer_letter_id TEXT NOT NULL UNIQUE, -- VINIX-OFFER-2026-000001
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    internship_title TEXT NOT NULL,
    department TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    company_name TEXT NOT NULL DEFAULT 'VINIX',
    authorized_signatory TEXT NOT NULL DEFAULT 'Vinix Operations Team',
    status TEXT NOT NULL DEFAULT 'GENERATED' CHECK (status IN ('GENERATED', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.internship_id_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
    card_number TEXT NOT NULL UNIQUE, -- VINIX-INT-2026-000001
    student_photo TEXT,
    student_name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    qr_code_url TEXT,
    company_logo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE,
    certificate_id TEXT NOT NULL UNIQUE, -- VINIX-CERT-2026-000001
    verification_code TEXT NOT NULL UNIQUE,
    student_name TEXT NOT NULL,
    internship_name TEXT NOT NULL,
    company TEXT NOT NULL DEFAULT 'VINIX',
    duration TEXT NOT NULL,
    completion_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    final_score INTEGER NOT NULL,
    grade TEXT NOT NULL,
    authorized_signature TEXT NOT NULL DEFAULT 'Vinix Certification Authority',
    status TEXT NOT NULL DEFAULT 'VALID',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 9. NOTIFICATIONS & PORTFOLIOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g. "application_approved", "task_assigned", "grading"
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.portfolio_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    username TEXT NOT NULL UNIQUE,
    is_public BOOLEAN DEFAULT TRUE,
    theme TEXT DEFAULT 'modern',
    custom_css TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.portfolio_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES public.portfolio_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    github_url TEXT,
    live_url TEXT,
    screenshot_url TEXT,
    order_index INTEGER DEFAULT 0
);

-- ==========================================
-- 10. AUDIT LOGGING SYSTEM
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 11. AUTOMATIC PROFILE AND REGISTRATION TRIGGERS
-- ==========================================

-- Function to handle syncing new users in auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, created_at, updated_at)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', 'New Student'),
        new.email,
        COALESCE(new.raw_user_meta_data->>'role', 'student'),
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = now();

    -- Also insert default student_profile if the role is student
    IF COALESCE(new.raw_user_meta_data->>'role', 'student') = 'student' THEN
        INSERT INTO public.student_profiles (id, college, created_at, updated_at)
        VALUES (new.id, COALESCE(new.raw_user_meta_data->>'college', ''), now(), now())
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for profile updates to auto update updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Security Definer functions to check roles without recursion
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

-- ==========================================
-- 12. ENABLE ROW LEVEL SECURITY (RLS) FOR ALL PUBLIC TABLES
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_id_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 13. POLICIES CREATION (STUDENT, ADMIN, MENTOR)
-- ==========================================

-- Profiles: Anyone authenticated can view profiles, users can update their own details, admins can manage
CREATE POLICY "Users can select profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL TO authenticated 
    USING (public.is_admin(auth.uid()));

-- Student Profiles
CREATE POLICY "Users can select student profiles" ON public.student_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students can update own profile" ON public.student_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can manage student profiles" ON public.student_profiles FOR ALL TO authenticated 
    USING (public.is_admin(auth.uid()));

-- Academic System: Anyone can view, Admins/Mentors can manage
CREATE POLICY "Anyone can view departments" ON public.departments FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL TO authenticated 
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view academic_years" ON public.academic_years FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage academic_years" ON public.academic_years FOR ALL TO authenticated 
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view semesters" ON public.semesters FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage semesters" ON public.semesters FOR ALL TO authenticated 
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL TO authenticated 
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage subjects" ON public.subjects FOR ALL TO authenticated 
    USING (public.is_admin(auth.uid()));

-- Internships, Modules, Lessons: Published/active internships readable by all, Admin/Mentor can do everything
CREATE POLICY "Anyone can select active internships" ON public.internships FOR SELECT TO authenticated, anon 
    USING (status = 'active' OR public.is_admin_or_mentor(auth.uid()));
CREATE POLICY "Admins can manage internships" ON public.internships FOR ALL TO authenticated 
    USING (public.is_admin_or_mentor(auth.uid()));

CREATE POLICY "Anyone can select modules" ON public.internship_modules FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage modules" ON public.internship_modules FOR ALL TO authenticated 
    USING (public.is_admin_or_mentor(auth.uid()));

CREATE POLICY "Anyone can select lessons" ON public.lessons FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admins can manage lessons" ON public.lessons FOR ALL TO authenticated 
    USING (public.is_admin_or_mentor(auth.uid()));

CREATE POLICY "Students can view and manage own lesson progress" ON public.lesson_progress FOR ALL TO authenticated 
    USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

-- Internship Applications
CREATE POLICY "Students can view own applications" ON public.internship_applications FOR SELECT TO authenticated 
    USING (student_id = auth.uid());
CREATE POLICY "Students can create own applications" ON public.internship_applications FOR INSERT TO authenticated 
    WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can update own applications" ON public.internship_applications FOR UPDATE TO authenticated 
    USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "Admins/Mentors can manage applications" ON public.internship_applications FOR ALL TO authenticated 
    USING (public.is_admin_or_mentor(auth.uid()));

-- Enrollments
CREATE POLICY "Students can view own enrollments" ON public.enrollments FOR SELECT TO authenticated 
    USING (student_id = auth.uid());
CREATE POLICY "Admins/Mentors can manage enrollments" ON public.enrollments FOR ALL TO authenticated 
    USING (public.is_admin_or_mentor(auth.uid()));

-- Tasks and Submissions
CREATE POLICY "Students can view tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins/Mentors can manage tasks" ON public.tasks FOR ALL TO authenticated 
    USING (public.is_admin_or_mentor(auth.uid()));

CREATE POLICY "Students can view and manage own submissions" ON public.task_submissions FOR ALL TO authenticated 
    USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "Admins/Mentors can view and review submissions" ON public.task_submissions FOR ALL TO authenticated 
    USING (public.is_admin_or_mentor(auth.uid()));

-- Projects
CREATE POLICY "Students can view projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins/Mentors can manage projects" ON public.projects FOR ALL TO authenticated 
    USING (public.is_admin_or_mentor(auth.uid()));

CREATE POLICY "Students can view and manage own project submissions" ON public.project_submissions FOR ALL TO authenticated 
    USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "Admins/Mentors can view and review project submissions" ON public.project_submissions FOR ALL TO authenticated 
    USING (public.is_admin_or_mentor(auth.uid()));

-- Evaluations
CREATE POLICY "Students can view own evaluations" ON public.evaluations FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Admins/Mentors can manage evaluations" ON public.evaluations FOR ALL TO authenticated 
    USING (public.is_admin_or_mentor(auth.uid()));

-- Offer Letters, ID cards, Certificates: Publicly verifiable by anonymous users, owned by student
CREATE POLICY "Anyone can select certificates for verification" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Admins can manage certificates" ON public.certificates FOR ALL TO authenticated 
    USING (public.is_admin_or_mentor(auth.uid()));

-- Offer Letters
CREATE POLICY "Anyone can select offer_letters for verification" ON public.offer_letters FOR SELECT USING (true);
CREATE POLICY "Admins can manage offer_letters" ON public.offer_letters FOR ALL TO authenticated 
    USING (public.is_admin_or_mentor(auth.uid()));

-- ID Cards
CREATE POLICY "Anyone can verify ID cards" ON public.internship_id_cards FOR SELECT USING (true);
CREATE POLICY "Admins can manage ID cards" ON public.internship_id_cards FOR ALL TO authenticated 
    USING (public.is_admin_or_mentor(auth.uid()));

-- Notifications
CREATE POLICY "Students can view and manage own notifications" ON public.notifications FOR ALL TO authenticated 
    USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "Admins/System can insert notifications" ON public.notifications FOR INSERT TO authenticated 
    WITH CHECK (true);

-- Portfolios
CREATE POLICY "Anyone can select portfolios if public" ON public.portfolio_profiles FOR SELECT USING (is_public = true OR auth.uid() = student_id);
CREATE POLICY "Students can manage own portfolio profile" ON public.portfolio_profiles FOR ALL TO authenticated 
    USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE POLICY "Anyone can select portfolio projects" ON public.portfolio_projects FOR SELECT USING (true);
CREATE POLICY "Students can manage own portfolio projects" ON public.portfolio_projects FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.portfolio_profiles WHERE id = portfolio_id AND student_id = auth.uid()));

-- Audit logs
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated 
    USING (public.is_admin(auth.uid()));
CREATE POLICY "Anyone authenticated can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() IS NOT NULL);


-- ==========================================
-- 14. SEED SAMPLE ACADEMIC DATA
-- ==========================================
INSERT INTO public.departments (name, code) VALUES
('Computer Science & Engineering', 'CSE'),
('Information Technology', 'IT'),
('Electronics & Communication Engineering', 'ECE'),
('Electrical & Electronics Engineering', 'EEE'),
('Mechanical Engineering', 'MECH'),
('Civil Engineering', 'CIVIL')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.academic_years (year_number, name) VALUES
(1, '1st Year'),
(2, '2nd Year'),
(3, '3rd Year'),
(4, '4th Year')
ON CONFLICT (year_number) DO NOTHING;

INSERT INTO public.semesters (semester_number, name) VALUES
(1, 'Semester 1'),
(2, 'Semester 2'),
(3, 'Semester 3'),
(4, 'Semester 4'),
(5, 'Semester 5'),
(6, 'Semester 6'),
(7, 'Semester 7'),
(8, 'Semester 8')
ON CONFLICT (semester_number) DO NOTHING;

-- Grant permissions to read/write from client
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;


-- ==========================================================
-- 15. DOMAINS AND COMPATIBILITY UPGRADES FOR VIRTUAL INTERNSHIPS
-- ==========================================================

-- Create domains table
CREATE TABLE IF NOT EXISTS public.domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(255) NOT NULL,
    image TEXT,
    skills TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for domains
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can select active domains" ON public.domains FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage domains" ON public.domains FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Sync / Upgrade internships table
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS domain_id UUID REFERENCES public.domains(id) ON DELETE SET NULL;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Intermediate';
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS stipend TEXT DEFAULT 'Unpaid';
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create internship_tasks table
CREATE TABLE IF NOT EXISTS public.internship_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    task_number INTEGER NOT NULL,
    deadline TEXT DEFAULT '7 Days',
    points INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for internship_tasks
ALTER TABLE public.internship_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view internship tasks" ON public.internship_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage internship tasks" ON public.internship_tasks FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Enrollments & internship_enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'dropped', 'active', 'upcoming', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_student_internship_enroll UNIQUE (student_id, internship_id)
);

CREATE TABLE IF NOT EXISTS public.internship_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'dropped', 'active', 'upcoming', 'cancelled')),
    application_status VARCHAR(50) DEFAULT 'approved',
    progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_internship_enroll UNIQUE (user_id, internship_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own enrollments" ON public.enrollments FOR SELECT TO authenticated USING (student_id = auth.uid() OR user_id = auth.uid());
CREATE POLICY "Admins can manage enrollments" ON public.enrollments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Students can view own internship_enrollments" ON public.internship_enrollments FOR SELECT TO authenticated USING (student_id = auth.uid() OR user_id = auth.uid());
CREATE POLICY "Admins can manage internship_enrollments" ON public.internship_enrollments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Submissions and task_progress
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.internship_tasks(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    submission_url TEXT,
    description TEXT,
    status VARCHAR(50) DEFAULT 'submitted',
    marks INTEGER DEFAULT 0,
    feedback TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.task_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.internship_tasks(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'locked',
    submission_url TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    student_note TEXT,
    admin_feedback TEXT,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    CONSTRAINT unique_user_task_progress UNIQUE (student_id, task_id)
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view/insert own submissions" ON public.submissions FOR ALL TO authenticated USING (student_id = auth.uid() OR user_id = auth.uid()) WITH CHECK (student_id = auth.uid() OR user_id = auth.uid());
CREATE POLICY "Admins can manage submissions" ON public.submissions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Students can view/manage own progress" ON public.task_progress FOR ALL TO authenticated USING (student_id = auth.uid() OR user_id = auth.uid()) WITH CHECK (student_id = auth.uid() OR user_id = auth.uid());
CREATE POLICY "Admins can manage progress" ON public.task_progress FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    review TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid() OR user_id = auth.uid());
CREATE POLICY "Admins can manage reviews" ON public.reviews FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Certificates upgrades
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS certificate_number TEXT UNIQUE;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS certificate_url TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'VALID';
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS course_name TEXT;

-- Triggers for cross column compatibility
CREATE OR REPLACE FUNCTION public.sync_submissions_ids()
RETURNS trigger AS $$
BEGIN
    IF NEW.student_id IS NULL AND NEW.user_id IS NOT NULL THEN
        NEW.student_id := NEW.user_id;
    ELSIF NEW.user_id IS NULL AND NEW.student_id IS NOT NULL THEN
        NEW.user_id := NEW.student_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.sync_enrollment_ids()
RETURNS trigger AS $$
BEGIN
    IF NEW.student_id IS NULL AND NEW.user_id IS NOT NULL THEN
        NEW.student_id := NEW.user_id;
    ELSIF NEW.user_id IS NULL AND NEW.student_id IS NOT NULL THEN
        NEW.user_id := NEW.student_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.sync_certificate_numbers()
RETURNS trigger AS $$
BEGIN
    IF NEW.certificate_id IS NULL AND NEW.certificate_number IS NOT NULL THEN
        NEW.certificate_id := NEW.certificate_number;
    ELSIF NEW.certificate_number IS NULL AND NEW.certificate_id IS NOT NULL THEN
        NEW.certificate_number := NEW.certificate_id;
    END IF;
    
    IF NEW.verification_code IS NULL THEN
        NEW.verification_code := COALESCE(NEW.certificate_id, md5(random()::text));
    END IF;
    
    IF NEW.issued_at IS NULL AND NEW.issue_date IS NOT NULL THEN
        NEW.issued_at := NEW.issue_date;
    ELSIF NEW.issue_date IS NULL AND NEW.issued_at IS NOT NULL THEN
        NEW.issue_date := NEW.issued_at;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_subs_trigger ON public.submissions;
CREATE TRIGGER sync_subs_trigger BEFORE INSERT OR UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.sync_submissions_ids();

DROP TRIGGER IF EXISTS sync_task_prog_trigger ON public.task_progress;
CREATE TRIGGER sync_task_prog_trigger BEFORE INSERT OR UPDATE ON public.task_progress FOR EACH ROW EXECUTE FUNCTION public.sync_submissions_ids();

DROP TRIGGER IF EXISTS sync_enrolls_trigger ON public.enrollments;
CREATE TRIGGER sync_enrolls_trigger BEFORE INSERT OR UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.sync_enrollment_ids();

DROP TRIGGER IF EXISTS sync_internship_enrolls_trigger ON public.internship_enrollments;
CREATE TRIGGER sync_internship_enrolls_trigger BEFORE INSERT OR UPDATE ON public.internship_enrollments FOR EACH ROW EXECUTE FUNCTION public.sync_enrollment_ids();

DROP TRIGGER IF EXISTS sync_reviews_ids_trigger ON public.reviews;
CREATE TRIGGER sync_reviews_ids_trigger BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.sync_submissions_ids();

DROP TRIGGER IF EXISTS sync_cert_num_trigger ON public.certificates;
CREATE TRIGGER sync_cert_num_trigger BEFORE INSERT OR UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.sync_certificate_numbers();

-- Seed 20 domains automatically
INSERT INTO public.domains (name, slug, description, icon, image, skills, is_active) VALUES
('Web Development', 'web-development', 'Build interactive and modern websites using foundational frontend and backend tools.', 'Code', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600', ARRAY['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express'], true),
('Full Stack Development', 'full-stack-development', 'Master both client-side and server-side engineering to build entire applications from scratch.', 'Layers', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600', ARRAY['React', 'Node.js', 'Express', 'MongoDB', 'SQL', 'Tailwind CSS'], true),
('Frontend Development', 'frontend-development', 'Architect beautiful user-facing interfaces with state management, animations, and high performance.', 'LayoutDashboard', 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=600', ARRAY['HTML', 'CSS', 'JavaScript', 'React', 'Next.js', 'Tailwind CSS'], true),
('Backend Development', 'backend-development', 'Engineer scalable server logic, REST APIs, microservices, and database connections.', 'Cpu', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=600', ARRAY['Node.js', 'Express', 'Python', 'SQL', 'MongoDB', 'API Design'], true),
('Mobile App Development', 'mobile-app-development', 'Design, build, and publish native or cross-platform iOS and Android mobile software.', 'Smartphone', 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=600', ARRAY['React Native', 'Flutter', 'iOS Development', 'Android Development', 'Firebase'], true),
('Data Science', 'data-science', 'Analyze complex datasets, generate predictive models, and visualize statistical insights.', 'LineChart', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600', ARRAY['Python', 'Pandas', 'NumPy', 'Matplotlib', 'SQL', 'Statistics', 'Machine Learning'], true),
('Artificial Intelligence', 'artificial-intelligence', 'Implement advanced algorithms including Neural Networks, NLP, and Computer Vision solutions.', 'Sparkles', 'https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=600', ARRAY['Python', 'TensorFlow', 'PyTorch', 'NLP', 'Deep Learning', 'Computer Vision'], true),
('Machine Learning', 'machine-learning', 'Train algorithms to automatically analyze patterns and construct forecasting engines.', 'Brain', 'https://images.unsplash.com/photo-1527474305487-b87b222841cc?q=80&w=600', ARRAY['Python', 'Scikit-Learn', 'TensorFlow', 'Keras', 'Predictive Modeling'], true),
('Cyber Security', 'cyber-security', 'Protect critical server networks, analyze system vulnerabilities, and implement cryptography rules.', 'Shield', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600', ARRAY['Networking', 'Linux', 'Ethical Hacking', 'Security', 'OWASP', 'Penetration Testing'], true),
('Cloud Computing', 'cloud-computing', 'Deploy systems to highly resilient virtual architectures on dominant provider infrastructures.', 'Cloud', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=600', ARRAY['AWS', 'Azure', 'GCP', 'Docker', 'Cloud Architecture'], true),
('DevOps', 'devops', 'Integrate development pipelines and automation routines via CI/CD pipelines and orchestrators.', 'Settings', 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?q=80&w=600', ARRAY['Git', 'Docker', 'CI/CD', 'Kubernetes', 'Linux', 'Ansible', 'Terraform'], true),
('UI/UX Design', 'ui-ux-design', 'Conduct user research, design wireframes, and craft clickable interaction prototypes.', 'Palette', 'https://images.unsplash.com/photo-1561070791-26c113006238?q=80&w=600', ARRAY['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems'], true),
('Internet of Things (IoT)', 'iot', 'Write programs for microcontrollers and integrate physical sensors with cloud triggers.', 'Workflow', 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600', ARRAY['Arduino', 'Raspberry Pi', 'Embedded C', 'Sensors', 'MQTT'], true),
('Blockchain', 'blockchain', 'Author ledger smart contracts and architect decentralized software products (dApps).', 'Database', 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=600', ARRAY['Solidity', 'Ethereum', 'Smart Contracts', 'Cryptography', 'Web3'], true),
('Software Testing', 'software-testing', 'Automate execution runs, draft detailed test plans, and assure production grade releases.', 'CheckSquare', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600', ARRAY['Manual Testing', 'Selenium', 'Jest', 'Automation', 'QA Engineering'], true),
('Java Development', 'java-development', 'Construct robust enterprise platforms using Java structures and Spring context abstractions.', 'Coffee', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600', ARRAY['Java', 'Spring Boot', 'Hibernate', 'Maven', 'OOP', 'SQL'], true),
('Python Development', 'python-development', 'Build flexible automation routines, scrape websites, and deploy clean modern APIs.', 'Glasses', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=600', ARRAY['Python', 'Django', 'Flask', 'OOP', 'Scraping', 'Data Analysis'], true),
('C/C++ Development', 'c-cpp-development', 'Develop low-level device components, game engines, and performance critical binaries.', 'Terminal', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=600', ARRAY['C', 'C++', 'Data Structures', 'Algorithms', 'Memory Management'], true),
('Database Management', 'database-management', 'Tune index latency, normalize table parameters, and oversee secure store instances.', 'FileSpreadsheet', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=600', ARRAY['SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Database Tuning', 'Normalization'], true),
('Digital Marketing', 'digital-marketing', 'Engage web analytics platforms, oversee online metrics, and configure SEO assets.', 'Megaphone', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600', ARRAY['SEO', 'Content Marketing', 'Social Media', 'Google Analytics', 'SEM'], true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    image = EXCLUDED.image,
    skills = EXCLUDED.skills,
    is_active = EXCLUDED.is_active;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_domains_slug ON public.domains(slug);
CREATE INDEX IF NOT EXISTS idx_domains_is_active ON public.domains(is_active);
CREATE INDEX IF NOT EXISTS idx_internships_domain_id ON public.internships(domain_id);
CREATE INDEX IF NOT EXISTS idx_internships_is_active ON public.internships(is_active);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_internship_id ON public.enrollments(internship_id);
CREATE INDEX IF NOT EXISTS idx_internship_enrollments_user_id ON public.internship_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_user_id ON public.task_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_task_id ON public.task_progress(task_id);

-- Regrant compatibility permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
