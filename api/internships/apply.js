import { jsPDF } from 'jspdf';
import { supabaseAdmin, getImageBase64, sendEmail, ensureBucketExists } from '../_utils.js';

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

    // 1. Validate student information
    if (!studentId || !internshipId || !studentName || !studentEmail || !college || !department || !internshipDomain || !duration) {
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

        // Get internship track details
        const { data: internship, error: iErr } = await supabaseAdmin
            .from('internships')
            .select('title, duration')
            .eq('id', internshipId)
            .maybeSingle();

        if (iErr) throw iErr;
        const internshipTitle = internship?.title || 'Virtual Internship Program';
        const finalDuration = duration || internship?.duration || '1 Month';

        // 2. Duplicate Protection
        const { data: existingApp, error: appLookError } = await supabaseAdmin
            .from('internship_applications')
            .select('*')
            .eq('student_id', studentId)
            .eq('internship_id', internshipId)
            .maybeSingle();

        if (existingApp) {
            let resolvedAppId = existingApp.applicationId;
            if (!resolvedAppId) {
                const { data: offerData } = await supabaseAdmin
                    .from('offer_letters')
                    .select('offer_letter_id')
                    .eq('student_id', studentId)
                    .eq('internship_id', internshipId)
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
            internship_id: internshipId,
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
                internship_id: internshipId,
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
            .eq('internship_id', internshipId)
            .maybeSingle();

        if (!existingEnroll) {
            await supabaseAdmin.from('enrollments').insert({
                student_id: studentId,
                user_id: studentId,
                internship_id: internshipId,
                status: 'active',
                progress: 0
            });
        }

        const { data: existingInternEnroll } = await supabaseAdmin
            .from('internship_enrollments')
            .select('id')
            .eq('student_id', studentId)
            .eq('internship_id', internshipId)
            .maybeSingle();

        if (!existingInternEnroll) {
            await supabaseAdmin.from('internship_enrollments').insert({
                student_id: studentId,
                user_id: studentId,
                internship_id: internshipId,
                status: 'active',
                progress: 0
            });
        }

        // Seed task milestones
        const { data: dbTasks } = await supabaseAdmin
            .from('internship_tasks')
            .select('id, task_number')
            .eq('internship_id', internshipId);

        if (dbTasks && dbTasks.length > 0) {
            const taskInserts = dbTasks.map(t => ({
                user_id: studentId,
                student_id: studentId,
                internship_id: internshipId,
                task_id: t.id,
                status: t.task_number === 1 ? 'available' : 'locked'
            }));
            await supabaseAdmin.from('task_progress').insert(taskInserts);
        }

        // 5. Generate Personalized Offer Letter PDF
        console.log(`[APPLY_API] Starting PDF Generation for ${appId}...`);
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
                internship_id: internshipId,
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
                .eq('internship_id', internshipId)
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
