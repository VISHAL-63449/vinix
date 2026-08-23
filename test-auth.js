import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMjY1MjcsImV4cCI6MjEwMjkwMjUyN30.4f4_FG-iCChNmH0SM2BTcviKx3Soy7LzJfKYfckuyPU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignup() {
    const email = `test_student_${Date.now()}@vinix.com`;
    const password = 'Password123!';

    console.log('Signing up user:', email);
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: 'Test Student',
                role: 'student'
            }
        }
    });

    if (error) {
        console.error('SIGNUP ERROR:', JSON.stringify(error, null, 2));
    } else {
        console.log('SIGNUP SUCCESS:', data.user?.id);

        // Check if profile was created
        const { data: profile, error: profErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id);

        if (profErr) {
            console.error('PROFILE LOAD ERROR:', JSON.stringify(profErr, null, 2));
        } else {
            console.log('PROFILE LOAD SUCCESS:', profile);
        }
    }
}

testSignup();
