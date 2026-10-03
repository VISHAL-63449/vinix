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

    let lookupId = req.body?.applicationId || (req.query ? req.query.applicationId : null);
    if (!lookupId && req.url) {
        try {
            const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            lookupId = urlObj.searchParams.get('applicationId');
        } catch (e) { }
    }

    const fallbackEmail = req.body?.email;
    const fallbackStudentName = req.body?.studentName;
    const fallbackCourseName = req.body?.courseName;
    const fallbackDuration = req.body?.duration || '1 Month';

    if (!lookupId && !fallbackEmail) {
        res.status(400).json({ error: 'Missing applicationId or email parameter.' });
        return;
    }

    try {
        console.log(`[RESEND_API] Received resend trigger for lookup: ${lookupId}, email: ${fallbackEmail}`);

        // 1. Find existing application (by UUID, applicationId text, enrollment id, student id, or email)
        let app = null;
        let isUuid = lookupId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lookupId);

        if (isUuid) {
            const { data } = await supabaseAdmin
                .from('internship_applications')
                .select('*')
                .eq('id', lookupId)
                .maybeSingle();
            app = data;
        }

        if (!app && lookupId) {
            const { data } = await supabaseAdmin
                .from('internship_applications')
                .select('*')
                .eq('applicationId', lookupId)
                .maybeSingle();
            app = data;
        }

        if (!app && lookupId) {
            const { data: offerRecord } = await supabaseAdmin
                .from('offer_letters')
                .select('student_id, internship_id, student_name, student_email')
                .eq('offer_letter_id', lookupId)
                .maybeSingle();

            if (offerRecord) {
                const { data: fallbackApp } = await supabaseAdmin
                    .from('internship_applications')
                    .select('*')
                    .eq('student_id', offerRecord.student_id)
                    .eq('internship_id', offerRecord.internship_id)
                    .maybeSingle();
                app = fallbackApp;
            }
        }

        if (!app && isUuid) {
            // Check if lookupId is an enrollment ID
            const { data: enrollRecord } = await supabaseAdmin
                .from('enrollments')
                .select('*, profiles(full_name, email, college), internships(id, title, duration)')
                .eq('id', lookupId)
                .maybeSingle();

            if (enrollRecord) {
                const { data: appByEnroll } = await supabaseAdmin
                    .from('internship_applications')
                    .select('*')
                    .or(`student_id.eq.${enrollRecord.user_id},email.eq.${enrollRecord.profiles?.email}`)
                    .limit(1)
                    .maybeSingle();

                if (appByEnroll) {
                    app = appByEnroll;
                } else {
                    // Synthetic application record from enrollment
                    app = {
                        student_id: enrollRecord.user_id,
                        internship_id: enrollRecord.internship_id,
                        student_name: enrollRecord.profiles?.full_name || fallbackStudentName,
                        email: enrollRecord.profiles?.email || fallbackEmail,
                        college: enrollRecord.profiles?.college,
                        domain: enrollRecord.internships?.title || fallbackCourseName,
                        duration: enrollRecord.internships?.duration || fallbackDuration
                    };
                }
            }
        }

        if (!app && fallbackEmail) {
            const { data } = await supabaseAdmin
                .from('internship_applications')
                .select('*')
                .eq('email', fallbackEmail)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            app = data;
        }

        // 2. Extract particulars
        const studentName = app?.studentName || app?.student_name || fallbackStudentName || 'Student';
        const studentEmail = app?.studentEmail || app?.email || fallbackEmail;
        const college = app?.college || 'Anna University, Chennai';
        const internshipDomain = app?.internshipDomain || app?.domain || fallbackCourseName || 'Full Stack Development';
        const finalDuration = app?.duration || fallbackDuration || '1 Month';
        const studentId = app?.studentId || app?.student_id;
        let resolvedInternshipId = app?.internship_id;

        if (!studentEmail) {
            res.status(400).json({ error: 'Applicant student email is missing.' });
            return;
        }

        // 3. Resolve or reuse existing Application / Offer Letter ID
        const { data: existingOffer } = await supabaseAdmin
            .from('offer_letters')
            .select('*')
            .or(`student_id.eq.${studentId},student_email.eq.${studentEmail}`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const appId = existingOffer?.offer_letter_id || app?.applicationId || `VINIX-2026-${Math.floor(100000 + Math.random() * 900000)}`;

        console.log(`[RESEND_API] Resolving details for resend: Email: ${studentEmail}, Name: ${studentName}, AppID: ${appId}`);

        // Fetch internship track details or resolve dynamically
        let internship = null;
        if (resolvedInternshipId) {
            const { data: instData } = await supabaseAdmin
                .from('internships')
                .select('id, title, duration')
                .eq('id', resolvedInternshipId)
                .maybeSingle();
            internship = instData;
        }

        if (!internship && internshipDomain) {
            const resolved = await getOrCreateInternship(internshipDomain, finalDuration);
            internship = resolved;
            resolvedInternshipId = resolved.id;
            if (app?.id) {
                await supabaseAdmin
                    .from('internship_applications')
                    .update({ internship_id: resolvedInternshipId })
                    .eq('id', app.id);
            }
        }

        const internshipTitle = internship?.title || internshipDomain || 'Virtual Internship Program';
        const startDate = app?.startDate ? new Date(app.startDate) : (existingOffer?.issue_date ? new Date(existingOffer.issue_date) : new Date());

        // 4. Generate new authentic Offer Letter PDF
        console.log(`[RESEND_API] Generating authentic PDF Offer Letter for ${appId}...`);
        const doc = await createOfferLetterPdfDoc({
            studentName,
            tokenOffer: appId,
            internshipTitle,
            duration: finalDuration,
            college,
            issueDate: startDate,
            req
        });

        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        await ensureBucketExists();

        const storagePath = `offer-letters/VINIX_Offer_Letter_${appId}.pdf`;
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

        // 5. Send rich HTML Email with PDF Attachment via Gmail
        const emailSubject = `Congratulations! Your Vinix Technology Internship Offer Letter – ${appId}`;
        const htmlBody = createOfferLetterEmailHtml({
            studentName,
            tokenOffer: appId,
            internshipTitle,
            duration: finalDuration
        });

        const plainTextBody = `Dear ${studentName},\n\n` +
            `Congratulations!\n\n` +
            `Your registration for the Vinix Technology Virtual Internship Program has been verified.\n\n` +
            `Your official Internship Offer Letter has been reissued and is attached to this email as a PDF.\n\n` +
            `Application ID: ${appId}\n` +
            `Internship Domain: ${internshipTitle}\n` +
            `Duration: ${finalDuration}\n\n` +
            `Best Regards,\n` +
            `Vinix Technology Academic Council`;

        let mailStatus = 'sent';
        let mailErrorStr = null;

        try {
            const mailResult = await sendEmail({
                email: studentEmail,
                name: studentName,
                subject: emailSubject,
                body: plainTextBody,
                htmlBody,
                pdfBuffer,
                pdfName: `VINIX_Offer_Letter_${appId}.pdf`
            });
            if (mailResult?.mock) {
                mailStatus = 'mock_sent';
            }
        } catch (mailError) {
            console.error('[RESEND_API] Resend SMTP failure:', mailError.message);
            mailStatus = 'failed';
            mailErrorStr = mailError.message;
        }

        // 6. Update Database
        if (app?.id) {
            await supabaseAdmin
                .from('internship_applications')
                .update({
                    offerLetterSent: mailStatus.includes('sent'),
                    offerLetterSentAt: mailStatus.includes('sent') ? new Date().toISOString() : null,
                    emailError: mailErrorStr,
                    status: 'Offer Letter Sent'
                })
                .eq('id', app.id);
        }

        // Also update offer_letters record
        const offerPayload = {
            user_id: studentId || existingOffer?.user_id,
            student_id: studentId || existingOffer?.student_id,
            offer_letter_id: appId,
            student_name: studentName,
            student_email: studentEmail,
            internship_title: internshipTitle,
            internship_id: resolvedInternshipId,
            duration: finalDuration,
            status: 'ACCEPTED',
            verification_token: existingOffer?.verification_token || `tok_offer_${Math.floor(100000 + Math.random() * 900000)}`,
            issue_date: startDate.toISOString(),
            offer_letter_path: storagePath,
            offer_letter_url: publicUrl,
            offer_letter_generated_at: new Date().toISOString(),
            offer_email_status: mailStatus,
            offer_email_sent_at: mailStatus.includes('sent') ? new Date().toISOString() : null,
            offer_email_error: mailErrorStr
        };

        if (existingOffer) {
            await supabaseAdmin
                .from('offer_letters')
                .update(offerPayload)
                .eq('id', existingOffer.id);
        } else if (studentId && resolvedInternshipId) {
            await supabaseAdmin
                .from('offer_letters')
                .insert(offerPayload);
        }

        if (mailStatus === 'failed') {
            res.status(500).json({ error: 'Mail delivery failed', message: mailErrorStr });
        } else {
            console.log(`[RESEND_API] Successfully resent offer letter to ${studentEmail}`);
            res.status(200).json({
                success: true,
                message: 'Offer letter resent successfully.',
                offerUrl: publicUrl
            });
        }
    } catch (e) {
        console.error('[RESEND_API] Internal server error:', e);
        res.status(500).json({ error: 'Internal Server Error', message: e.message });
    }
}
