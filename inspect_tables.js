import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMyNjUyNywiZXhwIjoyMTAyOTAyNTI3fQ.dC2HhQgzBrE5uF4uKqbtU9rPL_4vfyKKhujWIZgxBb0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inspectTable(tableName) {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    if (error) {
        return { error: error.message };
    }
    if (data && data.length > 0) {
        return { columns: Object.keys(data[0]) };
    }
    return { columns: [], message: 'No rows returned' };
}

async function run() {
    const results = {};
    results.internship_applications = await inspectTable('internship_applications');
    results.internship_enrollments = await inspectTable('internship_enrollments');
    results.offer_letters = await inspectTable('offer_letters');
    results.certificates = await inspectTable('certificates');
    results.task_progress = await inspectTable('task_progress');
    results.internship_tasks = await inspectTable('internship_tasks');
    fs.writeFileSync('inspect_output.json', JSON.stringify(results, null, 2));
    console.log('done');
}
run();
