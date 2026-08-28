import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMyNjUyNywiZXhwIjoyMTAyOTAyNTI3fQ.dC2HhQgzBrE5uF4uKqbtU9rPL_4vfyKKhujWIZgxBb0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Student user ID for vr271028@gmail.com
const studentUserId = '4d564805-ebf3-4208-8059-602b75eb3ee9';

async function check() {
    console.log('Fetching enrollments for student:', studentUserId);
    const { data: enrollData, error: enrollErr } = await supabase
        .from('internship_enrollments')
        .select('*, internship:internships(title, category, description, duration)')
        .eq('user_id', studentUserId);

    console.log('Enroll Data:', enrollData);
    console.log('Enroll Err:', enrollErr);

    console.log('Fetching offer letters...');
    const { data: offerData, error: offerErr } = await supabase
        .from('offer_letters')
        .select('*')
        .eq('user_id', studentUserId);

    console.log('Offer Data:', offerData);
    console.log('Offer Err:', offerErr);

    console.log('Fetching certificates...');
    const { data: certsData, error: certErr } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', studentUserId);

    console.log('Certs Data:', certsData);
    console.log('Certs Err:', certErr);

    console.log('Fetching task progress...');
    const { data: progressData, error: progressErr } = await supabase
        .from('task_progress')
        .select('*, internship_tasks(task_number, title)')
        .eq('user_id', studentUserId);

    console.log('Progress Data Count:', progressData ? progressData.length : 0);
    if (progressData) {
        progressData.forEach(p => {
            console.log(`Task #${p.internship_tasks?.task_number || '?'} (${p.internship_tasks?.title || 'No Task'}): ${p.status}`);
        });
    }

    console.log('Fetching all internship tasks for c37a2171-7412-488b-9ab1-ccf01f0fb90e...');
    const { data: tasksData, error: tasksErr } = await supabase
        .from('internship_tasks')
        .select('*')
        .eq('internship_id', 'c37a2171-7412-488b-9ab1-ccf01f0fb90e')
        .order('task_number');

    console.log('Tasks Count:', tasksData ? tasksData.length : 0);
    if (tasksData) {
        tasksData.forEach(t => {
            console.log(`Task #${t.task_number}: ${t.title}`);
        });
    }

    fs.writeFileSync('detailed-inspect.txt', JSON.stringify({ enrollData, enrollErr, offerData, offerErr, certsData, certErr, progressData, progressErr, tasksData }, null, 2));
}

check();
