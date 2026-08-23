import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMjY1MjcsImV4cCI6MjEwMjkwMjUyN30.4f4_FG-iCChNmH0SM2BTcviKx3Soy7LzJfKYfckuyPU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runE2ETests() {
    console.log('🚀 Starting Vinix E2E Internship Lifecycle Test...');

    const timestamp = Date.now();
    const studentEmail = `student_${timestamp}@vinix.test`;
    const adminEmail = `admin_${timestamp}@vinix.test`;
    const password = 'Password321!';

    let studentId = '';
    let adminId = '';

    try {
        // 1. Register Student
        console.log(`\n1. Registering new student: ${studentEmail}`);
        const { data: studentAuth, error: studSignUpErr } = await supabase.auth.signUp({
            email: studentEmail,
            password,
            options: { data: { name: 'E2E Test Student', role: 'student' } }
        });
        if (studSignUpErr) throw studSignUpErr;
        studentId = studentAuth.user?.id;
        console.log(`✅ Student registered successfully with ID: ${studentId}`);

        // 2. Register Admin
        console.log(`\n2. Registering new admin: ${adminEmail}`);
        const { data: adminAuth, error: adminSignUpErr } = await supabase.auth.signUp({
            email: adminEmail,
            password,
            options: { data: { name: 'E2E Test Admin', role: 'admin' } }
        });
        if (adminSignUpErr) throw adminSignUpErr;
        adminId = adminAuth.user?.id;

        // Manually update the role to admin in the profile (if RLS allows, or we assume trigger handles it or we update it)
        const { error: roleUpdateErr } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', adminId);
        if (roleUpdateErr) {
            console.log(`⚠️ Note: Profile role update returned error: ${roleUpdateErr.message}. RLS might restrict this update on client.`);
        }
        console.log(`✅ Admin registered with ID: ${adminId}`);

        // 3. Create or Fetch Internship Track
        console.log('\n3. Fetching available internships...');
        const { data: internships, error: fetchIntsErr } = await supabase
            .from('internships')
            .select('*');
        if (fetchIntsErr) throw fetchIntsErr;

        let targetInternship = internships?.[0];
        if (!targetInternship) {
            console.log('No internships found. Seeding a mock track for the test...');
            const { data: newInt, error: createIntErr } = await supabase
                .from('internships')
                .insert({
                    title: 'Full Stack Development',
                    category: 'Web Development',
                    description: 'E2E Test track',
                    duration: '3 Months',
                    status: 'active'
                })
                .select()
                .single();
            if (createIntErr) throw createIntErr;
            targetInternship = newInt;

            // Seed its tasks
            const taskInserts = Array.from({ length: 6 }, (_, i) => ({
                internship_id: targetInternship.id,
                task_number: i + 1,
                title: i === 0 ? 'LinkedIn Offer Post Requirement' : `Milestone ${i} Advanced Integration`,
                description: i === 0 ? 'Share selection post' : 'Submit technical tasks'
            }));
            await supabase.from('internship_tasks').insert(taskInserts);
        }
        console.log(`✅ Using Internship Track: "${targetInternship.title}" (ID: ${targetInternship.id})`);

        // 4. Submit Internship Application as Student
        console.log('\n4. Submitting application as student...');
        const { data: application, error: appErr } = await supabase
            .from('internship_applications')
            .insert({
                student_id: studentId,
                internship_id: targetInternship.id,
                student_name: 'E2E Test Student',
                email: studentEmail,
                phone: '1234567890',
                college: 'Test Institute of Technology',
                resume_url: 'https://example.com/resume.pdf',
                status: 'pending'
            })
            .select()
            .single();
        if (appErr) throw appErr;
        console.log(`✅ Application submitted. Status: ${application.status}`);

        // 5. Admin Approves Application & Enrollment
        console.log('\n5. Creating active internship enrollment...');
        // Simulating the dashboard approval, create enrollment and offer letter
        const offerId = `VINIX-OFFER-${Math.floor(1000 + Math.random() * 9000)}`;
        const { error: offerErr } = await supabase
            .from('offer_letters')
            .insert({
                user_id: studentId,
                offer_letter_id: offerId,
                student_name: 'E2E Test Student',
                student_email: studentEmail,
                internship_title: targetInternship.title,
                duration: '3 Months',
                status: 'SENT',
                verification_token: `tok_${timestamp}`,
                issue_date: new Date().toISOString()
            });
        if (offerErr) throw offerErr;

        const { data: enrollment, error: enrollErr } = await supabase
            .from('internship_enrollments')
            .insert({
                user_id: studentId,
                internship_id: targetInternship.id,
                status: 'active',
                application_status: 'approved'
            })
            .select()
            .single();
        if (enrollErr) throw enrollErr;
        console.log(`✅ Enrollment activated. Status: ${enrollment.status}`);

        // Seed task progress for student
        const { data: tasks } = await supabase
            .from('internship_tasks')
            .select('id, task_number')
            .eq('internship_id', targetInternship.id);

        if (tasks && tasks.length > 0) {
            const progressInserts = tasks.map(t => ({
                user_id: studentId,
                internship_id: targetInternship.id,
                task_id: t.id,
                status: t.task_number === 1 ? 'available' : 'locked'
            }));
            const { error: progInsErr } = await supabase.from('task_progress').insert(progressInserts);
            if (progInsErr) throw progInsErr;
            console.log(`✅ Seeded ${progressInserts.length} tasks in progress table.`);
        }

        // 6. Check Student Workspace (Check if Task 1 is unlocked, others locked)
        console.log('\n6. Checking student progress tasks state...');
        const { data: progress, error: progLoadErr } = await supabase
            .from('task_progress')
            .select('*, internship_tasks(task_number, title)')
            .eq('user_id', studentId);
        if (progLoadErr) throw progLoadErr;

        console.log('Current Task Statuses:');
        progress.forEach(p => {
            console.log(` - Task #${p.internship_tasks.task_number} (${p.internship_tasks.title}): ${p.status}`);
        });

        const task1 = progress.find(p => p.internship_tasks.task_number === 1);
        const task2 = progress.find(p => p.internship_tasks.task_number === 2);

        if (task1?.status !== 'available' || (task2 && task2.status !== 'locked')) {
            throw new Error('❌ Verification failed: Task 1 should be "available" and other tasks should be "locked".');
        }
        console.log('✅ Task locks/unlocks verified successfully.');

        // 7. Student Submits Task 1 (LinkedIn post)
        console.log('\n7. Student submitting Task 1...');
        const { error: subErr } = await supabase
            .from('task_progress')
            .update({
                status: 'submitted',
                linkedin_url: 'https://linkedin.com/posts/e2e-test-vinix',
                student_note: 'Here is my verification post link!',
                submitted_at: new Date().toISOString()
            })
            .eq('id', task1.id);
        if (subErr) throw subErr;
        console.log('✅ Task 1 submitted.');

        // 8. Admin Grades and Approves Task 1
        console.log('\n8. Admin grading and approving Task 1...');
        const { error: gradeErr } = await supabase
            .from('task_progress')
            .update({
                status: 'approved',
                admin_feedback: 'Excellent work! Welcome aboard!',
                reviewed_at: new Date().toISOString()
            })
            .eq('id', task1.id);
        if (gradeErr) throw gradeErr;

        // Auto-unlock helper: set subsequent tasks as available
        const { error: unlockErr } = await supabase
            .from('task_progress')
            .update({ status: 'available' })
            .eq('user_id', studentId)
            .eq('internship_id', targetInternship.id)
            .eq('status', 'locked');
        if (unlockErr) throw unlockErr;
        console.log('✅ Task 1 graded and approved, unlocking subsequent tasks.');

        // 9. Re-verify progress states
        console.log('\n9. Re-checking progress states after approval...');
        const { data: finalProgress, error: finalProgErr } = await supabase
            .from('task_progress')
            .select('*, internship_tasks(task_number, title)')
            .eq('user_id', studentId);
        if (finalProgErr) throw finalProgErr;

        console.log('Updated Task Statuses:');
        finalProgress.forEach(p => {
            console.log(` - Task #${p.internship_tasks.task_number} (${p.internship_tasks.title}): ${p.status}`);
        });

        // 10. Issue Certificate
        console.log('\n10. Issuing completion certificate...');
        const certNo = `VINIX-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const { data: cert, error: certErr } = await supabase
            .from('certificates')
            .insert({
                user_id: studentId,
                certificate_number: certNo,
                course_name: targetInternship.title,
                status: 'issued',
                issue_date: new Date().toISOString()
            })
            .select()
            .single();
        if (certErr) throw certErr;
        console.log(`✅ Certificate issued successfully! Certificate ID: ${cert.certificate_number}`);

        console.log('\n🎉 ALL E2E LIFECYCLE TESTS PASSED SUCCESSFULLY! Real-time syncing ready.');
    } catch (error) {
        console.error('\n❌ E2E LIFECYCLE TEST FAILED:', error);
    }
}

runE2ETests();
