import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMjY1MjcsImV4cCI6MjEwMjkwMjUyN30.4f4_FG-iCChNmH0SM2BTcviKx3Soy7LzJfKYfckuyPU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    let log = "Check starting...\n";
    const tables = ['domains', 'internships', 'internship_tasks', 'internship_applications', 'internship_enrollments', 'task_progress', 'certificates', 'offer_letters'];
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            log += `❌ Table ${table}: Error ${error.code} - ${error.message}\n`;
        } else {
            log += `✅ Table ${table}: Exists! Raw Data count: ${data.length}\n`;
        }
    }
    fs.writeFileSync('test-db-utf8.log', log, 'utf-8');
}

check();
