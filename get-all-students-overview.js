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

    log('Fetching all student enrollments and applications...');
    const { data: enrolls, error: enrollErr } = await client
        .from('internship_enrollments')
        .select('*');

    if (enrollErr) {
        log('Error: ' + JSON.stringify(enrollErr));
        return;
    }

    log(`Total enrollments in internship_enrollments: ${enrolls.length}`);

    for (const e of enrolls) {
        const { data: profile } = await client
            .from('profiles')
            .select('full_name, email')
            .eq('id', e.user_id)
            .single();

        const { data: tasks } = await client
            .from('task_progress')
            .select('*')
            .eq('user_id', e.user_id)
            .eq('internship_id', e.internship_id);

        const submittedCount = tasks ? tasks.filter(t => t.status === 'submitted').length : 0;
        const approvedCount = tasks ? tasks.filter(t => t.status === 'approved').length : 0;
        const totalTasks = tasks ? tasks.length : 0;

        log(`\nCandidate: ${profile?.full_name || 'No Profile'} (${profile?.email || 'No email'})`);
        log(`  Enrollment ID: ${e.id}`);
        log(`  Status: ${e.status}`);
        log(`  Progress: ${e.progress}%`);
        log(`  Tasks Stats: ${approvedCount} approved, ${submittedCount} pending grading, ${totalTasks} total tasks generated`);
    }

    fs.writeFileSync('all_students_overview.txt', output, 'utf8');
}

run();
