import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMjY1MjcsImV4cCI6MjEwMjkwMjUyN30.4f4_FG-iCChNmH0SM2BTcviKx3Soy7LzJfKYfckuyPU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const tables = [
        'profiles',
        'internships',
        'internship_enrollments',
        'internship_tasks',
        'task_progress',
        'certificates',
        'offer_letters',
        'internship_applications'
    ];

    for (const t of tables) {
        const { data, error } = await supabase.from(t).select('*').limit(1);
        if (error) {
            console.log(`Table ${t}: FAILED - ${error.message}`);
        } else {
            console.log(`Table ${t}: SUCCESS (${data.length} rows loaded)`);
        }
    }
}

check();
