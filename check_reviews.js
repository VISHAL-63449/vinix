import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMyNjUyNywiZXhwIjoyMTAyOTAyNTI3fQ.dC2HhQgzBrE5uF4uKqbtU9rPL_4vfyKKhujWIZgxBb0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
    const { data: internships, error } = await supabase
        .from('internships')
        .select('id, title, category');

    if (error) {
        console.error('ERROR:', error);
        return;
    }

    fs.writeFileSync('internships_list.json', JSON.stringify(internships, null, 2), 'utf-8');
}

check();
