import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMyNjUyNywiZXhwIjoyMTAyOTAyNTI3fQ.dC2HhQgzBrE5uF4uKqbtU9rPL_4vfyKKhujWIZgxBb0';

const client = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    const { data: apps } = await client.from('internship_applications').select('*');
    const { data: enrolls } = await client.from('internship_enrollments').select('*');
    const { data: interns } = await client.from('internships').select('*');
    const { data: offers } = await client.from('offer_letters').select('*');

    fs.writeFileSync('inspect_output.json', JSON.stringify({ apps, enrolls, interns, offers }, null, 2));
    console.log('inspect done');
}
run();
