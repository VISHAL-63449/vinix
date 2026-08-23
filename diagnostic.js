import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMyNjUyNywiZXhwIjoyMTAyOTAyNTI3fQ.dC2HhQgzBrE5uF4uKqbtU9rPL_4vfyKKhujWIZgxBb0';

const client = createClient(supabaseUrl, serviceRoleKey);

async function diagnose() {
    const report = {};
    try {
        const { data: { users }, error: uErr } = await client.auth.admin.listUsers();
        report.users = uErr ? { error: uErr } : users.map(u => ({ id: u.id, email: u.email, metadata: u.user_metadata }));

        const { data: profiles, error: prErr } = await client.from('profiles').select('*');
        report.profiles = prErr ? { error: prErr } : profiles;

        const { data: studentProfiles, error: spErr } = await client.from('student_profiles').select('*');
        report.studentProfiles = spErr ? { error: spErr } : studentProfiles;

        const { data: enrollments, error: enErr } = await client.from('enrollments').select('*');
        report.enrollments = enErr ? { error: enErr } : enrollments;

        const { data: intEnrollments, error: ieErr } = await client.from('internship_enrollments').select('*');
        report.intEnrollments = ieErr ? { error: ieErr } : intEnrollments;

        const { data: offers, error: olErr } = await client.from('offer_letters').select('*');
        report.offers = olErr ? { error: olErr } : offers;

        const { data: apps, error: apErr } = await client.from('internship_applications').select('*');
        report.apps = apErr ? { error: apErr } : apps;
    } catch (e) {
        report.exception = e.message;
    }

    fs.writeFileSync('diagnostic_output.json', JSON.stringify(report, null, 2));
    console.log("Diagnostic report written to diagnostic_output.json");
}

diagnose();
