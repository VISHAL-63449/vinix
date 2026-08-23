-- Migration: Create Submissions and Task Progress Tables
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.internship_tasks(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Compatibility
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
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Compatibility
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

-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_progress ENABLE ROW LEVEL SECURITY;

-- Policies for submissions
CREATE POLICY "Students can view own submissions" ON public.submissions
    FOR SELECT TO authenticated USING (student_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "Students can insert own submissions" ON public.submissions
    FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "Admins can manage submissions" ON public.submissions
    FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policies for task_progress
CREATE POLICY "Students can view and manage own task progress" ON public.task_progress
    FOR ALL TO authenticated USING (student_id = auth.uid() OR user_id = auth.uid()) WITH CHECK (student_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "Admins can manage task progress" ON public.task_progress
    FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Sync student_id and user_id trigger
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

CREATE TRIGGER sync_subs_trigger BEFORE INSERT OR UPDATE ON public.submissions
    FOR EACH ROW EXECUTE FUNCTION public.sync_submissions_ids();

CREATE TRIGGER sync_task_prog_trigger BEFORE INSERT OR UPDATE ON public.task_progress
    FOR EACH ROW EXECUTE FUNCTION public.sync_submissions_ids();
