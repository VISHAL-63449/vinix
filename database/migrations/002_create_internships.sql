-- Migration: Upgrade Internships Table with Domains Relationship
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

-- Upgrade existing internships table
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS domain_id UUID REFERENCES public.domains(id) ON DELETE SET NULL;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Intermediate';
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS stipend TEXT DEFAULT 'Unpaid';
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Sync company values if company_name is null
UPDATE public.internships SET company_name = company WHERE company_name IS NULL;

-- Automatically populate slug on existing rows if null
UPDATE public.internships SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL;
