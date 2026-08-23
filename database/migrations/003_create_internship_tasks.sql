-- Migration: Create internship_tasks Table
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

-- Enable RLS
ALTER TABLE public.internship_tasks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Students can view internship tasks" ON public.internship_tasks
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage internship tasks" ON public.internship_tasks
    FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
