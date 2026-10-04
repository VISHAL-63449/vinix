import {
    supabaseAdmin,
    sendEmail,
    ensureBucketExists,
    getOrCreateInternship,
    createOfferLetterPdfDoc,
    createOfferLetterEmailHtml
} from '../_utils.js';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const {
        studentId,
        internshipId,
        studentName,
        studentEmail,
        phone,
        college,
        department,
        yearOfStudy,
        country,
        state,
        district,
        city,
        pinCode,
        internshipDomain,
        duration,
        promoCode
    } = req.body || {};

    // 1. Validate student information
    if (!studentId || !studentName || !studentEmail || !college || !internshipDomain || !duration) {
        res.status(400).json({ error: 'Missing required student registration parameters.' });
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentEmail)) {
        res.status(400).json({ error: 'Invalid Gmail/Email address provided.' });
        return;
    }

    try {
        console.log(`[APPLY_API] Processing registration for ${studentName} - Domain: ${internshipDomain}`);

        // Resolve or create internship track details server-side
        console.log(`[APPLY_API] Resolving internship track for: ${internshipDomain} (${duration})`);
        const resolvedInternship = await getOrCreateInternship(internshipDomain, duration);
        const finalInternshipId = resolvedInternship.id;
        const internshipTitle = resolvedInternship.title;
        const finalDuration = resolvedInternship.duration || duration || '1 Month';

        // 2. Duplicate Protection
        const { data: existingApp } = await supabaseAdmin
            .from('internship_applications')
            .select('*')
            .eq('student_id', studentId)
            .eq('internship_id', finalInternshipId)
            .maybeSingle();

        if (existingApp && !req.body.force) {
            let resolvedAppId = existingApp.id;
            const { data: offerData } = await supabaseAdmin
                .from('offer_letters')
                .select('offer_letter_id')
                .eq('student_id', studentId)
                .eq('internship_id', finalInternshipId)
                .maybeSingle();
            resolvedAppId = offerData?.offer_letter_id || existingApp.id;

            console.log(`[APPLY_API] Found existing application for ${studentName}. Reusing AppID: ${resolvedAppId}`);
            res.status(200).json({
                success: true,
                alreadySubscribed: true,
                applicationId: resolvedAppId,
                message: 'Application already registered.'
            });
            return;
        }

        // Generate Dates
        const startDate = new Date();
        const endDate = new Date(startDate);
        const durationNum = parseInt(finalDuration) || 1;
        if (finalDuration.toLowerCase().includes('week')) {
            endDate.setDate(endDate.getDate() + durationNum * 7);
        } else {
            endDate.setMonth(endDate.getMonth() + durationNum);
        }
        endDate.setDate(endDate.getDate() - 3); // 3-day grace adjustment

        const formatDate = (d) => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
        };

        const formattedStart = formatDate(startDate);
        const formattedEnd = formatDate(endDate);

        // 3. Generate Unique Application ID (E.g. VINIX-2026-482098)
        const randomNum = String(Math.floor(100000 + Math.random() * 900000)).padStart(6, '0');
        const appId = `VINIX-2026-${randomNum}`;

        // 4. Save application record in database using real schema columns
        const appPayload = {
            student_id: studentId,
            internship_id: finalInternshipId,
            status: 'approved',
            student_name: studentName,
            email: studentEmail,
            phone: phone || null,
            college: college,
            year_of_study: yearOfStudy || null,
            course_branch: department || null,
            country: country || null,
            state: state || null,
            district: district || null,
            city: city || null,
            pin_code: pinCode || null,
            domain: internshipDomain,
            duration: finalDuration,
            promo_code: promoCode || null
        };

        let applicationRecord = null;
        if (existingApp) {
            const { data: updatedApp, error: upErr } = await supabaseAdmin
                .from('internship_applications')
                .update(appPayload)
                .eq('id', existingApp.id)
                .select()
                .maybeSingle();
            applicationRecord = updatedApp || existingApp;
        } else {
            const { data: newApp, error: inErr } = await supabaseAdmin
                .from('internship_applications')
                .insert(appPayload)
                .select()
                .maybeSingle();

            if (inErr) {
                console.warn(`[APPLY_API] Insert with status approved had warning: ${inErr.message}. Trying status pending...`);
                const { data: fallbackApp, error: fbErr } = await supabaseAdmin
                    .from('internship_applications')
                    .insert({ ...appPayload, status: 'pending' })
                    .select()
                    .maybeSingle();
                if (fbErr) {
                    console.error('[APPLY_API] Fallback insert error:', fbErr.message);
                }
                applicationRecord = fallbackApp || { id: studentId };
            } else {
                applicationRecord = newApp;
            }
        }

        console.log(`[APPLY_API] Application saved. Application ID: ${appId}`);

        // Establish Active Student Enrollments records
        try {
            const { data: existingEnroll } = await supabaseAdmin
                .from('enrollments')
                .select('id')
                .eq('student_id', studentId)
                .eq('internship_id', finalInternshipId)
                .maybeSingle();

            if (!existingEnroll) {
                await supabaseAdmin.from('enrollments').insert({
                    student_id: studentId,
                    user_id: studentId,
                    internship_id: finalInternshipId,
                    status: 'active',
                    progress: 0
                });
            }
        } catch (e) {
            console.warn('[APPLY_API] enrollments sync note:', e.message);
        }

        try {
            const { data: existingInternEnroll } = await supabaseAdmin
                .from('internship_enrollments')
                .select('id')
                .eq('student_id', studentId)
                .eq('internship_id', finalInternshipId)
                .maybeSingle();

            if (!existingInternEnroll) {
                await supabaseAdmin.from('internship_enrollments').insert({
                    student_id: studentId,
                    user_id: studentId,
                    internship_id: finalInternshipId,
                    status: 'active',
                    progress: 0
                });
            }
        } catch (e) {
            console.warn('[APPLY_API] internship_enrollments sync note:', e.message);
        }

        // Seed task milestones
        try {
            const { data: dbTasks } = await supabaseAdmin
                .from('internship_tasks')
                .select('id, task_number')
                .eq('internship_id', finalInternshipId);

            if (dbTasks && dbTasks.length > 0) {
                const { data: existingProgress } = await supabaseAdmin
                    .from('task_progress')
                    .select('id')
                    .eq('student_id', studentId)
                    .eq('internship_id', finalInternshipId)
                    .limit(1);

                if (!existingProgress || existingProgress.length === 0) {
                    const taskInserts = dbTasks.map(t => ({
                        user_id: studentId,
                        student_id: studentId,
                        internship_id: finalInternshipId,
                        task_id: t.id,
                        status: t.task_number === 1 ? 'available' : 'locked'
                    }));
                    await supabaseAdmin.from('task_progress').insert(taskInserts);
                }
            }
        } catch (e) {
            console.warn('[APPLY_API] task_progress sync note:', e.message);
        }

        // 5. Store offer letter in offer_letters table
        const fallbackToken = `tok_offer_${Math.floor(100000 + Math.random() * 900000)}`;
        const offerSavePayload = {
            user_id: studentId,
            student_id: studentId,
            offer_letter_id: appId,
            student_name: studentName,
            student_email: studentEmail,
            internship_title: internshipTitle,
            internship_id: finalInternshipId,
            duration: finalDuration,
            status: 'ACCEPTED',
            verification_token: fallbackToken,
            issue_date: startDate.toISOString()
        };

        try {
            const { data: existingOffer } = await supabaseAdmin
                .from('offer_letters')
                .select('id')
                .eq('student_id', studentId)
                .eq('internship_id', finalInternshipId)
                .maybeSingle();

            if (existingOffer) {
                await supabaseAdmin.from('offer_letters').update(offerSavePayload).eq('id', existingOffer.id);
            } else {
                await supabaseAdmin.from('offer_letters').insert(offerSavePayload);
            }
        } catch (e) {
            console.warn('[APPLY_API] offer_letters sync note:', e.message);
        }

        // 6. Fast response: Return 200 immediately to client for instant UI response!
        res.status(200).json({
            success: true,
            applicationId: appId,
            message: 'Registration successful!'
        });

        // 7. Background asynchronous processing: PDF generation & Email delivery (non-blocking)
        (async () => {
            let publicUrl = '';
            let pdfBuffer = null;
            try {
                console.log(`[APPLY_API Background] Starting PDF Generation for ${appId}...`);
                const doc = await createOfferLetterPdfDoc({
                    studentName,
                    tokenOffer: appId,
                    internshipTitle,
                    duration: finalDuration,
                    college,
                    issueDate: startDate,
                    req
                });

                pdfBuffer = Buffer.from(doc.output('arraybuffer'));
                await ensureBucketExists();

                const storagePath = `offer-letters/VINIX_Offer_Letter_${appId}.pdf`;
                console.log(`[APPLY_API Background] Uploading PDF to storage slot: ${storagePath}...`);

                await supabaseAdmin.storage
                    .from('documents')
                    .upload(storagePath, pdfBuffer, {
                        contentType: 'application/pdf',
                        upsert: true
                    });

                const { data: urlData } = supabaseAdmin.storage
                    .from('documents')
                    .getPublicUrl(storagePath);
                publicUrl = urlData?.publicUrl || '';
                console.log(`[APPLY_API Background] Upload completed. Public PDF URL: ${publicUrl}`);
            } catch (pdfErr) {
                console.error('[APPLY_API Background] PDF Generation / Storage warning:', pdfErr.message);
            }

            // Send Email Automatically to Student Gmail
            try {
                const emailSubject = `Congratulations! Your Vinix Technology Internship Offer Letter – ${appId}`;
                const htmlBody = createOfferLetterEmailHtml({
                    studentName,
                    tokenOffer: appId,
                    internshipTitle,
                    duration: finalDuration,
                    formattedStart,
                    formattedEnd
                });

                const emailBody = `Dear ${studentName},\n\n` +
                    `Congratulations!\n\n` +
                    `Your registration for the Vinix Technology Virtual Internship Program has been successfully completed.\n\n` +
                    `Your official Internship Offer Letter has been automatically generated and is attached to this email.\n\n` +
                    `Application ID: ${appId}\n` +
                    `Internship Domain: ${internshipTitle}\n` +
                    `Duration: ${finalDuration}\n` +
                    `Start Date: ${formattedStart}\n` +
                    `End Date: ${formattedEnd}\n\n` +
                    `Please keep this offer letter safely for your future reference.\n\n` +
                    `Best Regards,\n\n` +
                    `Vinix Technology\n` +
                    `Virtual Internship Team`;

                await sendEmail({
                    email: studentEmail,
                    name: studentName,
                    subject: emailSubject,
                    body: emailBody,
                    htmlBody,
                    pdfBuffer,
                    pdfName: `VINIX_Offer_Letter_${appId}.pdf`
                });
                console.log(`[APPLY_API Background] Offer email dispatched for ${studentEmail}`);
            } catch (mailError) {
                console.error('[APPLY_API Background] SMTP send error details:', mailError.message);
            }
        })();
    } catch (e) {
        console.error('[APPLY_API] Global internal server error:', e);
        res.status(500).json({ error: 'Internal Server Error', message: e.message });
    }
}
