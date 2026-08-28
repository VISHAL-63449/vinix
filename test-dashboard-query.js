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

    log('Querying task_progress with direct table name join...');
    const { data: data1, error: err1 } = await client
        .from('task_progress')
        .select('*, internship_tasks:internship_tasks(task_number, title, description)')
        .eq('user_id', '4d564805-ebf3-4208-8059-602b75eb3ee9');

    log('Error 1: ' + JSON.stringify(err1));
    log('Data 1 Sample: ' + JSON.stringify(data1 ? data1[0] : null, null, 2));

    log('\nQuerying task_progress with task_id column join...');
    const { data: data2, error: err2 } = await client
        .from('task_progress')
        .select('*, internship_tasks:task_id(task_number, title, description)')
        .eq('user_id', '4d564805-ebf3-4208-8059-602b75eb3ee9');

    log('Error 2: ' + JSON.stringify(err2));
    log('Data 2 Sample: ' + JSON.stringify(data2 ? data2[0] : null, null, 2));

    fs.writeFileSync('query_results_utf8.txt', output, 'utf8');
}

run();
