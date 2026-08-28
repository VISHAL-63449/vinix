import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMyNjUyNywiZXhwIjoyMTAyOTAyNTI3fQ.dC2HhQgzBrE5uF4uKqbtU9rPL_4vfyKKhujWIZgxBb0';

const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

async function run() {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    log('Checking for any task progress rows with populated submission data but unexpected statuses...');
    const { data: rows, error } = await client
        .from('task_progress')
        .select(`
            *,
            internship_tasks:task_id(task_number, title)
        `);

    if (error) {
        log('Error: ' + JSON.stringify(error));
        return;
    }

    let found = false;
    for (const r of rows) {
        const hasGithub = !!r.github_url;
        const hasLinkedin = !!r.linkedin_url;
        const hasNote = !!r.student_note;
        const hasSubmittedAt = !!r.submitted_at;

        if ((hasGithub || hasLinkedin || hasSubmittedAt) && r.status !== 'approved' && r.status !== 'submitted') {
            found = true;
            const { data: profile } = await client
                .from('profiles')
                .select('full_name, email')
                .eq('id', r.user_id)
                .single();

            log(`\nPotential Hidden/Incorrect status submission found:`);
            log(`  Student: ${profile?.full_name} (${profile?.email})`);
            log(`  Task Progress ID: ${r.id}`);
            log(`  Task: #${r.internship_tasks?.task_number} - ${r.internship_tasks?.title}`);
            log(`  Status: ${r.status}`);
            log(`  GitHub: ${r.github_url}`);
            log(`  LinkedIn: ${r.linkedin_url}`);
            log(`  Note: ${r.student_note}`);
            log(`  Submitted At: ${r.submitted_at}`);
            log(`--------------------------------------------------`);
        }
    }

    if (!found) {
        log('No hidden/abnormal submissions found.');
    }

    fs.writeFileSync('hidden_submissions_output.txt', output, 'utf8');
}

run();
