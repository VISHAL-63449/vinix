import { jsPDF } from 'jspdf';
import { supabaseAdmin, getImageBase64, sendEmail, ensureBucketExists, getOrCreateInternship } from '../_utils.js';

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

    // Safe retrieval of applicationId from body, parsed query searchParams, or request query helper
    let lookupId = req.body?.applicationId || (req.query ? req.query.applicationId : null);
    if (!lookupId && req.url) {
        try {
            const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            lookupId = urlObj.searchParams.get('applicationId');
        } catch (e) { }
    }

    if (!lookupId) {
        res.status(400).json({ error: 'Missing applicationId parameter.' });
        return;
    }

    try {
        console.log(`[RESEND_API] Received resend trigger for: ${lookupId}`);

        // 1. Find existing application (by id UUID or text applicationId)
        let app = null;
        let isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lookupId);

        if (isUuid) {
            const { data } = await supabaseAdmin
                .from('internship_applications')
                .select('*')
                .eq('id', lookupId)
                .maybeSingle();
            app = data;
        }

        if (!app) {
            // Try matching by the custom camelCase field applicationId on database
            const { data } = await supabaseAdmin
                .from('internship_applications')
                .select('*')
                .eq('applicationId', lookupId)
                .maybeSingle();
            app = data;
        }

        if (!app) {
            // Decoupled / Fallback Lookup: check offer_letters table for custom VINIX-... ID
            const { data: offerRecord } = await supabaseAdmin
                .from('offer_letters')
                .select('student_id, internship_id')
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

        if (!app) {
            // Try matching by unique code from standard/legacy fields if present
            const { data } = await supabaseAdmin
                .from('internship_applications')
                .select('*')
                .eq('student_id', lookupId)
                .maybeSingle();
            app = data;
        }

        if (!app) {
            res.status(404).json({ error: `Application not found for lookup: ${lookupId}` });
            return;
        }

        // 2. Extract particulars
        const studentName = app.studentName || app.student_name;
        const studentEmail = app.studentEmail || app.email;
        const college = app.college;
        const department = app.department || app.course_branch;
        const internshipDomain = app.internshipDomain || app.domain;
        const finalDuration = app.duration || '1 Month';
        const studentId = app.studentId || app.student_id;
        let resolvedInternshipId = app.internship_id;

        // Verify email presence
        if (!studentEmail) {
            res.status(400).json({ error: 'Applicant student email is missing in the database.' });
            return;
        }

        // 3. Reuse existing Application ID
        const appId = app.applicationId || `VINIX-2026-${Math.floor(100000 + Math.random() * 900000)}`;

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
            console.log(`[RESEND_API] Internship track not found for ID: ${resolvedInternshipId}. Resolving via domain: ${internshipDomain} (${finalDuration})`);
            const resolved = await getOrCreateInternship(internshipDomain, finalDuration);
            internship = resolved;
            resolvedInternshipId = resolved.id;
            // Update the application record so it keeps this ID in the database
            await supabaseAdmin
                .from('internship_applications')
                .update({ internship_id: resolvedInternshipId })
                .eq('id', app.id);
        }

        const internshipTitle = internship?.title || 'Virtual Internship Program';

        // Est. dates
        const startDate = app.startDate ? new Date(app.startDate) : new Date(app.applied_at || app.created_at || Date.now());
        const endDate = app.endDate ? new Date(app.endDate) : new Date(startDate);
        if (!app.endDate) {
            const durationNum = parseInt(finalDuration) || 1;
            if (finalDuration.toLowerCase().includes('week')) {
                endDate.setDate(endDate.getDate() + durationNum * 7);
            } else {
                endDate.setMonth(endDate.getMonth() + durationNum);
            }
            endDate.setDate(endDate.getDate() - 3);
        }

        const formatDate = (d) => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
        };

        const formattedStart = formatDate(startDate);
        const formattedEnd = formatDate(endDate);

        // 4. Regenerate existing PDF or construct one dynamically
        console.log(`[RESEND_API] Compiling PDF Offer Letter for ${appId}...`);
        const logoBase64 = await getImageBase64('vinix-logo.png', req);
        const msmeBase64 = await getImageBase64('msme.jpeg', req);
        const stampBase64 = await getImageBase64('certificate-stamp.jpeg', req);
        const signBase64 = await getImageBase64('founder-sign.png', req);

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
        doc.text(appId, 195, 21, { align: "right" });

        doc.setTextColor(100, 116, 139);
        doc.setFontSize(7);
        doc.text("ISSUE DATE", 195, 27, { align: "right" });
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(9);
        const formattedIssueDate = new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
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
        doc.text(studentName || "Graduate", 24, 59);
        doc.text(",", 24 + doc.getTextWidth(studentName || "Graduate"), 59);

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
            ["Intern ID", appId],
            ["Duration", finalDuration],
            ["Commencement Date", (() => {
                const d = new Date(startDate);
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
            })()],
            ["Estimated Completion", (() => {
                const d = new Date(startDate);
                const num = parseInt(finalDuration) || 1;
                if (finalDuration.toLowerCase().includes('week')) {
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
            ["College / University", college]
        ];

        let currentY = tableY + 7;
        doc.setFontSize(8);
        rows.forEach((row, idx) => {
            // Draw background row borders
            doc.setDrawColor(226, 232, 240);
            doc.line(15, currentY, 195, currentY);

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

        const bullet1 = "1. Task Execution: You will be evaluated based on the functional completeness of the assigned tasks. You must submit weekly progress updates.";
        const bullet2 = "2. Code of Conduct: Plagiarism or any forms of professional misconduct will lead to immediate cancellation of your internship program.";
        const bullet3 = "3. Confidentiality: Any documentation, source code, or mock datasets shared during this program are strictly confidential.";
        const bullet4 = "4. Certification: An official Certificate of Internship Completion will be issued only upon successful submission and mentoring approval of all milestone tasks.";

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
            doc.addImage(msmeBase64, 'JPEG', 15, footY + 2, 14, 10);
        }

        doc.setTextColor(100, 116, 139);
        doc.setFontSize(7);
        doc.setFont('Helvetica', 'bold');
        doc.text("VINIX Technologies Private Limited", 105, footY + 4, { align: "center" });
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.text("UDYAM Registry: UDYAM-TN-21-0066185", 105, footY + 8, { align: "center" });
        doc.text("academic@vinix.com | www.vinix.online", 105, footY + 11, { align: "center" });

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

        // 5. Send Email
        const emailSubject = `Congratulations! Your Vinix Technology Internship Offer Letter – ${appId}`;
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
        const isLegacy = app.applicationId === undefined;

        if (!isLegacy) {
            // Update custom status columns on applications table
            await supabaseAdmin
                .from('internship_applications')
                .update({
                    offerLetterSent: mailStatus.includes('sent'),
                    offerLetterSentAt: mailStatus.includes('sent') ? new Date().toISOString() : null,
                    emailError: mailErrorStr,
                    status: 'Offer Letter Sent'
                })
                .eq('id', app.id);
        } else {
            // Update legacy columns
            await supabaseAdmin
                .from('internship_applications')
                .update({ status: 'approved' })
                .eq('id', app.id);

            // Also update offer_letters status
            const fallbackToken = `tok_offer_${Math.floor(100000 + Math.random() * 900000)}`;
            const fallbackPayload = {
                offer_letter_id: appId,
                student_name: studentName,
                student_email: studentEmail,
                status: 'ACCEPTED',
                verification_token: fallbackToken,
                issue_date: new Date().toISOString()
            };

            const { data: legacyOffer } = await supabaseAdmin
                .from('offer_letters')
                .select('id')
                .eq('student_id', studentId)
                .eq('internship_id', resolvedInternshipId)
                .maybeSingle();

            if (legacyOffer) {
                await supabaseAdmin.from('offer_letters').update(fallbackPayload).eq('id', legacyOffer.id);
            }
        }

        if (mailStatus === 'failed') {
            res.status(500).json({ error: 'Mail delivery failed', message: mailErrorStr });
        } else {
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
