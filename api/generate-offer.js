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
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const { applicationId, studentId, internshipId } = req.body;

    if (!applicationId && (!studentId || !internshipId)) {
        res.status(400).json({ error: 'Missing parameters. Provide applicationId or studentId and internshipId.' });
        return;
    }

    try {
        console.log(`[GEN_OFFER] Received request. AppID: ${applicationId}, StudID: ${studentId}, InternID: ${internshipId}`);

        // 1. Fetch the internship application record
        let app = null;
        if (applicationId) {
            const { data, error } = await supabaseAdmin
                .from('internship_applications')
                .select('*')
                .eq('id', applicationId)
                .maybeSingle();
            if (error) throw error;
            app = data;
        } else {
            const { data, error } = await supabaseAdmin
                .from('internship_applications')
                .select('*')
                .eq('student_id', studentId)
                .eq('internship_id', internshipId)
                .maybeSingle();
            if (error) throw error;
            app = data;
        }

        // If no application record exists, let's look up profile/internship details directly
        let sName = app?.student_name;
        let sEmail = app?.email;
        let sCollege = app?.college || 'Anna University, Chennai';
        let sDuration = app?.duration || '1 Month';
        let sDomain = app?.domain;
        let finalInternshipId = internshipId || app?.internship_id;
        let finalStudentId = studentId || app?.student_id;

        if (!app && (!finalStudentId || !finalInternshipId)) {
            res.status(404).json({ error: 'Internship application or details not found.' });
            return;
        }

        // Fetch User profile details if missing in application
        if (!sName || !sEmail) {
            const { data: profile, error: pErr } = await supabaseAdmin
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

        // Fetch internship track details
        const { data: internship, error: iErr } = await supabaseAdmin
            .from('internships')
            .select('title, duration')
            .eq('id', finalInternshipId)
            .maybeSingle();
        if (iErr) throw iErr;

        const internshipTitle = internship?.title || 'Virtual Internship Program';
        sDuration = sDuration || internship?.duration || '1 Month';

        // 2. IDEMPOTENCY CHECK
        // Check if offer letter already generated
        const { data: existingOffer, error: oErr } = await supabaseAdmin
            .from('offer_letters')
            .select('*')
            .eq('student_id', finalStudentId)
            .eq('internship_id', finalInternshipId)
            .maybeSingle();

        if (existingOffer && existingOffer.offer_letter_url && existingOffer.offer_email_status === 'sent') {
            console.log(`[GEN_OFFER] Offer letter already complete: ${existingOffer.offer_letter_id} for ${sEmail}. Returning cached response.`);
            res.status(200).json({ success: true, alreadyGenerated: true, data: existingOffer });
            return;
        }

        console.log(`[GEN_OFFER] Generating new Offer Letter PDF for ${sName} (${sEmail})...`);

        // Generate Offer Letter IDs
        const tokenOffer = existingOffer?.offer_letter_id || `VINIX-OFFER-${Math.floor(1000 + Math.random() * 9000)}`;
        const verificationToken = existingOffer?.verification_token || `tok_offer_${Math.floor(100000 + Math.random() * 900000)}`;
        const issueDate = existingOffer?.issue_date || new Date().toISOString();

        // 3. Load Images for PDF
        const logoBase64 = await getImageBase64('vinix-logo.png', req);
        const msmeBase64 = await getImageBase64('msme.jpeg', req);
        const stampBase64 = await getImageBase64('certificate-stamp.jpeg', req);
        const signBase64 = await getImageBase64('founder-sign.png', req);

        // 4. Create Portrait A4 PDF using jsPDF
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        // Background Watermark (tilted)
        doc.setTextColor(241, 245, 249); // slate-100 equivalent
        doc.setFontSize(26);
        doc.setFont('Helvetica', 'bold');
        doc.saveGraphicsState();
        // Simple tiled watermarks in background
        for (let y = 50; y < 280; y += 80) {
            doc.text("VINIX TECHNOLOGIES", 105, y, { align: "center", angle: 30 });
        }
        doc.restoreGraphicsState();

        // Frames / Borders
        // Outer border
        doc.setDrawColor(15, 41, 66); // #0f2942
        doc.setLineWidth(1.0);
        doc.rect(8, 8, 194, 281);

        // Inner border
        doc.setDrawColor(204, 163, 83); // #cca353
        doc.setLineWidth(0.4);
        doc.rect(10, 10, 190, 277);

        // HEADER
        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', 15, 14, 14, 14);
        }
        doc.setTextColor(15, 41, 66);
        doc.setFontSize(20);
        doc.setFont('Helvetica', 'bold');
        doc.text("VINIX", 32, 20);

        doc.setTextColor(204, 163, 83);
        doc.setFontSize(8);
        doc.text("Empowering Future Innovators", 32, 24);

        doc.setTextColor(100, 116, 139);
        doc.setFontSize(7);
        doc.setFont('Helvetica', 'normal');
        doc.text("www.vinixtech.com | academic@vinix.com", 15, 33);

        // Meta (ID, Issue Date) - Right aligned
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(7);
        doc.setFont('Helvetica', 'bold');
        doc.text("INTERNSHIP ID", 195, 17, { align: "right" });
        doc.setTextColor(15, 23, 42); // slate-900
        doc.setFontSize(9);
        doc.text(tokenOffer, 195, 21, { align: "right" });

        doc.setTextColor(100, 116, 139);
        doc.setFontSize(7);
        doc.text("ISSUE DATE", 195, 27, { align: "right" });
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(9);
        const formattedIssueDate = new Date(issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.text(formattedIssueDate, 195, 31, { align: "right" });

        // Divider Line
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.5);
        doc.line(15, 36, 195, 36);

        // BODY TITLE
        doc.setTextColor(15, 41, 66);
        doc.setFontSize(14);
        doc.setFont('Helvetica', 'bold');
        doc.text("INTERNSHIP OFFER LETTER", 15, 45);

        doc.setTextColor(204, 163, 83);
        doc.setFontSize(8);
        doc.text(`Date: ${formattedIssueDate}`, 15, 50);

        // Greetings
        doc.setTextColor(51, 65, 85); // slate-700
        doc.setFontSize(9);
        doc.setFont('Helvetica', 'normal');
        doc.text("Dear ", 15, 59);
        doc.setFont('Helvetica', 'bold');
        doc.text(sName || "Graduate", 24, 59);
        doc.text(",", 24 + doc.getTextWidth(sName || "Graduate"), 59);

        // Paragraphs
        doc.setFont('Helvetica', 'normal');
        const p1 = `We are delighted to offer you the position of Virtual Intern – ${internshipTitle} at Vinix Technologies. After reviewing your application, we are confident that your skills and enthusiasm make you a valuable addition to our program.`;
        const p2 = `Your virtual internship details and key particulars are finalized as follows:`;

        const linesP1 = doc.splitTextToSize(p1, 180);
        doc.text(linesP1, 15, 65);

        const startYDetails = 65 + (linesP1.length * 5) + 3;
        doc.text(p2, 15, startYDetails);

        // Particulars Table drawing
        const tableY = startYDetails + 5;
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(15, 41, 66);
        doc.rect(15, tableY, 180, 7, 'F'); // Header rectangle

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('Helvetica', 'bold');
        doc.text("INTERNSHIP PROGRAM PARTICULARS", 18, tableY + 5);

        // Rows
        const rows = [
            ["Internship Track", internshipTitle],
            ["Intern ID", tokenOffer],
            ["Duration", sDuration],
            ["Commencement Date", (() => {
                const d = new Date(issueDate);
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
            })()],
            ["Estimated Completion", (() => {
                const d = new Date(issueDate);
                const num = parseInt(sDuration) || 1;
                if (sDuration.toLowerCase().includes('week')) {
                    d.setDate(d.getDate() + num * 7);
                } else {
                    d.setMonth(d.getMonth() + num);
                }
                d.setDate(d.getDate() - 3);
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
            })()],
            ["Stipend Details", "Unpaid (Performance-Based Internship)"],
            ["Location & Model", "Remote / Virtual"],
            ["College / University", sCollege]
        ];

        let currentY = tableY + 7;
        doc.setFontSize(8);
        rows.forEach((row, idx) => {
            // Draw background row borders
            doc.setDrawColor(226, 232, 240);
            doc.line(15, currentY, 195, currentY);

            // Check if it's the last row
            const isLast = idx === rows.length - 1;

            // Cell contents
            doc.setTextColor(71, 85, 105); // slate-600
            doc.setFont('Helvetica', 'bold');
            doc.text(row[0], 18, currentY + 5);

            doc.setTextColor(15, 23, 42); // slate-900
            doc.setFont('Helvetica', 'bold');
            doc.text(row[1], 80, currentY + 5);

            currentY += 7;
        });

        // Draw outline of table
        doc.setDrawColor(226, 232, 240);
        doc.rect(15, tableY, 180, currentY - tableY);
        doc.line(75, tableY + 7, 75, currentY); // mid vertical line

        // Terms & Conditions block
        let termsY = currentY + 5;
        doc.setFillColor(248, 250, 252); // slate-50
        doc.setDrawColor(226, 232, 240);
        doc.rect(15, termsY, 180, 26, 'FD');

        doc.setTextColor(15, 41, 66);
        doc.setFontSize(8);
        doc.setFont('Helvetica', 'bold');
        doc.text("GENERAL TERMS & CONDITIONS OF INTERNSHIP:", 18, termsY + 5);

        doc.setTextColor(51, 65, 85);
        doc.setFontSize(7.5);
        doc.setFont('Helvetica', 'normal');

        const bullet1 = "1. Task Execution: You will be evaluated based on the functional completeness of the assigned tasks.";
        const bullet2 = "2. Code of Conduct: Plagiarism or any forms of professional misconduct will lead to cancelation.";
        const bullet3 = "3. Confidentiality: Any documentation, source code, or mock datasets are strictly confidential.";
        const bullet4 = "4. Certification: Completion Certificate will be issued only upon successful submission and mentor approval.";

        doc.text(bullet1, 18, termsY + 9);
        doc.text(bullet2, 18, termsY + 13);
        doc.text(bullet3, 18, termsY + 17);
        doc.text(bullet4, 18, termsY + 21);

        // Certificate Section
        let certY = termsY + 29;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.rect(15, certY, 180, 15, 'FD');

        doc.setTextColor(15, 41, 66);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.text("CERTIFICATE OF COMPLETION", 18, certY + 5);

        doc.setTextColor(51, 65, 85);
        doc.setFont('Helvetica', 'normal');
        const certDesc = "Upon successful completion of the internship and fulfillment of all assigned tasks, you will receive a Certificate of Internship with QR-code verification for authenticity.";
        const linesCertDesc = doc.splitTextToSize(certDesc, 172);
        doc.text(linesCertDesc, 18, certY + 9);

        // Outro Paragraph
        const outro = "Please return the signed copy of this letter as a token of your formal acceptance of this offer. We look forward to a mutually rewarding learning experience.";
        const linesOutro = doc.splitTextToSize(outro, 180);
        doc.text(linesOutro, 15, certY + 24);

        // Signatures Section (at y ~235)
        const sigY = 236;
        if (stampBase64) {
            doc.addImage(stampBase64, 'JPEG', 20, sigY, 18, 18);
        }
        doc.setTextColor(148, 163, 184); // slate-400
        doc.setFontSize(6.5);
        doc.setFont('Helvetica', 'bold');
        doc.text("COMPANY SEAL", 15, sigY + 21);

        if (signBase64) {
            doc.addImage(signBase64, 'PNG', 150, sigY + 4, 25, 9);
        }
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(8);
        doc.text("Vishal R", 195, sigY + 16, { align: "right" });
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(6.5);
        doc.text("DIRECTOR – ACADEMIC OPERATIONS", 195, sigY + 21, { align: "right" });

        // Footer Section
        const footY = sigY + 28;
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.4);
        doc.line(15, footY, 195, footY);

        if (msmeBase64) {
            doc.addImage(msmeBase64, 'JPEG', 15, footY + 2, 10, 10);
        }

        doc.setTextColor(100, 116, 139);
        doc.setFontSize(7);
        doc.setFont('Helvetica', 'bold');
        doc.text("VINIX Technologies Private Limited", 105, footY + 4, { align: "center" });
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.text("UDYAM Registry: UDYAM-TN-21-0066185", 105, footY + 8, { align: "center" });
        doc.text("academic@vinix.com | www.vinix.online", 105, footY + 11, { align: "center" });

        // Compile PDF into Buffer
        const pdfOutput = doc.output('arraybuffer');
        const pdfBuffer = Buffer.from(pdfOutput);

        console.log(`[GEN_OFFER] PDF compiled successfully (${pdfBuffer.length} bytes). Uploading...`);

        // 5. Upload to Supabase Storage bucket
        await ensureBucketExists();

        const storagePath = `offer-letters/${tokenOffer}_${Date.now()}.pdf`;
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
        console.log(`[GEN_OFFER] Uploaded to storage. Public URL: ${publicUrl}`);

        // 6. Send Email to student with attachment
        const emailSubject = `Internship Offer Letter - Virtual Intern: ${internshipTitle} - VINIX Technologies`;
        const emailBody = `Dear ${sName},\n\n` +
            `Congratulations! We are pleased to offer you the position of Virtual Intern in ${internshipTitle} at VINIX Technologies.\n\n` +
            `Please find your official Internship Offer Letter attached to this email. You can verify your credentials or view your offer letter status anytime at ${publicUrl} or via the Vinix Student Portal.\n\n` +
            `Particulars:\n` +
            `- Intern ID: ${tokenOffer}\n` +
            `- Duration: ${sDuration}\n` +
            `- Start Date: ${formattedIssueDate}\n\n` +
            `We look forward to having you work with us!\n\n` +
            `Best regards,\n` +
            `Academic Council\n` +
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
                pdfName: `${tokenOffer}.pdf`
            });
            if (mailResult?.mock) {
                mailStatus = 'mock_sent';
            }
        } catch (mErr) {
            console.error('[GEN_OFFER] Email dispatch failed:', mErr.message);
            mailStatus = 'failed';
            mailErrorStr = mErr.message;
        }

        // 7. Update offer_letters table
        // Find if we need to insert or update
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
            console.warn(`[GEN_OFFER] DB save warning (columns may not exist yet): ${dbSaveErr.message}`);
            // Fallback: If newer columns throw errors, try saving with legacy schema only (ignoring tracking fields)
            const isColumnOrCacheError =
                dbSaveErr.code === '42703' ||
                dbSaveErr.code === 'PGRST204' ||
                dbSaveErr.code === 'PGRST205' ||
                dbSaveErr.code === '23502' || // column not found/not null violation fallback
                (dbSaveErr.message && (
                    dbSaveErr.message.includes('column') ||
                    dbSaveErr.message.includes('schema cache')
                ));

            if (isColumnOrCacheError) {
                console.log(`[GEN_OFFER] Triggering legacy schema fallback...`);
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
            } else {
                throw dbSaveErr;
            }
        }

        console.log(`[GEN_OFFER] Finished process successfully! Status: ${mailStatus}`);
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
