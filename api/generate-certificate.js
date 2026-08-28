import { jsPDF } from 'jspdf';
import { supabaseAdmin, getImageBase64, sendEmail, ensureBucketExists } from './_utils.js';

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
        res.status(455).json({ error: 'Method Not Allowed' });
        return;
    }

    const { studentId, courseName, certificateNumber, enrollmentId, internshipId } = req.body;

    if (!studentId || (!courseName && !internshipId)) {
        res.status(400).json({ error: 'Missing parameters. Provide studentId and courseName/internshipId.' });
        return;
    }

    try {
        console.log(`[GEN_CERT] Received request. StudentID: ${studentId}, Course: ${courseName}, CertNo: ${certificateNumber}`);

        // Fetch User profile details (name and email)
        const { data: profile, error: pErr } = await supabaseAdmin
            .from('profiles')
            .select('full_name, email')
            .eq('id', studentId)
            .maybeSingle();

        if (pErr) throw pErr;
        if (!profile) {
            res.status(404).json({ error: `Student profile not found for ID: ${studentId}` });
            return;
        }

        const sName = profile.full_name || 'Vinix Graduate';
        const sEmail = profile.email;

        // Fetch internship track details if missing courseName
        let finalCourseName = courseName;
        if (!finalCourseName && internshipId) {
            const { data: internship, error: iErr } = await supabaseAdmin
                .from('internships')
                .select('title')
                .eq('id', internshipId)
                .maybeSingle();
            if (internship) finalCourseName = internship.title;
        }
        finalCourseName = finalCourseName || 'Virtual Internship Program';

        // 1. IDEMPOTENCY CHECK
        // Check if certificate already exists with generated URL
        const { data: existingCert, error: cErr } = await supabaseAdmin
            .from('certificates')
            .select('*')
            .eq('user_id', studentId)
            .eq('course_name', finalCourseName)
            .maybeSingle();

        if (existingCert && existingCert.certificate_url && existingCert.certificate_email_status === 'sent') {
            console.log(`[GEN_CERT] Certificate already complete: ${existingCert.certificate_number} for ${sEmail}. Returning cache.`);
            res.status(200).json({ success: true, alreadyGenerated: true, data: existingCert });
            return;
        }

        console.log(`[GEN_CERT] Generating new Certificate PDF for ${sName} (${sEmail})...`);

        // Generate Certificate IDs
        const tokenCert = certificateNumber || existingCert?.certificate_number || `VINIX-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const verificationCode = existingCert?.verification_code || tokenCert;
        const issueDate = existingCert?.issue_date || new Date().toISOString();

        // 2. Load Images for PDF
        const logoBase64 = await getImageBase64('vinix-logo.png', req);
        const msmeBase64 = await getImageBase64('msme.jpeg', req);
        const stampBase64 = await getImageBase64('certificate-stamp.jpeg', req);
        const signBase64 = await getImageBase64('founder-sign.png', req);

        // 3. Create Landscape A4 PDF using jsPDF
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        // Borders
        // Outer border
        doc.setDrawColor(15, 41, 66); // #0f2942
        doc.setLineWidth(1.2);
        doc.rect(8, 8, 281, 194);

        // Inner border
        doc.setDrawColor(204, 163, 83); // #cca353
        doc.setLineWidth(0.5);
        doc.rect(10, 10, 277, 190);

        // TOP ROW BRANDING
        // Left Logo
        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', 18, 16, 15, 15);
        }

        // Center text
        doc.setTextColor(15, 41, 66);
        doc.setFontSize(26);
        doc.setFont('Helvetica', 'bold');
        doc.text("VINIX", 148, 22, { align: "center" });

        doc.setTextColor(204, 163, 83);
        doc.setFontSize(9);
        doc.text("Empowering Future Innovators", 148, 27, { align: "center" });

        // Right Logo
        if (msmeBase64) {
            doc.addImage(msmeBase64, 'JPEG', 259, 16, 18, 18);
        }

        // TITLE SECTION
        doc.setTextColor(15, 41, 66);
        doc.setFontSize(30);
        doc.setFont('Helvetica', 'bold');
        doc.text("CERTIFICATE", 148, 48, { align: "center" });

        doc.setTextColor(204, 163, 83);
        doc.setFontSize(13);
        doc.text("OF INTERNSHIP COMPLETION", 148, 55, { align: "center" });

        // BODY SECTION
        doc.setTextColor(100, 116, 139); // slate-500
        doc.setFontSize(11);
        doc.setFont('Helvetica', 'normal');
        doc.text("This certificate is proudly presented to", 148, 70, { align: "center" });

        // Recipient Student Name in uppercase
        doc.setTextColor(15, 23, 42); // slate-900
        doc.setFontSize(24);
        doc.setFont('Helvetica', 'bold');
        doc.text(sName.toUpperCase(), 148, 86, { align: "center" });

        // Description Paragraph
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(11);
        doc.setFont('Helvetica', 'normal');

        const descText = `for successfully completing the task-based virtual internship program in ${finalCourseName} at VINIX Technologies, demonstrating dedication, technical skill, and professional excellence throughout the program.`;
        const linesDesc = doc.splitTextToSize(descText, 210);
        doc.text(linesDesc, 148, 100, { align: "center" });

        // SIGNATURES FOOTER SECTION
        const footerY = 145;

        // Left column - Date of Issuance
        doc.setTextColor(15, 41, 66);
        doc.setFontSize(11);
        doc.setFont('Helvetica', 'bold');
        const formattedDate = new Date(issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.text(formattedDate, 38, footerY + 10, { align: "left" });

        doc.setDrawColor(203, 213, 225); // slate-300
        doc.setLineWidth(0.4);
        doc.line(18, footerY + 13, 88, footerY + 13);

        doc.setTextColor(100, 116, 139);
        doc.setFontSize(9);
        doc.setFont('Helvetica', 'bold');
        doc.text("Date of Issuance", 18, footerY + 18, { align: "left" });
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text("Issued Date", 18, footerY + 23, { align: "left" });

        // Center column - Official Stamp / Verification
        if (stampBase64) {
            doc.addImage(stampBase64, 'JPEG', 137, footerY - 5, 20, 20);
        }

        doc.setTextColor(71, 85, 105);
        doc.setFontSize(8);
        doc.setFont('Helvetica', 'bold');
        const shortInternId = tokenCert.split('-').pop();
        doc.text(`Intern ID: VINIX-${shortInternId}`, 148, footerY + 19, { align: "center" });
        doc.setFontSize(7);
        doc.setFont('Helvetica', 'normal');
        doc.text(`Verify at: verify.vinix.co/${tokenCert}`, 148, footerY + 23, { align: "center" });

        // Right column - Founder Signature
        if (signBase64) {
            doc.addImage(signBase64, 'PNG', 228, footerY, 26, 9);
        }
        doc.line(208, footerY + 13, 278, footerY + 13);

        doc.setTextColor(100, 116, 139);
        doc.setFontSize(9);
        doc.setFont('Helvetica', 'bold');
        doc.text("Vishal R", 278, footerY + 18, { align: "right" });
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text("Founder & CEO", 278, footerY + 22, { align: "right" });
        doc.text(`Certificate ID: ${tokenCert}`, 278, footerY + 26, { align: "right" });

        // Compile PDF into Buffer
        const pdfOutput = doc.output('arraybuffer');
        const pdfBuffer = Buffer.from(pdfOutput);

        console.log(`[GEN_CERT] PDF compiled successfully (${pdfBuffer.length} bytes). Uploading...`);

        // 4. Upload to Supabase Storage bucket
        await ensureBucketExists();

        const storagePath = `certificates/${tokenCert}_${Date.now()}.pdf`;
        const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
            .from('documents')
            .upload(storagePath, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (uploadErr) throw uploadErr;

        // Obtain public URL
        const { data: urlData } = supabaseAdmin.storage
            .from('documents')
            .getPublicUrl(storagePath);

        const publicUrl = urlData?.publicUrl || '';
        console.log(`[GEN_CERT] Uploaded to storage. Public URL: ${publicUrl}`);

        // 5. Send Email to student with attachment
        const emailSubject = `Internship Completion Certificate - ${finalCourseName} - VINIX Technologies`;
        const emailBody = `Dear ${sName},\n\n` +
            `We are extremely pleased to present your Certificate of Internship Completion for the ${finalCourseName} track at VINIX Technologies.\n\n` +
            `You have shown incredible dedication, completed all milestone challenges, and proven your technical skills.\n\n` +
            `Please find your official Certificate of Completion attached to this email. You can verify the authenticity of this credential anytime at direct web URL: ${publicUrl} or via verify.vinix.co/${tokenCert}.\n\n` +
            `Details:\n` +
            `- Certificate Number: ${tokenCert}\n` +
            `- Course: ${finalCourseName}\n` +
            `- Date of Issuance: ${formattedDate}\n\n` +
            `We wish you the very best in all your future professional pursuits!\n\n` +
            `Warm regards,\n` +
            `Vishal R\n` +
            `Founder & CEO\n` +
            `VINIX Technologies`;

        let mailResult;
        let mailErrorStr = null;
        let mailStatus = 'sent';

        try {
            mailResult = await sendEmail({
                email: sEmail,
                name: sName,
                subject: emailSubject,
                body: emailBody,
                pdfBuffer,
                pdfName: `${tokenCert}.pdf`
            });
            if (mailResult?.mock) {
                mailStatus = 'mock_sent';
            }
        } catch (mErr) {
            console.error('[GEN_CERT] Email dispatch failed:', mErr.message);
            mailStatus = 'failed';
            mailErrorStr = mErr.message;
        }

        // 6. Update certificates table
        const certDataSave = {
            user_id: studentId,
            student_id: studentId,
            internship_id: internshipId || null,
            enrollment_id: enrollmentId || null,
            certificate_number: tokenCert,
            certificate_id: tokenCert,
            verification_code: verificationCode,
            course_name: finalCourseName,
            status: 'issued',
            issue_date: issueDate,
            issued_at: issueDate,
            certificate_path: storagePath,
            certificate_url: publicUrl,
            certificate_email_status: mailStatus,
            certificate_email_sent_at: mailStatus.includes('sent') ? new Date().toISOString() : null,
            certificate_email_error: mailErrorStr,
            completion_date: new Date().toISOString()
        };

        let dbSaveErr = null;
        if (existingCert) {
            const { error: updErr } = await supabaseAdmin
                .from('certificates')
                .update(certDataSave)
                .eq('id', existingCert.id);
            dbSaveErr = updErr;
        } else {
            const { error: insErr } = await supabaseAdmin
                .from('certificates')
                .insert(certDataSave);
            dbSaveErr = insErr;
        }

        if (dbSaveErr) {
            console.warn(`[GEN_CERT] DB save warning (columns may not exist yet): ${dbSaveErr.message}`);
            // Fallback: If newer columns throw errors, try saving with legacy schema only (ignoring tracking fields)
            const isColumnOrCacheError =
                dbSaveErr.code === '42703' ||
                dbSaveErr.code === 'PGRST204' ||
                dbSaveErr.code === 'PGRST205' ||
                dbSaveErr.code === '23502' || // column not found/not null violation
                (dbSaveErr.message && (
                    dbSaveErr.message.includes('column') ||
                    dbSaveErr.message.includes('schema cache')
                ));

            if (isColumnOrCacheError) {
                console.log(`[GEN_CERT] Triggering legacy schema fallback...`);
                const legacySave = {
                    user_id: studentId,
                    student_id: studentId,
                    certificate_number: tokenCert,
                    certificate_id: tokenCert,
                    verification_code: verificationCode,
                    course_name: finalCourseName,
                    status: 'issued',
                    issue_date: issueDate,
                    issued_at: issueDate
                };

                if (existingCert) {
                    await supabaseAdmin.from('certificates').update(legacySave).eq('id', existingCert.id);
                } else {
                    await supabaseAdmin.from('certificates').insert(legacySave);
                }
            } else {
                throw dbSaveErr;
            }
        }

        console.log(`[GEN_CERT] Finished process successfully! Status: ${mailStatus}`);
        res.status(200).json({
            success: true,
            message: 'Certificate handled successfully.',
            certificateNumber: tokenCert,
            url: publicUrl,
            emailStatus: mailStatus,
            emailError: mailErrorStr
        });
    } catch (err) {
        console.error('[GEN_CERT] Server error:', err);
        res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
}
