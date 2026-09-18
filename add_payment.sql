CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id VARCHAR(100) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES auth.users(id),
    application_id UUID,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    payment_date TIMESTAMPTZ,
    transaction_id VARCHAR(100),
    payment_gateway VARCHAR(50) DEFAULT 'VINIX_PAY',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Admin can view all payments" ON public.payments
    FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Add completion_status and certificate_status to internship_enrollments
ALTER TABLE public.internship_enrollments ADD COLUMN IF NOT EXISTS completion_status VARCHAR(50) DEFAULT 'IN_PROGRESS';
ALTER TABLE public.internship_enrollments ADD COLUMN IF NOT EXISTS certificate_status VARCHAR(50) DEFAULT 'NOT_ELIGIBLE';

-- Add certificate generation info to certificates
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS application_id UUID;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS certificate_url TEXT;

