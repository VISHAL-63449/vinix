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
    console.log('Querying all internships in the database...');
    const { data: internships, error } = await client.from('internships').select('*');
    if (error) {
        console.error('Error fetching internships:', error);
        return;
    }
    let output = '';
    for (const i of internships) {
        const { count } = await client
            .from('internship_tasks')
            .select('id', { count: 'exact', head: true })
            .eq('internship_id', i.id);
        const line = `Internship ID: ${i.id} | Title: ${i.title} | Category: ${i.category} | Duration: ${i.duration} | Tasks Count: ${count}`;
        console.log(line);
        output += line + '\n';
    }
    fs.writeFileSync('internships_output_utf8.txt', output, 'utf8');
}

run();
