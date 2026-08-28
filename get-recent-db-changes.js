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

    log('Querying all profiles...');
    const { data: profiles } = await client.from('profiles').select('*');

    log('\nQuerying all enrollments...');
    const { data: enrolls } = await client.from('internship_enrollments').select('*');

    log('\nDetailing all task progress for vr271028@gmail.com profiles...');
    // We have three profiles with email = vr271028@gmail.com
    const vrProfiles = profiles.filter(p => p.email === 'vr271028@gmail.com');
    for (const p of vrProfiles) {
        log(`\nProfile: ${p.full_name} | ID: ${p.id} | Email: ${p.email}`);

        // Find auth user
        const { data: authUser } = await client.auth.admin.getUserById(p.id).catch(() => ({ data: null }));
        log(`  Auth User Email: ${authUser?.user?.email || 'NOT FOUND IN AUTH'}`);

        // Find enrollments
        const userEnrolls = enrolls.filter(e => e.user_id === p.id);
        log(`  Enrollments count: ${userEnrolls.length}`);
        for (const e of userEnrolls) {
            log(`    Enroll ID: ${e.id} | Status: ${e.status} | Progress: ${e.progress}`);
        }

        // Find task progress
        const { data: tp } = await client.from('task_progress').select('*, internship_tasks:task_id(task_number, title)').eq('user_id', p.id);
        log(`  Task Progress count: ${tp ? tp.length : 0}`);
        if (tp) {
            for (const t of tp) {
                log(`    Task Progress ID: ${t.id} | Task #${t.internship_tasks?.task_number} - ${t.internship_tasks?.title} | Status: ${t.status}`);
            }
        }
    }

    fs.writeFileSync('recent_db_changes.txt', output, 'utf8');
}

run();
