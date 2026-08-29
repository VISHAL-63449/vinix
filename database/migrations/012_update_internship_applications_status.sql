-- Migration 012: Update internship_applications status check constraint to support 'offer_letter_sent'
-- Drop the existing constraint (handling potential different names) and recreate it.

ALTER TABLE public.internship_applications 
DROP CONSTRAINT IF EXISTS internship_applications_status_check;

ALTER TABLE public.internship_applications 
ADD CONSTRAINT internship_applications_status_check 
CHECK (status IN (
    'pending', 'approved', 'rejected', 'active', 'completed', 'cancelled', 'offer_letter_sent',
    'Pending', 'Approved', 'Offer Letter Sent'
));
