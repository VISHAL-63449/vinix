import { jsPDF } from 'jspdf';
import { supabaseAdmin, getImageBase64, sendEmail, ensureBucketExists } from './_utils.js';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'POST');
        res.status(200).end();
        return;
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { enrollmentId } = req.body;
    if (!enrollmentId) return res.status(400).json({ error: 'Missing enrollmentId' });

    try {
        console.log(`[APPROVE_CERT] Started for enrollment: ${enrollmentId}`);
        // 1. Validate Enrollment
        const { data: enrollData, error: eErr } = await supabaseAdmin
            .from('internship_enrollments')
            .select('*, internships(title)')
            .eq('id', enrollmentId)
            .maybeSingle();

        if (eErr || !enrollData) return res.status(404).json({ error: 'Enrollment not found' });



        const appStatusInfo = enrollData.application_status || '';

        if (appStatusInfo.startsWith('ISSUED:')) {
            return res.status(400).json({ error: 'Certificate already issued' });
        }


        const studentId = enrollData.user_id;

        // Fetch User profile details (name and email)
        const { data: profile, error: pErr } = await supabaseAdmin
            .from('profiles')
            .select('full_name, email')
            .eq('id', studentId)
            .maybeSingle();

        if (pErr) throw pErr;
        const sName = profile.full_name || 'Vinix Graduate';
        const sEmail = profile.email;
        const finalCourseName = enrollData.internships?.title || 'Virtual Internship Program';

        // 2. Generate PDF using jsPDF (reusing standard format)
        const tokenCert = `VINIX-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const issueDate = new Date().toISOString();

        const logoBase64 = await getImageBase64('vinix-logo.png', req);
        const msmeBase64 = await getImageBase64('msme.jpeg', req);
        const stampBase64 = await getImageBase64('certificate-stamp.jpeg', req);
        const signBase64 = await getImageBase64('founder-sign.png', req);

        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });

        doc.setDrawColor(15, 41, 66); doc.setLineWidth(1.2); doc.rect(8, 8, 281, 194);
        doc.setDrawColor(204, 163, 83); doc.setLineWidth(0.5); doc.rect(10, 10, 277, 190);

        if (logoBase64) doc.addImage(logoBase64, 'PNG', 18, 16, 15, 15);
        doc.setTextColor(15, 41, 66); doc.setFontSize(26); doc.setFont('Helvetica', 'bold');
        doc.text("VINIX", 148, 22, { align: "center" });
        doc.setTextColor(204, 163, 83); doc.setFontSize(9);
        doc.text("Empowering Future Innovators", 148, 27, { align: "center" });
        if (msmeBase64) doc.addImage(msmeBase64, 'JPEG', 259, 16, 18, 18);

        doc.setTextColor(15, 41, 66); doc.setFontSize(30); doc.text("CERTIFICATE", 148, 48, { align: "center" });
        doc.setTextColor(204, 163, 83); doc.setFontSize(13); doc.text("OF INTERNSHIP COMPLETION", 148, 55, { align: "center" });

        doc.setTextColor(100, 116, 139); doc.setFontSize(11); doc.setFont('Helvetica', 'normal');
        doc.text("This certificate is proudly presented to", 148, 70, { align: "center" });

        doc.setTextColor(15, 23, 42); doc.setFontSize(24); doc.setFont('Helvetica', 'bold');
        doc.text(sName.toUpperCase(), 148, 86, { align: "center" });

        doc.setTextColor(100, 116, 139); doc.setFontSize(11); doc.setFont('Helvetica', 'normal');
        const descText = `for successfully completing the task-based virtual internship program in ${finalCourseName} at VINIX Technologies, demonstrating dedication, technical skill, and professional excellence throughout the program.`;
        doc.text(doc.splitTextToSize(descText, 210), 148, 100, { align: "center" });

        const footerY = 145;
        doc.setTextColor(15, 41, 66); doc.setFontSize(11); doc.setFont('Helvetica', 'bold');
        const formattedDate = new Date(issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.text(formattedDate, 38, footerY + 10, { align: "left" });
        doc.setDrawColor(203, 213, 225); doc.setLineWidth(0.4); doc.line(18, footerY + 13, 88, footerY + 13);
        doc.setTextColor(100, 116, 139); doc.setFontSize(9); doc.text("Date of Issuance", 18, footerY + 18, { align: "left" });

        if (stampBase64) doc.addImage(stampBase64, 'JPEG', 137, footerY - 5, 20, 20);
        doc.setTextColor(71, 85, 105); doc.setFontSize(8); doc.text(`Intern ID: VINIX-${tokenCert.split('-').pop()}`, 148, footerY + 19, { align: "center" });

        if (signBase64) doc.addImage(signBase64, 'PNG', 228, footerY, 26, 9);
        doc.line(208, footerY + 13, 278, footerY + 13);
        doc.setTextColor(100, 116, 139); doc.setFontSize(9); doc.text("Vishal R", 278, footerY + 18, { align: "right" });
        doc.text(`Certificate ID: ${tokenCert}`, 278, footerY + 26, { align: "right" });

        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

        await ensureBucketExists();
        const storagePath = `certificates/${tokenCert}_${Date.now()}.pdf`;
        const { error: uploadErr } = await supabaseAdmin.storage
            .from('documents')
            .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true });

        if (uploadErr) throw uploadErr;
        const publicUrl = supabaseAdmin.storage.from('documents').getPublicUrl(storagePath).data?.publicUrl || '';

        // 3. Send Email
        const emailSubject = `Internship Completion Certificate - Vinix Technology`;
        const emailBody = `Dear ${sName},\n\nCongratulations!\n\nYou have successfully completed your internship at Vinix Technology.\nYour Internship Completion Certificate has been verified and issued.\n\nCertificate ID: ${tokenCert}\nInternship Domain: ${finalCourseName}\nIssue Date: ${formattedDate}\n\nYour certificate is attached to this email and available in your student dashboard.\n\nRegards,\nVinix Technology\nwww.vinix.online`;

        const htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #0f172a; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">VINIX TECHNOLOGY</h1>
            </div>
            <div style="padding: 40px 30px; background-color: #ffffff;">
                <p style="font-size: 16px; margin-bottom: 20px;">Dear <b>${sName}</b>,</p>
                <h2 style="color: #10b981; font-size: 22px; margin-bottom: 20px;">Congratulations! 🎉</h2>
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">You have successfully completed your task-based internship at Vinix Technology. Your dedication and hard work have been outstanding.</p>
                
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                    <p style="margin: 0 0 10px 0; font-size: 14px;"><span style="color: #64748b; font-weight: bold; text-transform: uppercase;">Certificate ID:</span> <br/><span style="font-size: 16px; color: #0f172a; font-family: monospace; font-weight: bold;">${tokenCert}</span></p>
                    <p style="margin: 0 0 10px 0; font-size: 14px;"><span style="color: #64748b; font-weight: bold; text-transform: uppercase;">Internship Domain:</span> <br/><span style="font-size: 16px; color: #0f172a; font-weight: bold;">${finalCourseName}</span></p>
                    <p style="margin: 0; font-size: 14px;"><span style="color: #64748b; font-weight: bold; text-transform: uppercase;">Issue Date:</span> <br/><span style="font-size: 16px; color: #0f172a; font-weight: bold;">${formattedDate}</span></p>
                </div>
                
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">Your verified certificate of completion is attached to this email. You can also securely access and verify it anytime from your student dashboard via our portal.</p>
                
                <div style="text-align: center;">
                    <a href="https://interns.vinix.online/verify/${tokenCert}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 15px;">Verify Certificate Online</a>
                </div>
            </div>
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Vinix Technology. All rights reserved.</p>
                <p style="color: #64748b; font-size: 12px; margin: 5px 0 0 0;"><a href="https://vinix.online" style="color: #3b82f6; text-decoration: none;">www.vinix.online</a></p>
            </div>
        </div>`;

        let mailStatus = 'sent';
        try {
            await sendEmail({ email: sEmail, name: sName, subject: emailSubject, body: emailBody, htmlBody, pdfBuffer, pdfName: `${tokenCert}.pdf` });
        } catch (mErr) {
            mailStatus = 'failed';
            console.error('[APPROVE_CERT] Email failed:', mErr.message);
        }

        // 4. Update Database Statuses
        try {
            await supabaseAdmin.from('certificates').insert({
                user_id: studentId,
                student_id: studentId,
                certificate_number: tokenCert,
                certificate_id: tokenCert,
                course_name: finalCourseName,
                status: 'issued',
                issue_date: issueDate,
                issued_at: issueDate,
                certificate_path: storagePath,
                certificate_url: publicUrl,
                certificate_email_status: mailStatus
            });
        } catch (e) {
            // Ignore fallback errors for legacy compat
        }

        await supabaseAdmin
            .from('internship_enrollments')
            .update({ application_status: `ISSUED:${appStatusInfo.split(':')[1] || ''}` })
            .eq('id', enrollmentId);

        res.status(200).json({ success: true, certificateNumber: tokenCert });
    } catch (err) {
        console.error('[APPROVE_CERT] Server error:', err);
        res.status(500).json({ error: err.message });
    }
}
