-- Migration: Create and Upgrade Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Compatibility
    internship_id UUID REFERENCES public.internships(id) ON DELETE SET NULL,
    enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
    certificate_id TEXT UNIQUE,
    certificate_number TEXT UNIQUE, -- Compatibility / E2E
    verification_code TEXT UNIQUE,
    certificate_url TEXT,
    course_name TEXT,
    status TEXT DEFAULT 'VALID',
    verification_status TEXT DEFAULT 'VALID',
    issue_date TIMESTAMPTZ DEFAULT now(),
    issued_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure all compatibility columns are present on certificates table
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS certificate_number TEXT UNIQUE;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS certificate_url TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'VALID';
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS course_name TEXT;

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can select certificates for verification" ON public.certificates
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage certificates" ON public.certificates
    FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Trigger for syncing IDs
CREATE TRIGGER sync_certs_ids_trigger BEFORE INSERT OR UPDATE ON public.certificates
    FOR EACH ROW EXECUTE FUNCTION public.sync_submissions_ids();

-- Trigger for syncing certificate_id and certificate_number
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

CREATE TRIGGER sync_cert_num_trigger BEFORE INSERT OR UPDATE ON public.certificates
    FOR EACH ROW EXECUTE FUNCTION public.sync_certificate_numbers();
