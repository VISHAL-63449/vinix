-- ====================================================================
-- VINIX SYSTEMS MIGRATION & SCHEMAS SECURE INITIALIZATION
-- ====================================================================

-- 1. Create the Role custom type (if it doesn't already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    CREATE TYPE "Role" AS ENUM ('STUDENT', 'ADMIN');
  END IF;
END $$;

-- 2. Create the public "User" table (if it doesn't already exist)
CREATE TABLE IF NOT EXISTS public."User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL DEFAULT '',
  "role" "Role" NOT NULL DEFAULT 'STUDENT',
  "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON public."User"("email");

-- 3. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'founder')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backfill profiles from auth.users if any exist
INSERT INTO public.profiles (id, full_name, email, role)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'name', 'New Student'), 
  email, 
  COALESCE(raw_user_meta_data->>'role', 'student')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Enforce role restrictions for profiles table (only admin/founder can set to admin/founder)
CREATE OR REPLACE FUNCTION public.check_profile_role() 
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    -- If role is being changed to admin or founder by non-admin
    IF (NEW.role IS DISTINCT FROM OLD.role) AND (NEW.role IN ('admin', 'founder')) THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'founder')
      ) THEN
        RAISE EXCEPTION 'You are not authorized to assign admin or founder roles.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_profile_role_claims ON public.profiles;
CREATE TRIGGER enforce_profile_role_claims
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_profile_role();

-- 4. Sync triggers for new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role TEXT := 'student';
BEGIN
  -- Extract role from metadata if specified and valid
  IF (new.raw_user_meta_data->>'role' IS NOT NULL) AND (new.raw_user_meta_data->>'role' IN ('student', 'admin', 'founder')) THEN
    v_role := new.raw_user_meta_data->>'role';
  END IF;

  -- Insert into public.profiles
  INSERT INTO public.profiles (id, full_name, email, role, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'New Student'),
    new.email,
    v_role,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = now();

  -- Insert into legacy public."User" to align with prisma definitions
  INSERT INTO public."User" (id, name, email, password, role, skills, "createdAt", "updatedAt")
  VALUES (
    new.id::text,
    COALESCE(new.raw_user_meta_data->>'name', 'New Student'),
    new.email,
    '',
    CASE WHEN v_role = 'student' THEN 'STUDENT'::"Role" ELSE 'ADMIN'::"Role" END,
    ARRAY[]::TEXT[],
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updatedAt = now();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update function for touch_updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Internships table
CREATE TABLE IF NOT EXISTS public.internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  description TEXT,
  duration TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed basic internships if they do not exist
INSERT INTO public.internships (id, title, domain, description, duration, status) VALUES
  ('95d1c0e2-d14b-4c24-bda9-5b7fdb5b92d9', 'Full Stack Development', 'fullstack', 'Build web apps with React, Express, and databases.', '3 Months', 'published'),
  ('664885f8-66b7-4563-af6f-4b15054044f7', 'Frontend Development', 'frontend', 'Construct responsive web interfaces with HTML, CSS, JavaScript, React.', '3 Months', 'published'),
  ('e553b2b9-04ec-4deb-a908-178013c46dda', 'Backend Development', 'backend', 'Design scalable server-side systems, APIs and databases.', '3 Months', 'published'),
  ('fbbf3fe6-a698-4886-bc5d-9f48cc14f725', 'AI & Machine Learning', 'aiml', 'Build models and inspect intelligence applications.', '3 Months', 'published'),
  ('e785a0a0-017d-4acc-b9c8-3d52776c4fb0', 'Data Science', 'datascience', 'Process, visualize, analyze real-world datasets.', '3 Months', 'published'),
  ('5f586279-16d1-4d7e-8dba-b70bce4e2734', 'UI/UX Design', 'uiux', 'Design modern user interfaces with Figma wireframing.', '3 Months', 'published'),
  ('59760c89-c3c5-4b94-9302-2a6527f53ee7', 'Python Development', 'python', 'Develop clean Python applications, Django backend systems.', '3 Months', 'published'),
  ('86a8d353-846b-4b9d-9287-283f9e5f6577', 'Java Development', 'java', 'Build robust object-oriented systems with Java Spring Boot.', '3 Months', 'published'),
  ('6ee274d7-b3a6-475c-8c8b-127c35448963', 'Cyber Security', 'cybersecurity', 'Analyze networks, implement cryptography and conduct penetrations.', '3 Months', 'published'),
  ('fc6b7e28-3e4e-4f5a-8b6b-127c35448960', 'Digital Marketing', 'digitalmarketing', 'Optimize SEO, run campaigns, analyze marketing funnels.', '3 Months', 'published'),
  ('fc6b7e28-3e4e-4f5a-8b6b-127c35448961', 'C Programming', 'cprogramming', 'Write systems-level utilities in C.', '3 Months', 'published'),
  ('fc6b7e28-3e4e-4f5a-8b6b-127c35448962', 'C++ Programming', 'cppprogramming', 'Build algorithms on high performance C++ frameworks.', '3 Months', 'published'),
  ('ba74cea8-305b-4eeb-a3f1-b0ed1a6de32e', 'Web Development', 'webdevelopment', 'Standard web pages via HTML/CSS/JavaScript.', '3 Months', 'published'),
  ('fc6b7e28-3e4e-4f5a-8b6b-127c35448964', 'Data Analytics', 'dataanalytics', 'Clean and format data to uncover business trends.', '3 Months', 'published'),
  ('fc6b7e28-3e4e-4f5a-8b6b-127c35448965', 'Machine Learning', 'machinelearning', 'Train regression and classification intelligence pipelines.', '3 Months', 'published'),
  ('fc6b7e28-3e4e-4f5a-8b6b-127c35448966', 'Deep Learning', 'deeplearning', 'Deploy neural networks.', '3 Months', 'published'),
  ('fc6b7e28-3e4e-4f5a-8b6b-127c35448967', 'Generative AI', 'generativeai', 'LLM orchestration, prompt templates and agent frameworks.', '3 Months', 'published'),
  ('fc6b7e28-3e4e-4f5a-8b6b-127c35448968', 'Prompt Engineering', 'promptengineering', 'Advanced prompting techniques, dynamic prompt routing.', '3 Months', 'published'),
  ('fc6b7e28-3e4e-4f5a-8b6b-127c35448969', 'Cloud Computing', 'cloudcomputing', 'Deploy microservices into AWS infrastructure.', '3 Months', 'published'),
  ('fc6b7e28-3e4e-4f5a-8b6b-127c35448970', 'Ethical Hacking', 'ethicalhacking', 'Conduct mock system penetration testing and audits.', '3 Months', 'published'),
  ('fc6b7e28-3e4e-4f5a-8b6b-127c35448971', 'Android Development', 'androiddevelopment', 'Build mobile layout pages with Android Studio SDK.', '3 Months', 'published'),
  ('fc6b7e28-3e4e-4f5a-8b6b-127c35448972', 'Flutter Development', 'flutterdevelopment', 'Deploy cross platform applications.', '3 Months', 'published'),
  ('fc6b7e28-3e4e-4f5a-8b6b-127c35448973', 'React Native', 'reactnative', 'Build JSX cross platform applications.', '3 Months', 'published'),
  ('fc6b7e28-3e4e-4f5a-8b6b-127c35448974', 'Graphic Design', 'graphicdesign', 'Assemble branding assets and layouts.', '3 Months', 'published'),
  ('fc6b7e28-3e4e-4f5a-8b6b-127c35448975', 'Motion Graphics', 'motiongraphics', 'Animate assets and typography.', '3 Months', 'published'),
  ('fc6b7e28-3e4e-4f5a-8b6b-127c35448976', 'Video Editing', 'videoediting', 'Color correcting, clip trimming and audio layering.', '3 Months', 'published'),
  ('fc6b7e28-3e4e-4f5a-8b6b-127c35448977', 'Animation', 'animation', 'Create 2D vector animations.', '3 Months', 'published'),
  ('fc6b7e28-3e4e-4f5a-8b6b-127c35448978', '3D Design', 'threeddesign', 'Assemble 3D meshes and rendering.', '3 Months', 'published'),
  ('f2984958-b57c-445a-bb7f-bc838ebadd1f', 'MERN Stack Development (Old)', 'mernstack_old', 'Duplicate MERN Stack stream.', '3 Months', 'published'),
  ('14a448de-6a84-4f20-b762-7f39cc7d4d51', 'MEAN Stack Development (Old)', 'meanstack_old', 'Duplicate MEAN Stack stream.', '3 Months', 'published')
ON CONFLICT (domain) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- Trigger to touch updated_at
DROP TRIGGER IF EXISTS update_internships_updated_at ON public.internships;
CREATE TRIGGER update_internships_updated_at 
  BEFORE UPDATE ON public.internships
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 6. Internship Enrollments table
CREATE TABLE IF NOT EXISTS public.internship_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled')),
  application_status TEXT DEFAULT 'applied',
  offer_letter_url TEXT,
  certificate_url TEXT,
  linkedin_url TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_internship_enrollment UNIQUE (user_id, internship_id)
);

DROP TRIGGER IF EXISTS update_internship_enrollments_updated_at ON public.internship_enrollments;
CREATE TRIGGER update_internship_enrollments_updated_at 
  BEFORE UPDATE ON public.internship_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Backfill internship_enrollments from internship_applications
INSERT INTO public.internship_enrollments (user_id, internship_id, status, application_status, joined_at)
SELECT 
  app.user_id, 
  i.id,
  CASE WHEN app.status = 'active' THEN 'active' ELSE 'pending' END,
  app.status,
  COALESCE(app.applied_at, now())
FROM public.internship_applications app
JOIN public.internships i ON i.domain = app.domain OR i.domain = app.internship_id
ON CONFLICT (user_id, internship_id) DO NOTHING;

-- 7. Internship Tasks table
CREATE TABLE IF NOT EXISTS public.internship_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  task_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_scope TEXT,
  due_date TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_internship_task UNIQUE (internship_id, task_number)
);

DROP TRIGGER IF EXISTS update_internship_tasks_updated_at ON public.internship_tasks;
CREATE TRIGGER update_internship_tasks_updated_at 
  BEFORE UPDATE ON public.internship_tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed tasks (1 to 12) for EVERY created internship
DO $$
DECLARE
  r_internship RECORD;
  t_idx INT;
  t_title TEXT;
  t_desc TEXT;
BEGIN
  FOR r_internship IN SELECT id, domain FROM public.internships LOOP
    FOR t_idx IN 1..12 LOOP
      IF t_idx = 1 THEN
        t_title := 'LinkedIn Offer Post Requirement';
        t_desc := 'Share your internship offer letter on your LinkedIn profile, tag Vinix Technologies, and submit the link below to unlock the learning workspace.';
      ELSIF t_idx = 2 THEN
        t_title := 'Milestone 1 — Repository Initialization';
        t_desc := 'Initialize the project repository on GitHub, configure standard project structures, design schemas, and set up your development environment.';
      ELSIF t_idx = 3 THEN
        t_title := 'Milestone 2 — Core Operations Architecture';
        t_desc := 'Implement the primary schemas, endpoints, business logic models, and UI component views representing current state operations.';
      ELSIF t_idx = 4 THEN
        t_title := 'Milestone 3 — Interactive UI Integration';
        t_desc := 'Integrate state containers, responsive layout frameworks, input forms, and dynamic action states across core views.';
      ELSIF t_idx = 5 THEN
        t_title := 'Milestone 4 — Security & Validation';
        t_desc := 'Secure all APIs, configure proper credentials/authentication flows, and enforce input validation rules.';
      ELSE
        t_title := 'Milestone ' || (t_idx - 1) || ' — Advanced Integration';
        t_desc := 'Optimize resources, implement advanced features, CI/CD integrations, or final review adjustments.';
      END IF;

      INSERT INTO public.internship_tasks (internship_id, task_number, title, description)
      VALUES (r_internship.id, t_idx, t_title, t_desc)
      ON CONFLICT (internship_id, task_number) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;

-- 8. Task Progress table
CREATE TABLE IF NOT EXISTS public.task_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.internship_tasks(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'submitted', 'approved', 'rejected')),
  submission_url TEXT,
  github_url TEXT,
  deployment_url TEXT,
  linkedin_url TEXT,
  student_note TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  admin_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_task UNIQUE (user_id, task_id)
);

DROP TRIGGER IF EXISTS update_task_progress_updated_at ON public.task_progress;
CREATE TRIGGER update_task_progress_updated_at 
  BEFORE UPDATE ON public.task_progress
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Enforce security roles on task progress updates
CREATE OR REPLACE FUNCTION public.check_task_progress_update()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')) THEN
      -- If student is updating, prevent changing status to approved
      IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
        RAISE EXCEPTION 'Only mentors/admins can approve tasks.';
      END IF;
      -- Prevent student from altering admin feedback
      IF NEW.admin_feedback IS DISTINCT FROM OLD.admin_feedback OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
        RAISE EXCEPTION 'Only mentors/admins can update review feedback.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_task_progress_roles ON public.task_progress;
CREATE TRIGGER enforce_task_progress_roles
  BEFORE UPDATE ON public.task_progress
  FOR EACH ROW EXECUTE FUNCTION public.check_task_progress_update();

-- 9. Admin Audit Logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  target_task_id UUID REFERENCES public.internship_tasks(id),
  target_enrollment_id UUID REFERENCES public.internship_enrollments(id),
  old_status TEXT,
  new_status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Certificates table
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES public.internship_enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  course_name TEXT NOT NULL,
  issue_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'VALID',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Offer Letters table
CREATE TABLE IF NOT EXISTS public.offer_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES public.internship_enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_letter_id TEXT NOT NULL UNIQUE,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  internship_title TEXT NOT NULL,
  duration TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'GENERATED' CHECK (status IN ('GENERATED', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
  issue_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  verification_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Enable Row Level Security (RLS) policies on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_letters ENABLE ROW LEVEL SECURITY;

-- 13. Drop/recreate RLS policies
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own details" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own details" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (
      (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
      OR
      (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')))
    )
  );

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')));

-- internships
DROP POLICY IF EXISTS "Anyone can view published internships" ON public.internships;
DROP POLICY IF EXISTS "Admins can manage internships" ON public.internships;

CREATE POLICY "Anyone can view published internships" ON public.internships
  FOR SELECT TO authenticated, anon
  USING (status = 'published' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')));

CREATE POLICY "Admins can manage internships" ON public.internships
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')));

-- enrollments
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.internship_enrollments;
DROP POLICY IF EXISTS "Users can insert own enrollments" ON public.internship_enrollments;
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.internship_enrollments;

CREATE POLICY "Users can view own enrollments" ON public.internship_enrollments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')));

CREATE POLICY "Users can insert own enrollments" ON public.internship_enrollments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage enrollments" ON public.internship_enrollments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')));

-- tasks
DROP POLICY IF EXISTS "Anyone can view published tasks" ON public.internship_tasks;
DROP POLICY IF EXISTS "Admins can manage tasks" ON public.internship_tasks;

CREATE POLICY "Anyone can view published tasks" ON public.internship_tasks
  FOR SELECT TO authenticated
  USING (is_published = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')));

CREATE POLICY "Admins can manage tasks" ON public.internship_tasks
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')));

-- progress
DROP POLICY IF EXISTS "Users can view own task progress" ON public.task_progress;
DROP POLICY IF EXISTS "Users can insert own task progress" ON public.task_progress;
DROP POLICY IF EXISTS "Users can update own task progress details" ON public.task_progress;
DROP POLICY IF EXISTS "Admins can manage task progress" ON public.task_progress;

CREATE POLICY "Users can view own task progress" ON public.task_progress
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')));

CREATE POLICY "Users can insert own task progress" ON public.task_progress
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task progress details" ON public.task_progress
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')));

-- audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;

CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')));

CREATE POLICY "Admins can insert audit logs" ON public.admin_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')));

-- certificates
DROP POLICY IF EXISTS "Anyone can view valid certificates" ON public.certificates;
DROP POLICY IF EXISTS "Admins can manage certificates" ON public.certificates;

CREATE POLICY "Anyone can view valid certificates" ON public.certificates
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can manage certificates" ON public.certificates
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')));

-- offer letters
DROP POLICY IF EXISTS "Users can view own offer letters" ON public.offer_letters;
DROP POLICY IF EXISTS "Admins can view all offer letters" ON public.offer_letters;
DROP POLICY IF EXISTS "Admins can manage offer letters" ON public.offer_letters;

CREATE POLICY "Users can view own offer letters" ON public.offer_letters
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all offer letters" ON public.offer_letters
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')));

CREATE POLICY "Admins can manage offer letters" ON public.offer_letters
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')));

-- 14. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internships TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internship_enrollments TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internship_tasks TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_progress TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_audit_logs TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_letters TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 15. Enable Realtime Publications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'task_progress'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.task_progress;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'internship_enrollments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.internship_enrollments;
  END IF;
EXCEPTION WHEN OTHERS THEN 
  -- Handle gracefully if publication doesn't exist yet
  NULL;
END $$;

-- ====================================================================
-- 16. INTERNSHIP APPLICATIONS TABLE & RLS POLICIES
-- (Merged from auth_policies.sql - run this to fix "Apply shown after applying" bug)
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.internship_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    internship_id TEXT,
    status TEXT DEFAULT 'active',
    applied_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    student_name TEXT,
    email TEXT,
    phone TEXT,
    college TEXT,
    domain TEXT,
    internship_name TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    certificate_status TEXT DEFAULT 'pending',
    offer_letter_status TEXT DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    mentor_id UUID,
    CONSTRAINT unique_user_internship_app UNIQUE (user_id, internship_id)
);

ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own applications" ON public.internship_applications;
DROP POLICY IF EXISTS "Users can insert own applications" ON public.internship_applications;
DROP POLICY IF EXISTS "Users can update own applications" ON public.internship_applications;
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.internship_applications;

-- Users can view their OWN applications
CREATE POLICY "Users can view own applications" ON public.internship_applications
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR email = auth.email());

-- Users can insert their own applications
CREATE POLICY "Users can insert own applications" ON public.internship_applications
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own applications
CREATE POLICY "Users can update own applications" ON public.internship_applications
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "Admins can manage all applications" ON public.internship_applications
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'founder')));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.internship_applications TO authenticated, anon;
GRANT ALL ON public.internship_applications TO service_role;

-- Backfill user_id from auth.users by matching email (fixes legacy records with no user_id)
UPDATE public.internship_applications ia
SET user_id = au.id
FROM auth.users au
WHERE ia.email = au.email AND ia.user_id IS NULL;
