import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMyNjUyNywiZXhwIjoyMTAyOTAyNTI3fQ.dC2HhQgzBrE5uF4uKqbtU9rPL_4vfyKKhujWIZgxBb0';

const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

async function seedVishal() {
    console.log('🌱 Starting database seeding for student Vishal R (SKX-2026-1757)...');

    const email = 'student@vinix.com';
    const password = 'student123';
    const fullName = 'Vishal R';
    const offerLetterId = 'SKX-2026-1757';
    const certNumber = 'VINIX-CERT-2026-1757';
    const enrolledDate = '2026-07-21T00:00:00.000Z'; // 21 Jul 2026
    const issueDate = new Date().toISOString();

    // 1. Get or Create Domain
    console.log('\nChecking "Full Stack Development" domain...');
    let { data: domain } = await client
        .from('domains')
        .select('*')
        .eq('slug', 'full-stack-development')
        .maybeSingle();

    if (!domain) {
        console.log('Creating "Full Stack Development" domain...');
        const { data: newDomain, error: dErr } = await client
            .from('domains')
            .insert({
                name: 'Full Stack Development',
                slug: 'full-stack-development',
                description: 'Master both client-side and server-side engineering to build entire applications from scratch.',
                icon: 'Layers',
                skills: ['React', 'Node.js', 'Express', 'MongoDB', 'SQL', 'Tailwind CSS'],
                is_active: true
            })
            .select()
            .single();
        if (dErr) {
            console.error('Failed to create domain:', dErr);
            return;
        }
        domain = newDomain;
    }
    console.log('✅ Domain ID:', domain.id);

    // 2. Get or Create Internship
    console.log('\nChecking "Full Stack Development" internship...');
    let { data: internship } = await client
        .from('internships')
        .select('*')
        .eq('category', 'Full Stack Development')
        .eq('duration', '3 Months')
        .maybeSingle();

    if (!internship) {
        console.log('Creating "Full Stack Development" 3-Month internship...');
        const { data: newInternship, error: iErr } = await client
            .from('internships')
            .insert({
                title: 'Full Stack Development',
                category: 'Full Stack Development',
                duration: '3 Months',
                mode: 'Remote',
                difficulty: 'Intermediate',
                description: 'Full Stack Development Virtual Internship',
                skills: ['React', 'Node.js', 'Express', 'MongoDB', 'SQL', 'Tailwind CSS'],
                seats: 50,
                status: 'active',
                domain_id: domain.id,
                slug: 'full-stack-development-3m'
            })
            .select()
            .single();
        if (iErr) {
            console.error('Failed to create internship:', iErr);
            return;
        }
        internship = newInternship;
    }
    console.log('✅ Internship ID:', internship.id);

    // 3. Get or Create 11 Tasks
    console.log('\nChecking internship tasks...');
    let { data: tasks } = await client
        .from('internship_tasks')
        .select('*')
        .eq('internship_id', internship.id);

    if (!tasks || tasks.length < 11) {
        console.log('Deleting existing tasks and seeding 11 fresh tasks...');
        if (tasks && tasks.length > 0) {
            await client.from('internship_tasks').delete().eq('internship_id', internship.id);
        }

        const taskTitles = [
            'LinkedIn Offer Post Requirement',
            'Advanced Frontend UI / UX Redesign',
            'REST API Implementation & Integration',
            'Database Schema & Migrations Configuration',
            'Middleware, JWT & Authentication flow',
            'State Management & Performance Optimization',
            'Automated Unit Testing & Mocking',
            'Docker Containerization setup',
            'CI/CD GitHub Actions devops pipeline',
            'Performance Tuning & Caching layers',
            'Production Release & Final Review'
        ];

        const taskInserts = taskTitles.map((title, index) => ({
            internship_id: internship.id,
            title,
            description: `Complete technical tasks and requirements for Milestone ${index + 1}: ${title}.`,
            task_number: index + 1,
            deadline: '7 Days',
            points: 100
        }));

        const { data: newTasks, error: tErr } = await client
            .from('internship_tasks')
            .insert(taskInserts)
            .select();
        if (tErr) {
            console.error('Failed to create internship tasks:', tErr);
            return;
        }
        tasks = newTasks;
    }
    console.log('✅ Seeding complete for', tasks.length, 'tasks.');

    // 4. Authenticate or Sign Up Student "Vishal R"
    console.log('\nChecking student user auth record...');
    const { data: getUsers, error: listUserErr } = await client.auth.admin.listUsers();
    if (listUserErr) {
        console.error('Failed to list users:', listUserErr);
        return;
    }

    let user = getUsers.users.find(u => u.email === email);
    let userId;

    if (!user) {
        console.log('Creating new user for vishal@vinix.com...');
        const { data: newUser, error: createErr } = await client.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                name: fullName,
                role: 'student'
            }
        });
        if (createErr) {
            console.error('Failed to create user:', createErr);
            return;
        }
        userId = newUser.user.id;
    } else {
        userId = user.id;
    }
    console.log('✅ Student User ID:', userId);

    // 5. Update user Profile
    console.log('\nUpdating student profile details...');
    const { error: pErr } = await client
        .from('profiles')
        .upsert({
            id: userId,
            email,
            full_name: fullName,
            name: fullName,
            role: 'student',
            college: 'VINIX Technologies'
        });
    if (pErr) {
        console.error('Failed to update profiles:', pErr);
        return;
    }
    console.log('✅ Profile updated successfully.');

    // 6. Create active Enrollment
    console.log('\nCreating active enrollments...');
    await client.from('enrollments').delete().eq('student_id', userId).eq('internship_id', internship.id);
    await client.from('internship_enrollments').delete().eq('user_id', userId).eq('internship_id', internship.id);

    const { error: eErr1, data: enrollData } = await client
        .from('enrollments')
        .insert({
            student_id: userId,
            user_id: userId,
            internship_id: internship.id,
            status: 'active',
            progress: 100,
            enrolled_at: enrolledDate
        })
        .select()
        .single();
    if (eErr1) console.error('Enrollments table error:', eErr1);

    const { error: eErr2, data: internEnrollData } = await client
        .from('internship_enrollments')
        .insert({
            student_id: userId,
            user_id: userId,
            internship_id: internship.id,
            status: 'active',
            application_status: 'approved',
            progress: 100,
            enrolled_at: enrolledDate
        })
        .select()
        .single();
    if (eErr2) console.error('Internship enrollments table error:', eErr2);
    console.log('✅ Enrollments inserted successfully.');

    // 7. Seed 11 Approved Task Progresses
    console.log('\nSeeding 11 approved tasks performance stats...');
    await client.from('task_progress').delete().eq('user_id', userId);

    const progressInserts = tasks.sort((a, b) => a.task_number - b.task_number).map(t => ({
        user_id: userId,
        student_id: userId,
        internship_id: internship.id,
        task_id: t.id,
        status: 'approved',
        github_url: 'https://github.com/vishal6385/vinix-project',
        linkedin_url: t.task_number === 1 ? 'https://linkedin.com/posts/vishal-r-vinix-selection-announcement' : null,
        student_note: `Solution document and functional modules for Milestone ${t.task_number} completed. Built logic structures in compliance with core requirements.`,
        admin_feedback: `Excellent implementation! Code quality is stellar, documentation aligns perfectly with criteria. Approved.`,
        submitted_at: enrolledDate,
        reviewed_at: enrolledDate
    }));

    const { error: tpErr } = await client
        .from('task_progress')
        .insert(progressInserts);
    if (tpErr) {
        console.error('Failed to seed task progress:', tpErr);
        return;
    }
    console.log('✅ 11 Approved task progress rows successfully seeded.');

    // 8. Generate Offer Letter
    console.log('\nCreating verified Offer Letter...');
    await client.from('offer_letters').delete().or(`student_id.eq.${userId},offer_letter_id.eq.${offerLetterId}`);

    const { error: olErr } = await client
        .from('offer_letters')
        .insert({
            student_id: userId,
            user_id: userId,
            offer_letter_id: offerLetterId,
            student_name: fullName,
            student_email: email,
            internship_title: 'Full Stack Development',
            internship_id: internship.id,
            duration: '3 Months',
            status: 'ACCEPTED',
            verification_token: `tok_offer_${offerLetterId}`,
            issue_date: enrolledDate
        });
    if (olErr) {
        console.error('Failed on Offer Letter:', olErr);
        return;
    }
    console.log('✅ Offer Letter seeded (ID: ' + offerLetterId + ').');

    // 9. Generate Certificate
    console.log('\nGenerating verified Completion Certificate...');
    await client.from('certificates').delete().or(`student_id.eq.${userId},certificate_number.eq.${certNumber}`);

    const { error: cErr } = await client
        .from('certificates')
        .insert({
            student_id: userId,
            user_id: userId,
            internship_id: internship.id,
            enrollment_id: enrollData?.id || null,
            certificate_number: certNumber,
            certificate_id: certNumber,
            verification_code: certNumber,
            course_name: 'Full Stack Development',
            status: 'VALID',
            verification_status: 'VALID',
            issue_date: issueDate,
            issued_at: issueDate
        });
    if (cErr) {
        console.error('Failed on Certificate:', cErr);
        return;
    }
    console.log('\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY! Login with student@vinix.com / student123 to view.');
}

seedVishal();
