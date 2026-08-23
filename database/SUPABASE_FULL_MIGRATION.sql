-- =============================================================================
-- VINIX PLATFORM — FULL DATABASE MIGRATION
-- Run this ENTIRE script in Supabase SQL Editor (Settings → SQL Editor → New Query)
-- It is idempotent: safe to re-run even if some tables already exist.
-- =============================================================================


-- =============================================================================
-- SECTION 0: PROFILES (must exist before any RLS policies that reference it)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    college TEXT,
    branch TEXT,
    year TEXT,
    phone TEXT,
    bio TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON public.profiles
            FOR SELECT TO authenticated USING (id = auth.uid());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.profiles
            FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can view all profiles') THEN
        CREATE POLICY "Admins can view all profiles" ON public.profiles
            FOR SELECT TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
    END IF;
END $$;

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;


-- =============================================================================
-- SECTION 1: DOMAINS
-- =============================================================================
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

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'domains' AND policyname = 'Anyone can select active domains'
    ) THEN
        CREATE POLICY "Anyone can select active domains" ON public.domains
            FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'domains' AND policyname = 'Admins can manage domains'
    ) THEN
        CREATE POLICY "Admins can manage domains" ON public.domains
            FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
END $$;

-- Seed 20 domains
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


-- =============================================================================
-- SECTION 2: INTERNSHIPS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.internships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    company TEXT NOT NULL DEFAULT 'VINIX',
    category TEXT NOT NULL,
    duration TEXT NOT NULL,
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

ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS domain_id UUID REFERENCES public.domains(id) ON DELETE SET NULL;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Intermediate';
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS stipend TEXT DEFAULT 'Unpaid';
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add unique constraint on slug only if it doesn't already exist
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'internships_slug_key' AND conrelid = 'public.internships'::regclass
    ) THEN
        ALTER TABLE public.internships ADD CONSTRAINT internships_slug_key UNIQUE (slug);
    END IF;
END $$;

-- Sync company / slug values for existing rows
UPDATE public.internships SET company_name = company WHERE company_name IS NULL;
UPDATE public.internships SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL;

ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internships' AND policyname = 'Anyone can view active internships') THEN
        CREATE POLICY "Anyone can view active internships" ON public.internships
            FOR SELECT USING (is_active = true OR status = 'active' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internships' AND policyname = 'Admins can manage internships') THEN
        CREATE POLICY "Admins can manage internships" ON public.internships
            FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
END $$;


-- =============================================================================
-- SECTION 3: INTERNSHIP TASKS
-- =============================================================================
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

ALTER TABLE public.internship_tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internship_tasks' AND policyname = 'Students can view internship tasks') THEN
        CREATE POLICY "Students can view internship tasks" ON public.internship_tasks
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internship_tasks' AND policyname = 'Admins can manage internship tasks') THEN
        CREATE POLICY "Admins can manage internship tasks" ON public.internship_tasks
            FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
END $$;


-- =============================================================================
-- SECTION 4: ENROLLMENTS
-- =============================================================================
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

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrollments' AND policyname = 'Students can view own enrollments') THEN
        CREATE POLICY "Students can view own enrollments" ON public.enrollments
            FOR SELECT TO authenticated USING (student_id = auth.uid() OR user_id = auth.uid());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrollments' AND policyname = 'Students can insert own enrollments') THEN
        CREATE POLICY "Students can insert own enrollments" ON public.enrollments
            FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid() OR user_id = auth.uid());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrollments' AND policyname = 'Admins can manage enrollments') THEN
        CREATE POLICY "Admins can manage enrollments" ON public.enrollments
            FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internship_enrollments' AND policyname = 'Students can view own internship_enrollments') THEN
        CREATE POLICY "Students can view own internship_enrollments" ON public.internship_enrollments
            FOR SELECT TO authenticated USING (student_id = auth.uid() OR user_id = auth.uid());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internship_enrollments' AND policyname = 'Students can insert own internship_enrollments') THEN
        CREATE POLICY "Students can insert own internship_enrollments" ON public.internship_enrollments
            FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid() OR user_id = auth.uid());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internship_enrollments' AND policyname = 'Admins can manage internship_enrollments') THEN
        CREATE POLICY "Admins can manage internship_enrollments" ON public.internship_enrollments
            FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
END $$;

-- ID sync trigger
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

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_enrolls_trigger') THEN
        CREATE TRIGGER sync_enrolls_trigger BEFORE INSERT OR UPDATE ON public.enrollments
            FOR EACH ROW EXECUTE FUNCTION public.sync_enrollment_ids();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_internship_enrolls_trigger') THEN
        CREATE TRIGGER sync_internship_enrolls_trigger BEFORE INSERT OR UPDATE ON public.internship_enrollments
            FOR EACH ROW EXECUTE FUNCTION public.sync_enrollment_ids();
    END IF;
END $$;


-- =============================================================================
-- SECTION 5: SUBMISSIONS & TASK PROGRESS
-- =============================================================================
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

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'submissions' AND policyname = 'Students can view own submissions') THEN
        CREATE POLICY "Students can view own submissions" ON public.submissions
            FOR SELECT TO authenticated USING (student_id = auth.uid() OR user_id = auth.uid());
        CREATE POLICY "Students can insert own submissions" ON public.submissions
            FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid() OR user_id = auth.uid());
        CREATE POLICY "Admins can manage submissions" ON public.submissions
            FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'task_progress' AND policyname = 'Students can view and manage own task progress') THEN
        CREATE POLICY "Students can view and manage own task progress" ON public.task_progress
            FOR ALL TO authenticated USING (student_id = auth.uid() OR user_id = auth.uid())
            WITH CHECK (student_id = auth.uid() OR user_id = auth.uid());
        CREATE POLICY "Admins can manage task progress" ON public.task_progress
            FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
END $$;

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

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_subs_trigger') THEN
        CREATE TRIGGER sync_subs_trigger BEFORE INSERT OR UPDATE ON public.submissions
            FOR EACH ROW EXECUTE FUNCTION public.sync_submissions_ids();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_task_prog_trigger') THEN
        CREATE TRIGGER sync_task_prog_trigger BEFORE INSERT OR UPDATE ON public.task_progress
            FOR EACH ROW EXECUTE FUNCTION public.sync_submissions_ids();
    END IF;
END $$;


-- =============================================================================
-- SECTION 6: REVIEWS
-- =============================================================================
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

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Anyone can view reviews') THEN
        CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
        CREATE POLICY "Authenticated users can create reviews" ON public.reviews
            FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid() OR user_id = auth.uid());
        CREATE POLICY "Admins can manage reviews" ON public.reviews
            FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_reviews_ids_trigger') THEN
        CREATE TRIGGER sync_reviews_ids_trigger BEFORE INSERT OR UPDATE ON public.reviews
            FOR EACH ROW EXECUTE FUNCTION public.sync_submissions_ids();
    END IF;
END $$;


-- =============================================================================
-- SECTION 7: CERTIFICATES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    internship_id UUID REFERENCES public.internships(id) ON DELETE SET NULL,
    enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
    certificate_id TEXT,
    certificate_number TEXT,
    verification_code TEXT,
    certificate_url TEXT,
    course_name TEXT,
    status TEXT DEFAULT 'VALID',
    verification_status TEXT DEFAULT 'VALID',
    issue_date TIMESTAMPTZ DEFAULT now(),
    issued_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Safe unique constraints (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'certificates_certificate_id_key' AND conrelid = 'public.certificates'::regclass) THEN
        ALTER TABLE public.certificates ADD CONSTRAINT certificates_certificate_id_key UNIQUE (certificate_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'certificates_certificate_number_key' AND conrelid = 'public.certificates'::regclass) THEN
        ALTER TABLE public.certificates ADD CONSTRAINT certificates_certificate_number_key UNIQUE (certificate_number);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'certificates_verification_code_key' AND conrelid = 'public.certificates'::regclass) THEN
        ALTER TABLE public.certificates ADD CONSTRAINT certificates_verification_code_key UNIQUE (verification_code);
    END IF;
END $$;

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'certificates' AND policyname = 'Anyone can select certificates for verification') THEN
        CREATE POLICY "Anyone can select certificates for verification" ON public.certificates FOR SELECT USING (true);
        CREATE POLICY "Admins can manage certificates" ON public.certificates
            FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_certs_ids_trigger') THEN
        CREATE TRIGGER sync_certs_ids_trigger BEFORE INSERT OR UPDATE ON public.certificates
            FOR EACH ROW EXECUTE FUNCTION public.sync_submissions_ids();
    END IF;
END $$;

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

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_cert_num_trigger') THEN
        CREATE TRIGGER sync_cert_num_trigger BEFORE INSERT OR UPDATE ON public.certificates
            FOR EACH ROW EXECUTE FUNCTION public.sync_certificate_numbers();
    END IF;
END $$;


-- =============================================================================
-- SECTION 8: OFFER LETTERS (if not already existing)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.offer_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    offer_letter_id TEXT UNIQUE,
    student_name TEXT,
    student_email TEXT,
    internship_title TEXT,
    internship_id UUID REFERENCES public.internships(id) ON DELETE SET NULL,
    duration TEXT,
    status TEXT DEFAULT 'SENT',
    verification_token TEXT UNIQUE,
    issue_date TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_letters ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'offer_letters' AND policyname = 'Students can view own offer letters') THEN
        CREATE POLICY "Students can view own offer letters" ON public.offer_letters
            FOR SELECT TO authenticated USING (user_id = auth.uid() OR student_id = auth.uid());
        CREATE POLICY "Students can insert own offer letters" ON public.offer_letters
            FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR student_id = auth.uid());
        CREATE POLICY "Admins can manage offer letters" ON public.offer_letters
            FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
END $$;


-- =============================================================================
-- SECTION 9: GRANTS
-- =============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domains TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domains TO anon;
GRANT SELECT ON public.domains TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internships TO authenticated;
GRANT SELECT ON public.internships TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internship_tasks TO authenticated;
GRANT SELECT ON public.internship_tasks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internship_enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT SELECT ON public.certificates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_letters TO authenticated;


-- =============================================================================
-- SECTION 10: PERFORMANCE INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_domains_slug ON public.domains(slug);
CREATE INDEX IF NOT EXISTS idx_domains_is_active ON public.domains(is_active);
CREATE INDEX IF NOT EXISTS idx_internships_domain_id ON public.internships(domain_id);
CREATE INDEX IF NOT EXISTS idx_internships_is_active ON public.internships(is_active);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_internship_id ON public.enrollments(internship_id);
CREATE INDEX IF NOT EXISTS idx_internship_enrollments_user_id ON public.internship_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_user_id ON public.task_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_task_id ON public.task_progress(task_id);
CREATE INDEX IF NOT EXISTS idx_offer_letters_user_id ON public.offer_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);

-- =============================================================================
-- SECTION 11: INTERNSHIP APPLICATIONS
-- =============================================================================
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

ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internship_applications' AND policyname = 'Students can view own applications') THEN
        CREATE POLICY "Students can view own applications" ON public.internship_applications 
            FOR SELECT TO authenticated USING (student_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internship_applications' AND policyname = 'Students can create own applications') THEN
        CREATE POLICY "Students can create own applications" ON public.internship_applications 
            FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internship_applications' AND policyname = 'Students can update own applications') THEN
        CREATE POLICY "Students can update own applications" ON public.internship_applications 
            FOR UPDATE TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internship_applications' AND policyname = 'Admins/Mentors can manage applications') THEN
        CREATE POLICY "Admins/Mentors can manage applications" ON public.internship_applications 
            FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor')));
    END IF;
END $$;


-- =============================================================================
-- SECTION 12: STUDENT PROFILES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    college TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_profiles' AND policyname = 'Students can view own student profile') THEN
        CREATE POLICY "Students can view own student profile" ON public.student_profiles 
            FOR SELECT TO authenticated USING (id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_profiles' AND policyname = 'Students can manage own student profile') THEN
        CREATE POLICY "Students can manage own student profile" ON public.student_profiles 
            FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_profiles' AND policyname = 'Admins can manage student profiles') THEN
        CREATE POLICY "Admins can manage student profiles" ON public.student_profiles 
            FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor')));
    END IF;
END $$;


-- =============================================================================
-- SECTION 13: ADDITIONAL GRANTS & INDEXES
-- =============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internship_applications TO authenticated;
GRANT SELECT, INSERT ON public.internship_applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_profiles TO authenticated;
GRANT SELECT, INSERT ON public.student_profiles TO anon;

CREATE INDEX IF NOT EXISTS idx_internship_applications_student_id ON public.internship_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_id ON public.student_profiles(id);


-- =============================================================================
-- DONE! All tables created. Refresh Supabase PostgREST cache by running:
-- SELECT pg_reload_conf();
-- =============================================================================
SELECT pg_reload_conf();
