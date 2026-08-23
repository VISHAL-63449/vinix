-- =============================================================================
-- VINIX PLATFORM — FIX RLS RECURSION IN PROFILES TABLE
-- Run this script in the Supabase SQL Editor to resolve the "infinite recursion" error.
-- =============================================================================

-- 1. Create a helper function to safely check if a user is an admin bypassing RLS
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the recursive policy from profiles table
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 3. Recreate the policy using the security definer function to prevent recursion
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
