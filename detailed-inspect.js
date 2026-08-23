import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMjY1MjcsImV4cCI6MjEwMjkwMjUyN30.4f4_FG-iCChNmH0SM2BTcviKx3Soy7LzJfKYfckuyPU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectTable(tableName) {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    if (error) {
        console.log(`Table '${tableName}': FAILED - ${error.code} - ${error.message}`);
    } else {
        console.log(`Table '${tableName}': SUCCESS - ${data.length} rows loaded`);
    }
}

async function run() {
    const tables = [
        'User',
        'profiles',
        'student_profiles',
        'departments',
        'courses',
        'academic_years',
        'semesters',
        'subjects',
        'internships',
        'internship_eligibility',
        'internship_modules',
        'lessons',
        'lesson_progress',
        'applications',
        'enrollments',
        'internship_enrollments',
        'tasks',
        'task_submissions',
        'projects',
        'project_submissions',
        'evaluations',
        'offer_letters',
        'internship_id_cards',
        'certificates',
        'notifications',
        'portfolio_profiles',
        'portfolio_projects',
        'audit_logs',
        'internship_applications'
    ];

    console.log('Inspecting tables on target Supabase URL...');
    for (const t of tables) {
        await inspectTable(t);
    }
    console.log('Inspection complete.');
}

run();
