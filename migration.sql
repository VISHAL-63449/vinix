-- 1. De-duplicate existing applications: keep only the newest one for each (user, internship)
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY COALESCE((SELECT u.id FROM auth.users u WHERE LOWER(u.email) = LOWER(app.email)), app.user_id),
                        app.internship_id
           ORDER BY app.applied_at DESC, app.updated_at DESC
         ) as rn
  FROM public.internship_applications app
)
DELETE FROM public.internship_applications
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 2. Update user_id in internship_applications to the correct auth.users(id) by matching email
UPDATE public.internship_applications app
SET user_id = u.id
FROM auth.users u
WHERE LOWER(app.email) = LOWER(u.email)
  AND app.user_id IS DISTINCT FROM u.id;

-- 3. Enforce unique constraint on (user_id, internship_id)
ALTER TABLE public.internship_applications
DROP CONSTRAINT IF EXISTS unique_user_internship;

ALTER TABLE public.internship_applications
ADD CONSTRAINT unique_user_internship UNIQUE (user_id, internship_id);

-- 4. Enable Row Level Security (RLS) policies
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;

-- 5. Drop and recreate policies to ensure correct permissions
DROP POLICY IF EXISTS "Users can view own applications" ON public.internship_applications;
CREATE POLICY "Users can view own applications" ON public.internship_applications
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own applications" ON public.internship_applications;
CREATE POLICY "Users can insert own applications" ON public.internship_applications
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own applications" ON public.internship_applications;
CREATE POLICY "Users can update own applications" ON public.internship_applications
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all applications" ON public.internship_applications;
CREATE POLICY "Admins can manage all applications" ON public.internship_applications
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'ADMIN'));
