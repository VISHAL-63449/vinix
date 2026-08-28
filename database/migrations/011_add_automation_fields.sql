-- Migration 011: Add automation tracking fields to offer_letters and certificates

-- Add columns to offer_letters
ALTER TABLE public.offer_letters 
ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.internship_applications(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS offer_letter_path TEXT,
ADD COLUMN IF NOT EXISTS offer_letter_url TEXT,
ADD COLUMN IF NOT EXISTS offer_letter_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS offer_email_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS offer_email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS offer_email_error TEXT;

-- Add columns to certificates
ALTER TABLE public.certificates
ADD COLUMN IF NOT EXISTS certificate_path TEXT,
ADD COLUMN IF NOT EXISTS certificate_email_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS certificate_email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS certificate_email_error TEXT,
ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP WITH TIME ZONE;
