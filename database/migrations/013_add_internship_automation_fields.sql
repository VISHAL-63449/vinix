-- Migration: Add Internship Automation Fields and Status Constraints
-- Run this in the Supabase SQL Editor to support the automatic offer letter workflow.

-- 1. Update the CHECK constraint on status column of internship_applications
ALTER TABLE public.internship_applications 
DROP CONSTRAINT IF EXISTS internship_applications_status_check;

ALTER TABLE public.internship_applications 
ADD CONSTRAINT internship_applications_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled', 'Registered', 'Offer Letter Sent', 'offer_letter_sent'));

-- 2. Add required automation columns to internship_applications
ALTER TABLE public.internship_applications
ADD COLUMN IF NOT EXISTS "applicationId" TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS "studentId" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "studentName" TEXT,
ADD COLUMN IF NOT EXISTS "studentEmail" TEXT,
ADD COLUMN IF NOT EXISTS "college" TEXT,
ADD COLUMN IF NOT EXISTS "department" TEXT,
ADD COLUMN IF NOT EXISTS "internshipDomain" TEXT,
ADD COLUMN IF NOT EXISTS "startDate" DATE,
ADD COLUMN IF NOT EXISTS "endDate" DATE,
ADD COLUMN IF NOT EXISTS "offerLetterGenerated" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "offerLetterSent" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "offerLetterSentAt" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "offerLetterFile" TEXT,
ADD COLUMN IF NOT EXISTS "emailError" TEXT;

-- 3. Add application_id link to offer_letters table
ALTER TABLE public.offer_letters 
ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.internship_applications(id) ON DELETE SET NULL;
