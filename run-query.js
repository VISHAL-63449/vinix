import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMjY1MjcsImV4cCI6MjEwMjkwMjUyN30.4f4_FG-iCChNmH0SM2BTcviKx3Soy7LzJfKYfckuyPU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
        console.error('PROFILES ERROR:', JSON.stringify(error, null, 2));
    } else {
        console.log('PROFILES SUCCESS:', data);
    }

    const { data: internships, error: intError } = await supabase.from('internships').select('*').limit(5);
    if (intError) {
        console.error('INTERNSHIPS ERROR:', JSON.stringify(intError, null, 2));
    } else {
        console.log('INTERNSHIPS SUCCESS: loaded', internships.length, 'rows');
    }

    const { data: apps, error: appError } = await supabase.from('internship_applications').select('*').limit(1);
    if (appError) {
        console.error('APPLICATIONS ERROR:', JSON.stringify(appError, null, 2));
    } else {
        console.log('APPLICATIONS SUCCESS:', apps);
    }
}

test();
