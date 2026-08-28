import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMyNjUyNywiZXhwIjoyMTAyOTAyNTI3fQ.dC2HhQgzBrE5uF4uKqbtU9rPL_4vfyKKhujWIZgxBb0';

const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

async function run() {
    console.log('Querying internship task counts...');
    const { data: internships } = await client.from('internships').select('*');
    for (const i of internships) {
        const { count } = await client
            .from('internship_tasks')
            .select('id', { count: 'exact', head: true })
            .eq('internship_id', i.id);
        console.log(`Internship: ${i.title} (ID: ${i.id}) -> Tasks Count: ${count}`);
    }
}

run();
