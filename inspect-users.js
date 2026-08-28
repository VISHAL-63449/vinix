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

    log('Listing Auth Users...');
    const { data: { users }, error: authErr } = await client.auth.admin.listUsers();
    if (authErr) {
        log('Auth/Network Error: ' + JSON.stringify(authErr));
        return;
    }

    log(`\n--- AUTH USERS ---`);
    for (const u of users) {
        log(`Auth ID: ${u.id} | Email: ${u.email} | Created: ${u.created_at}`);
    }

    log('\n--- PROFILES ---');
    const { data: profiles, error: pErr } = await client
        .from('profiles')
        .select('*');
    if (pErr) {
        log('Profiles Error: ' + JSON.stringify(pErr));
        return;
    }
    for (const p of profiles) {
        log(`Profile ID: ${p.id} | Name: ${p.full_name} | Email: ${p.email} | Role: ${p.role}`);
    }

    log('\n--- ENROLLMENTS ---');
    const { data: enrolls, error: eErr } = await client
        .from('internship_enrollments')
        .select('*');
    if (eErr) {
        log('Enrollments Error: ' + JSON.stringify(eErr));
        return;
    }
    for (const e of enrolls) {
        log(`Enroll ID: ${e.id} | User ID: ${e.user_id} | Status: ${e.status} | Progress: ${e.progress}`);
    }

    log('\n--- TASK PROGRESS ---');
    const { data: tp, error: tpErr } = await client
        .from('task_progress')
        .select('*');
    if (tpErr) {
        log('Task Progress Error: ' + JSON.stringify(tpErr));
        return;
    }
    for (const t of tp) {
        log(`Task Progress ID: ${t.id} | User ID: ${t.user_id} | Status: ${t.status} | Task ID: ${t.task_id}`);
    }

    fs.writeFileSync('inspect_users_utf8.txt', output, 'utf8');
}

run();
