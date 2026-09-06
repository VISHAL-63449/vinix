-- Mount Zion Student Counselling / CC Book Schema
-- Integrated into VINIX Database

CREATE TABLE IF NOT EXISTS public.mz_counsellors (
    counsellor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mz_students (
    student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    register_number TEXT UNIQUE NOT NULL,
    roll_number TEXT,
    department TEXT,
    year TEXT,
    semester TEXT,
    section TEXT,
    academic_year TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mz_counselling_records (
    counselling_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.mz_students(student_id) ON DELETE CASCADE,
    counsellor_id UUID REFERENCES public.mz_counsellors(counsellor_id) ON DELETE SET NULL,
    session_number INTEGER,
    counselling_date TIMESTAMPTZ,
    counselling_type TEXT,
    academic_performance TEXT,
    attendance_status TEXT,
    student_concern TEXT,
    discussion TEXT,
    advice TEXT,
    action_plan TEXT,
    follow_up_required BOOLEAN,
    follow_up_date TIMESTAMPTZ,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mz_counsellors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mz_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mz_counselling_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mz_counsellors_select" ON public.mz_counsellors FOR SELECT USING (true);
CREATE POLICY "mz_counsellors_all" ON public.mz_counsellors FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin')));

CREATE POLICY "mz_students_select" ON public.mz_students FOR SELECT USING (true);
CREATE POLICY "mz_students_all" ON public.mz_students FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor')));

-- Strict Counselling Records Policy
CREATE POLICY "mz_counselling_records_select" ON public.mz_counselling_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor'))
  OR 
  (EXISTS (SELECT 1 FROM public.mz_students s WHERE s.student_id = mz_counselling_records.student_id AND s.user_id = auth.uid()))
);

CREATE POLICY "mz_counselling_records_insert" ON public.mz_counselling_records FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor')));
CREATE POLICY "mz_counselling_records_update" ON public.mz_counselling_records FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor')));
CREATE POLICY "mz_counselling_records_delete" ON public.mz_counselling_records FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin')));
