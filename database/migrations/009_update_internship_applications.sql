-- Migration: Update internship_applications table schema with missing columns
ALTER TABLE public.internship_applications 
ADD COLUMN IF NOT EXISTS year_of_study TEXT,
ADD COLUMN IF NOT EXISTS course_branch TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS pin_code TEXT,
ADD COLUMN IF NOT EXISTS domain TEXT,
ADD COLUMN IF NOT EXISTS duration TEXT,
ADD COLUMN IF NOT EXISTS promo_code TEXT;
