import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMjY1MjcsImV4cCI6MjEwMjkwMjUyN30.4f4_FG-iCChNmH0SM2BTcviKx3Soy7LzJfKYfckuyPU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyMigration() {
    const tables = ['domains', 'internships', 'internship_tasks', 'internship_applications',
        'internship_enrollments', 'task_progress', 'submissions', 'certificates', 'offer_letters', 'reviews'];

    let passed = 0;
    let failed = 0;
    let log = '=== VINIX DB MIGRATION VERIFICATION ===\n\n';

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(2);
        if (error) {
            log += `❌ ${table}: FAILED — ${error.code}: ${error.message}\n`;
            failed++;
        } else {
            log += `✅ ${table}: OK (${data.length} row(s) visible)\n`;
            passed++;
        }
    }

    // Check domain seed data
    const { data: domains } = await supabase.from('domains').select('name').limit(25);
    log += `\n--- Domain Seed Check ---\n`;
    log += domains ? `✅ ${domains.length} domains seeded: ${domains.map(d => d.name).join(', ')}\n` : `❌ Could not fetch domains\n`;

    log += `\n=== RESULT: ${passed}/${tables.length} tables OK, ${failed} failed ===\n`;

    fs.writeFileSync('migration-verify.log', log, 'utf-8');
    console.log(log);
}

verifyMigration();
