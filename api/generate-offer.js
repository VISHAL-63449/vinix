import {
    supabaseAdmin,
    sendEmail,
    ensureBucketExists,
    getOrCreateInternship,
    createOfferLetterPdfDoc,
    createOfferLetterEmailHtml
} from './_utils.js';

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

    const { applicationId, studentId, internshipId, force, regenerate } = req.body || {};
    const forceRegenerate = force === true || regenerate === true;

    if (!applicationId && (!studentId || !internshipId) && !req.body?.email) {
        res.status(400).json({ error: 'Missing parameters. Provide applicationId or studentId and internshipId.' });
        return;
    }

    try {
        console.log(`[GEN_OFFER] Received request. AppID: ${applicationId}, StudID: ${studentId}, InternID: ${internshipId}, Force: ${forceRegenerate}`);

        // 1. Fetch the internship application record
        let app = null;
        if (applicationId) {
            const { data, error } = await supabaseAdmin
                .from('internship_applications')
                .select('*')
                .eq('id', applicationId)
                .maybeSingle();
            if (error) console.warn('[GEN_OFFER] Application lookup by ID:', error.message);
            app = data;
        }

        if (!app && studentId && internshipId) {
            const { data, error } = await supabaseAdmin
                .from('internship_applications')
                .select('*')
                .eq('student_id', studentId)
                .eq('internship_id', internshipId)
                .maybeSingle();
            if (error) console.warn('[GEN_OFFER] Application lookup by student & internship:', error.message);
            app = data;
        }

        if (!app && studentId) {
            const { data } = await supabaseAdmin
                .from('internship_applications')
                .select('*')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            app = data;
        }

        // Gather details
        let sName = app?.student_name || req.body?.studentName;
        let sEmail = app?.email || req.body?.email;
        let sCollege = app?.college || req.body?.college || 'Anna University, Chennai';
        let sDuration = app?.duration || req.body?.duration || '1 Month';
        let sDomain = app?.domain || req.body?.courseName;
        let finalInternshipId = internshipId || app?.internship_id;
        let finalStudentId = studentId || app?.student_id;

        // Fetch User profile details if missing in application
        if (finalStudentId && (!sName || !sEmail)) {
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('full_name, email, college')
                .eq('id', finalStudentId)
                .maybeSingle();
            if (profile) {
                sName = sName || profile.full_name;
                sEmail = sEmail || profile.email;
                sCollege = sCollege || profile.college || 'Anna University, Chennai';
            }
        }

        // Fetch internship track details or resolve it dynamically
        let internship = null;
        if (finalInternshipId) {
            const { data: instData } = await supabaseAdmin
                .from('internships')
                .select('id, title, duration')
                .eq('id', finalInternshipId)
                .maybeSingle();
            internship = instData;
        }

        if (!internship && sDomain) {
            console.log(`[GEN_OFFER] Resolving internship via domain: ${sDomain} (${sDuration})`);
            const resolved = await getOrCreateInternship(sDomain, sDuration);
            internship = resolved;
            finalInternshipId = resolved.id;
            if (app) {
                await supabaseAdmin
                    .from('internship_applications')
                    .update({ internship_id: finalInternshipId })
                    .eq('id', app.id);
            }
        }

        const internshipTitle = internship?.title || sDomain || 'Virtual Internship Program';
        sDuration = sDuration || internship?.duration || '1 Month';

        // Update application status to 'Approved'
        if (app) {
            console.log(`[GEN_OFFER] Updating application status to Approved for AppID: ${app.id}`);
            const { error: updateAppErr1 } = await supabaseAdmin
                .from('internship_applications')
                .update({ status: 'Approved', updated_at: new Date().toISOString() })
                .eq('id', app.id);
            if (updateAppErr1) {
                await supabaseAdmin
                    .from('internship_applications')
                    .update({ status: 'approved', updated_at: new Date().toISOString() })
                    .eq('id', app.id);
            }
        }

        // 2. IDEMPOTENCY / CACHE CHECK
        const { data: existingOffer } = await supabaseAdmin
            .from('offer_letters')
            .select('*')
            .eq('student_id', finalStudentId)
            .eq('internship_id', finalInternshipId)
            .maybeSingle();

        // If offer letter exists and force is NOT set, return cached
        if (!forceRegenerate && existingOffer && existingOffer.offer_letter_url && existingOffer.offer_email_status === 'sent') {
            console.log(`[GEN_OFFER] Offer letter already complete: ${existingOffer.offer_letter_id} for ${sEmail}. Returning cached response.`);
            res.status(200).json({ success: true, alreadyGenerated: true, data: existingOffer });
            return;
        }

        console.log(`[GEN_OFFER] Generating new Offer Letter PDF for ${sName} (${sEmail})...`);

        // Generate Offer Letter IDs (6 digits to match VINIX-XXXXXX)
        const tokenOffer = existingOffer?.offer_letter_id || app?.applicationId || `VINIX-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        const verificationToken = existingOffer?.verification_token || `tok_offer_${Math.floor(100000 + Math.random() * 900000)}`;
        const issueDate = existingOffer?.issue_date || new Date().toISOString();

        // 3. Create PDF with the authentic, verified design
        const doc = await createOfferLetterPdfDoc({
            studentName: sName,
            tokenOffer,
            internshipTitle,
            duration: sDuration,
            college: sCollege,
            issueDate,
            req
        });

        const pdfOutput = doc.output('arraybuffer');
        const pdfBuffer = Buffer.from(pdfOutput);

        console.log(`[GEN_OFFER] PDF compiled successfully (${pdfBuffer.length} bytes). Uploading...`);

        // 4. Upload to Supabase Storage bucket
        await ensureBucketExists();

        const storagePath = `offer-letters/${tokenOffer}_${Date.now()}.pdf`;
        const { error: uploadErr } = await supabaseAdmin.storage
            .from('documents')
            .upload(storagePath, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (uploadErr) console.warn('[GEN_OFFER] Storage upload warning:', uploadErr.message);

        // Obtain public URL
        const { data: urlData } = supabaseAdmin.storage
            .from('documents')
            .getPublicUrl(storagePath);

        const publicUrl = urlData?.publicUrl || '';
        console.log(`[GEN_OFFER] Uploaded to storage. Public URL: ${publicUrl}`);

        // 5. Send Rich Email to student with attachment
        const emailSubject = `🎉 Official Internship Offer Letter – Vinix Technologies (${tokenOffer})`;

        const htmlBody = createOfferLetterEmailHtml({
            studentName: sName,
            tokenOffer,
            internshipTitle,
            duration: sDuration
        });

        const plainTextBody = `Dear ${sName},\n\n` +
            `Congratulations! Your application for the Vinix Technologies Virtual Internship Program has been officially approved.\n\n` +
            `Your official Internship Offer Letter is attached to this email as a PDF.\n\n` +
            `Intern ID: ${tokenOffer}\n` +
            `Domain: ${internshipTitle}\n` +
            `Duration: ${sDuration}\n\n` +
            `Best Regards,\n` +
            `Academic Operations Council\n` +
            `VINIX Technologies`;

        let mailResult;
        let mailErrorStr = null;
        let mailStatus = 'sent';

        try {
            mailResult = await sendEmail({
                email: sEmail,
                name: sName,
                subject: emailSubject,
                body: plainTextBody,
                htmlBody,
                pdfBuffer,
                pdfName: `VINIX_Offer_Letter_${tokenOffer}.pdf`
            });
            if (mailResult?.mock) {
                mailStatus = 'mock_sent';
            }
        } catch (mErr) {
            console.error('[GEN_OFFER] Email dispatch failed:', mErr.message);
            mailStatus = 'failed';
            mailErrorStr = mErr.message;
        }

        // Update status of internship_applications to 'Offer Letter Sent'
        if (app) {
            console.log(`[GEN_OFFER] Updating application status to Offer Letter Sent for AppID: ${app.id}`);
            const { error: updateAppErr2 } = await supabaseAdmin
                .from('internship_applications')
                .update({ status: 'Offer Letter Sent', updated_at: new Date().toISOString() })
                .eq('id', app.id);
            if (updateAppErr2) {
                await supabaseAdmin
                    .from('internship_applications')
                    .update({ status: 'approved', updated_at: new Date().toISOString() })
                    .eq('id', app.id);
            }
        }

        // 6. Update offer_letters table
        const offerDataSave = {
            user_id: finalStudentId,
            student_id: finalStudentId,
            offer_letter_id: tokenOffer,
            student_name: sName,
            student_email: sEmail,
            internship_title: internshipTitle,
            internship_id: finalInternshipId,
            duration: sDuration,
            status: 'ACCEPTED',
            verification_token: verificationToken,
            issue_date: issueDate,
            application_id: app?.id || null,
            offer_letter_path: storagePath,
            offer_letter_url: publicUrl,
            offer_letter_generated_at: new Date().toISOString(),
            offer_email_status: mailStatus,
            offer_email_sent_at: mailStatus.includes('sent') ? new Date().toISOString() : null,
            offer_email_error: mailErrorStr
        };

        let dbSaveErr = null;
        if (existingOffer) {
            const { error: updErr } = await supabaseAdmin
                .from('offer_letters')
                .update(offerDataSave)
                .eq('id', existingOffer.id);
            dbSaveErr = updErr;
        } else {
            const { error: insErr } = await supabaseAdmin
                .from('offer_letters')
                .insert(offerDataSave);
            dbSaveErr = insErr;
        }

        if (dbSaveErr) {
            console.warn(`[GEN_OFFER] DB save fallback: ${dbSaveErr.message}`);
            const legacySave = {
                user_id: finalStudentId,
                student_id: finalStudentId,
                offer_letter_id: tokenOffer,
                student_name: sName,
                student_email: sEmail,
                internship_title: internshipTitle,
                internship_id: finalInternshipId,
                duration: sDuration,
                status: 'ACCEPTED',
                verification_token: verificationToken,
                issue_date: issueDate
            };
            if (existingOffer) {
                await supabaseAdmin.from('offer_letters').update(legacySave).eq('id', existingOffer.id);
            } else {
                await supabaseAdmin.from('offer_letters').insert(legacySave);
            }
        }

        console.log(`[GEN_OFFER] Process completed successfully! Email Status: ${mailStatus}`);
        res.status(200).json({
            success: true,
            message: 'Offer letter handled successfully.',
            offerLetterId: tokenOffer,
            url: publicUrl,
            emailStatus: mailStatus,
            emailError: mailErrorStr
        });
    } catch (err) {
        console.error('[GEN_OFFER] Server error:', err);
        res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
}
