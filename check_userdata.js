import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMyNjUyNywiZXhwIjoyMTAyOTAyNTI3fQ.dC2HhQgzBrE5uF4uKqbtU9rPL_4vfyKKhujWIZgxBb0';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

async function check() {
    try {
        let output = '';
        const { data: profiles, error: err1 } = await supabaseAdmin.from('profiles').select('id, email, role, full_name');
        output += `--- PROFILES --- ${JSON.stringify(err1)}\n`;
        if (profiles) profiles.forEach(p => { output += `ID: ${p.id} | Email: ${p.email} | Role: ${p.role} | Name: ${p.full_name}\n`; });

        const { data: apps, error: err2 } = await supabaseAdmin.from('internship_applications').select('id, student_id, email, internship_id, status, student_name');
        output += `\n--- APPLICATIONS --- ${JSON.stringify(err2)}\n`;
        if (apps) apps.forEach(a => { output += `ID: ${a.id} | StudentID: ${a.student_id} | Email: ${a.email} | ID_Int: ${a.internship_id} | Status: ${a.status} | Name: ${a.student_name}\n`; });

        const { data: enrolls, error: err3 } = await supabaseAdmin.from('enrollments').select('id, user_id, student_id, internship_id, status');
        output += `\n--- ENROLLMENTS --- ${JSON.stringify(err3)}\n`;
        if (enrolls) enrolls.forEach(e => { output += `ID: ${e.id} | UserID: ${e.user_id} | StudentID: ${e.student_id} | ID_Int: ${e.internship_id} | Status: ${e.status}\n`; });

        const { data: internEnrolls, error: err4 } = await supabaseAdmin.from('internship_enrollments').select('id, user_id, student_id, internship_id, status');
        output += `\n--- INTERNSHIP ENROLLMENTS --- ${JSON.stringify(err4)}\n`;
        if (internEnrolls) internEnrolls.forEach(e => { output += `ID: ${e.id} | UserID: ${e.user_id} | StudentID: ${e.student_id} | ID_Int: ${e.internship_id} | Status: ${e.status}\n`; });

        const { data: offers, error: err5 } = await supabaseAdmin.from('offer_letters').select('id, user_id, student_id, internship_id, status, student_email');
        output += `\n--- OFFER LETTERS --- ${JSON.stringify(err5)}\n`;
        if (offers) offers.forEach(o => { output += `ID: ${o.id} | UserID: ${o.user_id} | StudentID: ${o.student_id} | ID_Int: ${o.internship_id} | Status: ${o.status} | Email: ${o.student_email}\n`; });

        fs.writeFileSync('check_output_utf8.txt', output, 'utf8');
        console.log('Saved to check_output_utf8.txt');
    } catch (e) {
        console.error(e);
    }
}

check();
