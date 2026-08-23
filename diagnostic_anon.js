import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMjY1MjcsImV4cCI6MjEwMjkwMjUyN30.4f4_FG-iCChNmH0SM2BTcviKx3Soy7LzJfKYfckuyPU';

const client = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose() {
    const report = {};
    try {
        console.log("Signing in as vr271028@gmail.com...");
        const { data: authData, error: logErr } = await client.auth.signInWithPassword({
            email: 'vr271028@gmail.com',
            password: 'Password123!'
        });

        if (logErr) {
            report.loginError = logErr;
            fs.writeFileSync('diagnostic_anon_output.json', JSON.stringify(report, null, 2));
            return;
        }

        const user = authData.user;
        report.userId = user.id;

        // Fetch enrollments exactly like Dashboard.tsx does
        console.log("Fetching enrollments...");
        const { data: enrollData, error: enrollErr } = await client
            .from('internship_enrollments')
            .select('*, internship:internships(title, category, description, duration)')
            .eq('user_id', user.id);

        report.enrollmentsFetch = {
            data: enrollData,
            error: enrollErr
        };

        // Fetch profiles
        const { data: profileData, error: profileErr } = await client
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        report.profileFetch = {
            data: profileData,
            error: profileErr
        };

    } catch (e) {
        report.exception = e.message;
    }

    fs.writeFileSync('diagnostic_anon_output.json', JSON.stringify(report, null, 2));
    console.log("Diagnostic report written to diagnostic_anon_output.json");
}

diagnose();
