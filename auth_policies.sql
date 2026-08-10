-- ====================================================================
-- SUPABASE AUTHENTICATION, REGISTRATION & USER TABLE CONFIGURATION
-- ====================================================================

-- 1. Create the Role custom type (if it doesn't already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    CREATE TYPE "Role" AS ENUM ('STUDENT', 'ADMIN');
  END IF;
END $$;

-- 2. Create the public "User" table (if it doesn't already exist)
-- This matches your Prisma schema and maps to Supabase User profiles
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

-- Ensure a unique index/constraint exists on email
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON public."User"("email");

-- 3. Helper function: check if an authenticated user belongs to a specific role
-- This is used to block/allow specific actions in subsequent policies.
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, check_role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public."User" 
    WHERE id = user_id::text 
      AND role::text = UPPER(check_role)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security (RLS) on public."User" table
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to avoid migration errors
DROP POLICY IF EXISTS "Admins can manage all users" ON public."User";
DROP POLICY IF EXISTS "Users can view own profile" ON public."User";
DROP POLICY IF EXISTS "Enable insert for registration" ON public."User";
DROP POLICY IF EXISTS "Users can update own details" ON public."User";

-- Policy: Admins have full access to manage all users
CREATE POLICY "Admins can manage all users" ON public."User"
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

-- Policy: Users can view their own profile/user record (required for loading session info after login)
CREATE POLICY "Users can view own profile" ON public."User"
  FOR SELECT TO authenticated
  USING (auth.uid()::text = id);

-- Policy: Allow insertion of user records during registration (either from trigger or API)
CREATE POLICY "Enable insert for registration" ON public."User"
  FOR INSERT TO authenticated, anon
  WITH CHECK (auth.uid()::text = id);

-- Policy: Users can update their own details (e.g. name, skills) but CANNOT change their own role to ADMIN
CREATE POLICY "Users can update own details" ON public."User"
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = id)
  WITH CHECK (
    auth.uid()::text = id 
    AND (
      role = 'STUDENT'
      OR public.has_role(auth.uid(), 'ADMIN')
    )
  );

-- 4. Registration Sync Trigger: Automatically create public."User" records when signing up via Supabase Auth
-- This ensures that when a user signs up on Supabase, they automatically get a row in your public."User" table.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."User" (id, name, email, password, role, skills, "createdAt", "updatedAt")
  VALUES (
    new.id::text,
    COALESCE(new.raw_user_meta_data->>'name', 'New Student'),
    new.email,
    '', -- Password hashing is handled securely under the hood by Supabase Auth (auth.users)
    'STUDENT',
    ARRAY[]::TEXT[],
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the registration sync trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ====================================================================
-- INTERNSHIP APPLICATIONS TABLE & RLS POLICIES
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.internship_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    internship_id TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    applied_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    student_name TEXT NOT NULL,
    email TEXT NOT NULL,
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
    
    CONSTRAINT unique_user_internship UNIQUE (user_id, internship_id)
);

-- Enable RLS
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own applications" ON public.internship_applications;
DROP POLICY IF EXISTS "Users can insert own applications" ON public.internship_applications;
DROP POLICY IF EXISTS "Users can update own applications" ON public.internship_applications;
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.internship_applications;

-- Policy 1: Users can view their own applications
CREATE POLICY "Users can view own applications" ON public.internship_applications
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own applications
CREATE POLICY "Users can insert own applications" ON public.internship_applications
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own applications
CREATE POLICY "Users can update own applications" ON public.internship_applications
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 4: Admins can do everything
CREATE POLICY "Admins can manage all applications" ON public.internship_applications
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'ADMIN'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.internship_applications TO authenticated, anon;
GRANT ALL ON public.internship_applications TO service_role;

