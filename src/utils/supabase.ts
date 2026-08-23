import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMjY1MjcsImV4cCI6MjEwMjkwMjUyN30.4f4_FG-iCChNmH0SM2BTcviKx3Soy7LzJfKYfckuyPU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMyNjUyNywiZXhwIjoyMTAyOTAyNTI3fQ.dC2HhQgzBrE5uF4uKqbtU9rPL_4vfyKKhujWIZgxBb0';
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

export interface DomainModel {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    image?: string;
    skills: string[];
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface InternshipModel {
    id: string;
    title: string;
    company: string;
    category: string;
    department_id?: string;
    eligible_year_id?: string;
    eligible_semester_id?: string;
    duration: string;
    mode: 'Remote' | 'Hybrid' | 'In-office';
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    skills: string[];
    description: string;
    learning_outcomes: string[];
    seats: number;
    application_deadline?: string;
    status: 'draft' | 'active' | 'closed';
    domain_id?: string;
    slug?: string;
    company_name?: string;
    level?: string;
    stipend?: string;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ProfileModel {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    bio?: string;
    skills: string[];
    github?: string;
    linkedin?: string;
    portfolio?: string;
    resume_url?: string;
    role: 'student' | 'admin' | 'mentor';
    created_at?: string;
    updated_at?: string;
}

export interface StudentProfileModel {
    id: string;
    department_id?: string;
    year_id?: string;
    semester_id?: string;
    college?: string;
}

export interface DepartmentModel {
    id: string;
    name: string;
    code: string;
}

export interface AcademicYearModel {
    id: string;
    year_number: number;
    name: string;
}

export interface SemesterModel {
    id: string;
    semester_number: number;
    name: string;
}
