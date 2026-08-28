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
    const studentUserId = '4d564805-ebf3-4208-8059-602b75eb3ee9';
    const internshipId = 'c37a2171-7412-488b-9ab1-ccf01f0fb90e';
    const enrolledDate = '2026-08-22T11:24:51.235Z';
    const completionDate = '2026-08-23T04:32:32.605Z';

    console.log(`Checking tasks for internship: ${internshipId}`);
    const { data: tasks, error: tasksErr } = await client
        .from('internship_tasks')
        .select('*')
        .eq('internship_id', internshipId)
        .order('task_number');

    if (tasksErr) {
        console.error('Error fetching tasks:', tasksErr);
        return;
    }

    console.log(`Found ${tasks.length} tasks in DB. Preparing task progress rows...`);

    // Clean up any existing task progress for him for this internship just in case
    await client
        .from('task_progress')
        .delete()
        .eq('user_id', studentUserId)
        .eq('internship_id', internshipId);

    const progressInserts = tasks.sort((a, b) => a.task_number - b.task_number).map(t => ({
        user_id: studentUserId,
        student_id: studentUserId,
        internship_id: internshipId,
        task_id: t.id,
        status: 'approved',
        github_url: 'https://github.com/vishal6385/vinix-project',
        linkedin_url: t.task_number === 1 ? 'https://linkedin.com/posts/vishal-rajesh-vinix-selection-announcement' : null,
        student_note: `Solution document and functional modules for Milestone ${t.task_number} completed. Built logic structures in compliance with core requirements.`,
        admin_feedback: `Excellent implementation! Code quality is stellar, documentation aligns perfectly with criteria. Approved.`,
        submitted_at: enrolledDate,
        reviewed_at: completionDate
    }));

    const { data: inserted, error: insertErr } = await client
        .from('task_progress')
        .insert(progressInserts)
        .select();

    if (insertErr) {
        console.error('Error seeding task progress:', insertErr);
    } else {
        console.log(`Successfully seeded ${inserted.length} approved task progress rows for student vishal rajesh!`);
    }

    console.log('Updating offer letter duration to 3 Months...');
    const { error: offerUpdateErr } = await client
        .from('offer_letters')
        .update({ duration: '3 Months' })
        .eq('user_id', studentUserId);

    if (offerUpdateErr) {
        console.error('Error updating offer letter duration:', offerUpdateErr);
    } else {
        console.log('Successfully updated offer letter duration to 3 Months.');
    }
}

run();
