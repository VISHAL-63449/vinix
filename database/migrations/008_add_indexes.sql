-- Migration: Add Performance Indexes
CREATE INDEX IF NOT EXISTS idx_domains_slug ON public.domains(slug);
CREATE INDEX IF NOT EXISTS idx_domains_is_active ON public.domains(is_active);
CREATE INDEX IF NOT EXISTS idx_internships_domain_id ON public.internships(domain_id);
CREATE INDEX IF NOT EXISTS idx_internships_is_active ON public.internships(is_active);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_internship_id ON public.enrollments(internship_id);
CREATE INDEX IF NOT EXISTS idx_internship_enrollments_user_id ON public.internship_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_user_id ON public.task_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_task_id ON public.task_progress(task_id);
