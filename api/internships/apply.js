import {
    supabaseAdmin,
    sendEmail,
    ensureBucketExists,
    getOrCreateInternship,
    createOfferLetterPdfDoc,
    createOfferLetterEmailHtml
} from '../_utils.js?v=20261002_v3';

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
    } = req.body;

    // 1. Validate student information (internshipId is optional here as it will be resolved server-side)
    if (!studentId || !studentName || !studentEmail || !college || !department || !internshipDomain || !duration) {
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

        // Resolve or create internship track details server-side to guarantee consistency and avoid null internship_id
        console.log(`[APPLY_API] Resolving internship track for: ${internshipDomain} (${duration})`);
        const resolvedInternship = await getOrCreateInternship(internshipDomain, duration);
        const finalInternshipId = resolvedInternship.id;
        const internshipTitle = resolvedInternship.title;
        const finalDuration = resolvedInternship.duration || duration || '1 Month';

        // 2. Duplicate Protection
        const { data: existingApp, error: appLookError } = await supabaseAdmin
            .from('internship_applications')
            .select('*')
            .eq('student_id', studentId)
            .eq('internship_id', finalInternshipId)
            .maybeSingle();

        if (existingApp && !req.body.force && existingApp.offerLetterSent) {
            let resolvedAppId = existingApp.applicationId;
            if (!resolvedAppId) {
                const { data: offerData } = await supabaseAdmin
                    .from('offer_letters')
                    .select('offer_letter_id')
                    .eq('student_id', studentId)
                    .eq('internship_id', finalInternshipId)
                    .maybeSingle();
                resolvedAppId = offerData?.offer_letter_id || existingApp.id;
            }

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

        // 4. Save application record in database
        let applicationRecord = null;
        let requiresFallback = false;

        // Try inserting using the full status=Registered & camelCase columns schema first
        const appPayload = {
            student_id: studentId,
            internship_id: finalInternshipId,
            status: 'Registered',
            student_name: studentName,
            email: studentEmail,
            phone: phone || null,
            college: college,
            year_of_study: yearOfStudy || null,
            course_branch: department, // Map department to course_branch for legacy compatibility
            country: country || null,
            state: state || null,
            district: district || null,
            city: city || null,
            pin_code: pinCode || null,
            domain: internshipDomain,
            duration: finalDuration,
            promo_code: promoCode || null,

            // CamelCase fields from checklist
            applicationId: appId,
            studentId,
            studentName,
            studentEmail,
            college,
            department,
            internshipDomain,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            offerLetterGenerated: false,
            offerLetterSent: false,
            offerLetterSentAt: null,
            offerLetterFile: null,
            emailError: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const { data: dbData, error: dbErr } = await supabaseAdmin
            .from('internship_applications')
            .insert(appPayload)
            .select()
            .maybeSingle();

        if (dbErr) {
            console.warn(`[APPLY_API] Custom schema insert error. Attempting legacy compatibility fallback: ${dbErr.message}`);
            requiresFallback = true;

            // Fallback: Inserting only fields that exist in standard schema, and setting status to 'pending' to satisfy CHECK Constraint
            const legacyPayload = {
                student_id: studentId,
                internship_id: finalInternshipId,
                student_name: studentName,
                email: studentEmail,
                phone: phone || null,
                college: college,
                year_of_study: yearOfStudy || null,
                course_branch: department,
                country: country || null,
                state: state || null,
                district: district || null,
                city: city || null,
                pin_code: pinCode || null,
                domain: internshipDomain,
                duration: finalDuration,
                promo_code: promoCode || null,
                status: 'pending' // Fallback state
            };

            const { data: legacyData, error: legacyErr } = await supabaseAdmin
                .from('internship_applications')
                .insert(legacyPayload)
                .select()
                .maybeSingle();

            if (legacyErr) throw legacyErr;
            applicationRecord = legacyData;
        } else {
            applicationRecord = dbData;
        }

        console.log(`[APPLY_API] Application saved. ID: ${applicationRecord.id}, Application ID: ${appId}`);

        // Establish Active Student Enrollments client-side records
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

        // Seed task milestones
        const { data: dbTasks } = await supabaseAdmin
            .from('internship_tasks')
            .select('id, task_number')
            .eq('internship_id', finalInternshipId);

        if (dbTasks && dbTasks.length > 0) {
            const taskInserts = dbTasks.map(t => ({
                user_id: studentId,
                student_id: studentId,
                internship_id: finalInternshipId,
                task_id: t.id,
                status: t.task_number === 1 ? 'available' : 'locked'
            }));
            await supabaseAdmin.from('task_progress').insert(taskInserts);
        }

        // 5. Generate Personalized Offer Letter PDF
        console.log(`[APPLY_API] Starting PDF Generation for ${appId}...`);
        const doc = await createOfferLetterPdfDoc({
            studentName,
            tokenOffer: appId,
            internshipTitle,
            duration: finalDuration,
            college,
            issueDate: startDate,
            req
        });

        // Output and upload PDF
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        await ensureBucketExists();

        const storagePath = `offer-letters/VINIX_Offer_Letter_${appId}.pdf`;
        console.log(`[APPLY_API] Uploading PDF to storage slot: ${storagePath}...`);

        await supabaseAdmin.storage
            .from('documents')
            .upload(storagePath, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true
            });

        const { data: urlData } = supabaseAdmin.storage
            .from('documents')
            .getPublicUrl(storagePath);
        const publicUrl = urlData?.publicUrl || '';
        console.log(`[APPLY_API] Upload completed. Public PDF URL: ${publicUrl}`);

        // 6. Send Email Automatically to Student Gmail
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

        let mailStatus = 'sent';
        let mailErrorStr = null;

        try {
            const mailResult = await sendEmail({
                email: studentEmail,
                name: studentName,
                subject: emailSubject,
                body: emailBody,
                htmlBody,
                pdfBuffer,
                pdfName: `VINIX_Offer_Letter_${appId}.pdf`
            });
            if (mailResult?.mock) {
                mailStatus = 'mock_sent';
            }
        } catch (mailError) {
            console.error('[APPLY_API] SMTP send error details:', mailError.message);
            mailStatus = 'failed';
            mailErrorStr = mailError.message;
        }

        // 7. Update Application/Offer Status in Database
        if (!requiresFallback) {
            console.log(`[APPLY_API] Saving new schema tracking status for applicationId ${appId}...`);
            await supabaseAdmin
                .from('internship_applications')
                .update({
                    offerLetterGenerated: true,
                    offerLetterSent: mailStatus.includes('sent'),
                    offerLetterSentAt: mailStatus.includes('sent') ? new Date().toISOString() : null,
                    offerLetterFile: publicUrl,
                    emailError: mailErrorStr,
                    status: 'Offer Letter Sent' // Update status here
                })
                .eq('id', applicationRecord.id);
        } else {
            console.log(`[APPLY_API] Rolling back application tracking state to legacy table columns...`);
            // Store fallback details in the offer_letters table so it maintains visual reference on dashboard
            const fallbackToken = `tok_offer_${Math.floor(100000 + Math.random() * 900000)}`;
            const fallbackSave = {
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

            // Re-update the applications status to approved in legacy structure
            await supabaseAdmin
                .from('internship_applications')
                .update({ status: 'approved' })
                .eq('id', applicationRecord.id);

            const { data: legacyOffer } = await supabaseAdmin
                .from('offer_letters')
                .select('id')
                .eq('student_id', studentId)
                .eq('internship_id', finalInternshipId)
                .maybeSingle();

            if (legacyOffer) {
                await supabaseAdmin.from('offer_letters').update(fallbackSave).eq('id', legacyOffer.id);
            } else {
                await supabaseAdmin.from('offer_letters').insert(fallbackSave);
            }
        }

        res.status(200).json({
            success: true,
            applicationId: appId,
            offerUrl: publicUrl,
            emailStatus: mailStatus,
            emailError: mailErrorStr
        });
    } catch (e) {
        console.error('[APPLY_API] Global internal server error:', e);
        res.status(500).json({ error: 'Internal Server Error', message: e.message });
    }
}
