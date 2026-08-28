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

    log('Querying task submissions from Supabase...');
    const { data: subs, error } = await client
        .from('task_progress')
        .select(`
            *,
            internship_tasks:task_id(task_number, title)
        `);

    if (error) {
        log('Error fetching submissions: ' + JSON.stringify(error));
        return;
    }

    log(`Found total ${subs.length} task progress rows in DB.`);

    // Summary of statuses
    const statusCounts = {};
    subs.forEach(s => {
        statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
    });
    log('\n--- STATUS COUNTS ---');
    log(JSON.stringify(statusCounts, null, 2));

    log('\n--- NON-LOCKED NON-APPROVED TASKS ---');
    const filtered = subs.filter(s => s.status !== 'locked' && s.status !== 'approved');
    for (const sub of filtered) {
        const { data: profile } = await client
            .from('profiles')
            .select('full_name, email')
            .eq('id', sub.user_id)
            .single();

        log(`Student Match: ${profile?.full_name} (${profile?.email || 'No email'})`);
        log(`  Task Progress ID: ${sub.id}`);
        log(`  User ID: ${sub.user_id}`);
        log(`  Status: ${sub.status}`);
        log(`  Task: #${sub.internship_tasks?.task_number} - ${sub.internship_tasks?.title}`);
        log(`  GitHub: ${sub.github_url}`);
        log(`  LinkedIn: ${sub.linkedin_url}`);
        log(`  Submitted At: ${sub.submitted_at}`);
        log(`-----------------------------------------------`);
    }

    fs.writeFileSync('get_submitted_utf8.txt', output, 'utf8');
}

run();
