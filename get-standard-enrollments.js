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

    log('Fetching from standard enrollments...');
    const { data: enrolls, error } = await client
        .from('enrollments')
        .select('*');

    if (error) {
        log('Error: ' + JSON.stringify(error));
        return;
    }

    log(`Total enrollments in enrollments table: ${enrolls.length}`);
    for (const e of enrolls) {
        const { data: profile } = await client
            .from('profiles')
            .select('full_name, email')
            .eq('id', e.user_id)
            .single();

        log(`\nCandidate: ${profile?.full_name || 'No Profile'} (${profile?.email || 'No email'})`);
        log(`  Enrollment ID: ${e.id}`);
        log(`  User ID: ${e.user_id}`);
        log(`  Internship ID: ${e.internship_id}`);
        log(`  Status: ${e.status}`);
        log(`  Progress: ${e.progress}%`);
    }

    fs.writeFileSync('standard_enrollments.txt', output, 'utf8');
}

run();
