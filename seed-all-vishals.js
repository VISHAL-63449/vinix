import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMyNjUyNywiZXhwIjoyMTAyOTAyNTI3fQ.dC2HhQgzBrE5uF4uKqbtU9rPL_4vfyKKhujWIZgxBb0';

const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

const vishalUserIds = [
    '4d564805-ebf3-4208-8059-602b75eb3ee9', // vr271028@gmail.com
    '6b2ce26f-ef17-4ee8-98f1-4d6fe9e1e109', // vishal9932@mountzion.ac.in
    '361d25f1-6ed9-4ff0-88da-3ee09789a639', // student@vinix.com
    '3f0c1180-17df-4b22-bcae-6384fceb5d3b'  // vishal@gmail.com
];

const internshipId = 'c37a2171-7412-488b-9ab1-ccf01f0fb90e'; // 3-Months Full Stack Development
const enrolledDate = '2026-08-22T11:24:51.235Z';
const completionDate = '2026-08-23T04:32:32.605Z';

async function seed() {
    console.log('Fetching tasks for internship...');
    const { data: tasks, error: tasksErr } = await client
        .from('internship_tasks')
        .select('*')
        .eq('internship_id', internshipId)
        .order('task_number');

    if (tasksErr) {
        console.error('Error fetching tasks:', tasksErr);
        return;
    }
    console.log(`Found ${tasks.length} tasks in the curriculum.`);

    for (const uid of vishalUserIds) {
        console.log(`\nSeeding User ID: ${uid}...`);

        // Get details of profile
        const { data: profile } = await client.from('profiles').select('*').eq('id', uid).single();
        if (!profile) {
            console.log(`User ${uid} not found in profiles Table.`);
            continue;
        }
        console.log(`Processing: ${profile.full_name} (${profile.email})`);

        // 1. Ensure internship_enrollments
        await client.from('internship_enrollments').delete().eq('user_id', uid);
        const { error: e1 } = await client.from('internship_enrollments').insert({
            user_id: uid,
            student_id: uid,
            internship_id: internshipId,
            status: 'completed',
            application_status: 'approved',
            progress: 100,
            enrolled_at: enrolledDate
        });
        if (e1) console.error('  Failed to insert internship_enrollments:', e1);
        else console.log('  ✓ internship_enrollments completed');

        // 2. Ensure enrollments
        await client.from('enrollments').delete().eq('user_id', uid);
        const { error: e2 } = await client.from('enrollments').insert({
            user_id: uid,
            internship_id: internshipId,
            status: 'completed',
            progress: 100,
            enrolled_at: enrolledDate
        });
        if (e2) console.error('  Failed to insert enrollments:', e2);
        else console.log('  ✓ enrollments completed');

        // 3. Seed task_progress as approved
        await client.from('task_progress').delete().eq('user_id', uid);
        const progressInserts = tasks.map(t => ({
            user_id: uid,
            student_id: uid,
            internship_id: internshipId,
            task_id: t.id,
            status: 'approved',
            github_url: 'https://github.com/vishal-r-vinix/milestones',
            linkedin_url: t.task_number === 1 ? 'https://linkedin.com/posts/vishal-rajesh-vinix-selection-announcement' : null,
            student_note: `Solution document and functional modules for Milestone ${t.task_number} completed. Built logic structures in compliance with core requirements.`,
            admin_feedback: `Excellent implementation! Code quality is stellar, documentation aligns perfectly with criteria. Approved.`,
            submitted_at: enrolledDate,
            reviewed_at: completionDate
        }));

        const { error: e3 } = await client.from('task_progress').insert(progressInserts);
        if (e3) console.error('  Failed to seed task progress:', e3);
        else console.log(`  ✓ Seeded ${progressInserts.length} task progress rows as approved`);

        // 4. Offer Letter
        await client.from('offer_letters').delete().eq('user_id', uid);
        const olId = `VINIX-OFFER-${Math.floor(1000 + Math.random() * 9000)}`;
        const tok = `tok_offer_${Math.floor(100000 + Math.random() * 900000)}`;
        const { error: e4 } = await client.from('offer_letters').insert({
            user_id: uid,
            student_id: uid,
            offer_letter_id: olId,
            student_name: profile.full_name,
            student_email: profile.email,
            internship_title: 'Full Stack Development',
            internship_id: internshipId,
            duration: '3 Months',
            status: 'ACCEPTED',
            verification_token: tok,
            issue_date: enrolledDate
        });
        if (e4) console.error('  Failed to insert offer letter:', e4);
        else console.log(`  ✓ Offer letter created (ID: ${olId})`);

        // 5. Certificate
        await client.from('certificates').delete().eq('user_id', uid);
        const certNumber = `VNX-${Math.floor(10000000 + Math.random() * 90000000)}`;
        const { error: e5 } = await client.from('certificates').insert({
            user_id: uid,
            student_id: uid,
            internship_id: internshipId,
            certificate_number: certNumber,
            certificate_id: certNumber,
            verification_code: certNumber,
            course_name: 'Full Stack Development',
            status: 'VALID',
            verification_status: 'VALID',
            issue_date: completionDate,
            issued_at: completionDate
        });
        if (e5) console.error('  Failed to generate certificate:', e5);
        else console.log(`  ✓ Certificate issued (No: ${certNumber})`);
    }
    console.log('\n--- Seeding Process Finished! ---');
}

seed().catch(console.error);
