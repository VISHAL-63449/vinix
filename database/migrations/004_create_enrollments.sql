-- Migration: Create Enrollments and Internship Enrollments Tables
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Compatibility
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'dropped', 'active', 'upcoming', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT now(), -- Compatibility
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_student_internship_enroll UNIQUE (student_id, internship_id)
);

CREATE TABLE IF NOT EXISTS public.internship_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Compatibility
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'dropped', 'active', 'upcoming', 'cancelled')),
    application_status VARCHAR(50) DEFAULT 'approved',
    progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT now(), -- Compatibility
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_internship_enroll UNIQUE (user_id, internship_id)
);

-- Enable RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_enrollments ENABLE ROW LEVEL SECURITY;

-- Policies for enrollments
CREATE POLICY "Students can view own enrollments" ON public.enrollments
    FOR SELECT TO authenticated USING (student_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "Admins can manage enrollments" ON public.enrollments
    FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for internship_enrollments
CREATE POLICY "Students can view own internship_enrollments" ON public.internship_enrollments
    FOR SELECT TO authenticated USING (student_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "Admins can manage internship_enrollments" ON public.internship_enrollments
    FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Sync user_id and student_id automatically on inser/update trigger
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

CREATE TRIGGER sync_enrolls_trigger BEFORE INSERT OR UPDATE ON public.enrollments
    FOR EACH ROW EXECUTE FUNCTION public.sync_enrollment_ids();

CREATE TRIGGER sync_internship_enrolls_trigger BEFORE INSERT OR UPDATE ON public.internship_enrollments
    FOR EACH ROW EXECUTE FUNCTION public.sync_enrollment_ids();
