import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { jsPDF } from 'jspdf';

// Auto-load .env for local runtime or API execution
try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                let val = (match[2] || '').trim();
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                if (!process.env[match[1]]) {
                    process.env[match[1]] = val;
                }
            }
        });
    }
} catch (e) { }

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMyNjUyNywiZXhwIjoyMTAyOTAyNTI3fQ.dC2HhQgzBrE5uF4uKqbtU9rPL_4vfyKKhujWIZgxBb0';

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

// Robust function to get base64 image representation
export async function getImageBase64(fileName, req) {
    // 1. Try local filesystem options first
    const pathsToSearch = [
        path.join(process.cwd(), 'public', fileName),
        path.join(process.cwd(), 'dist', fileName),
        path.join(process.cwd(), fileName),
        path.join(process.cwd(), '..', 'public', fileName),
        path.join(process.cwd(), 'vinix', 'public', fileName)
    ];

    for (const p of pathsToSearch) {
        try {
            if (fs.existsSync(p)) {
                const ext = path.extname(fileName).replace('.', '').toLowerCase();
                const mimeType = ext === 'jpg' ? 'jpeg' : ext;
                const buffer = fs.readFileSync(p);
                return `data:image/${mimeType};base64,${buffer.toString('base64')}`;
            }
        } catch (e) {
            console.warn(`Local file read failed for ${p}:`, e.message);
        }
    }

    // 2. Try fetching from URL/Origin if request context is provided
    if (req) {
        try {
            const host = req.headers.host || 'localhost:5173';
            const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
            const origin = req.headers.origin || `${protocol}://${host}`;
            const fileUrl = new URL(fileName, origin).toString();

            console.log(`Attempting to fetch image asset via HTTP fallback: ${fileUrl}`);
            const response = await fetch(fileUrl);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const ext = path.extname(fileName).replace('.', '').toLowerCase();
                const mimeType = ext === 'jpg' ? 'jpeg' : ext;
                return `data:image/${mimeType};base64,${buffer.toString('base64')}`;
            }
        } catch (e) {
            console.warn(`HTTP fetch fallback failed for ${fileName}:`, e.message);
        }
    }

    // 3. Last resort: Try fetching from standard production base URL
    try {
        const fallBackUrl = `https://www.vinix.online/${fileName}`;
        const response = await fetch(fallBackUrl);
        if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const ext = path.extname(fileName).replace('.', '').toLowerCase();
            const mimeType = ext === 'jpg' ? 'jpeg' : ext;
            return `data:image/${mimeType};base64,${buffer.toString('base64')}`;
        }
    } catch (e) {
        console.warn(`Production CDN fetch failed for ${fileName}:`, e.message);
    }

    return null;
}

// Ensure Supabase Storage bucket exists
export async function ensureBucketExists() {
    try {
        const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
        if (listError) throw listError;

        const exists = buckets.some(b => b.name === 'documents');
        if (!exists) {
            console.log('Documents bucket not found. Creating bucket...');
            const { error: createError } = await supabaseAdmin.storage.createBucket('documents', {
                public: true,
                fileSizeLimit: 10485760, // 10MB
                allowedMimeTypes: ['application/pdf']
            });
            if (createError) {
                console.error('Failed to create documents bucket:', createError.message);
            } else {
                console.log('Documents bucket created successfully.');
            }
        }
    } catch (e) {
        console.error('Error ensuring bucket exists:', e.message);
    }
}

// Mailer Helper
export async function sendEmail({ email, name, subject, body, htmlBody, pdfBuffer, pdfName }) {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT) || 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || 'VINIX Academic Council <academic@vinix.online>';

    if (!host || !user || !pass) {
        console.log(`[MAIL MOCK] Mail configured to mock mode (SMTP credentials missing). Logging payload:`);
        console.log(` - To: ${name} <${email}>`);
        console.log(` - Subject: ${subject}`);
        console.log(` - Attachment: ${pdfName} (${pdfBuffer ? pdfBuffer.length : 0} bytes)`);
        console.log(`-----------------------------------------`);
        if (htmlBody) {
            console.log("[HTML PAYLOAD USED]");
        } else {
            console.log(body);
        }
        console.log(`-----------------------------------------`);
        return { mock: true, recipient: email };
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    });

    const mailOptions = {
        from,
        to: email,
        subject,
        text: body,
        html: htmlBody || (body ? body.replace(/\n/g, '<br>') : '')
    };

    if (pdfBuffer && pdfName) {
        mailOptions.attachments = [
            {
                filename: pdfName,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ];
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAIL SUCCESS] Email sent to ${email}. MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
}

// Generates the authentic, official Offer Letter PDF matching the verified design
export async function createOfferLetterPdfDoc({
    studentName,
    tokenOffer,
    internshipTitle,
    duration,
    college,
    issueDate,
    req
}) {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
    });

    const sName = studentName || 'Intern';
    const sTrack = internshipTitle || 'Virtual Internship Program';
    const sDuration = duration || '1 Month';
    const sCollege = college || 'Anna University, Chennai';
    const sIssueDate = issueDate ? new Date(issueDate) : new Date();

    const logoBase64 = (await getImageBase64('vinix-title.png', req)) || (await getImageBase64('vinix-logo.png', req));
    const msmeBase64 = await getImageBase64('msme.jpeg', req);
    const skyrovixBase64 = await getImageBase64('skyrovix.jpeg', req);
    const yrnovatechBase64 = await getImageBase64('yrnovatech.png', req);
    const stampBase64 = await getImageBase64('certificate-stamp.jpeg', req);
    const signBase64 = await getImageBase64('founder-sign.png', req);

    // Background Watermark (tilted)
    doc.setTextColor(241, 245, 249);
    doc.setFontSize(26);
    doc.setFont('Helvetica', 'bold');
    doc.saveGraphicsState();
    for (let y = 50; y < 280; y += 80) {
        doc.text("VINIX TECHNOLOGIES", 105, y, { align: "center", angle: 30 });
    }
    doc.restoreGraphicsState();

    // Frames / Borders
    // Outer border (Navy #0f2942)
    doc.setDrawColor(15, 41, 66);
    doc.setLineWidth(1.0);
    doc.rect(8, 8, 194, 281);

    // Inner border (Gold #cca353)
    doc.setDrawColor(204, 163, 83);
    doc.setLineWidth(0.4);
    doc.rect(10, 10, 190, 277);

    // HEADER
    if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 15, 14, 14, 14);
    }
    // Vertical divider line next to logo
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(31, 14, 31, 28);

    doc.setTextColor(15, 41, 66);
    doc.setFontSize(18);
    doc.setFont('Helvetica', 'bold');
    doc.text("VINIX", 34, 20);

    doc.setTextColor(2, 132, 199); // Sky blue #0284c7
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'bold');
    doc.text("Empowering Future Innovators", 34, 25);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont('Helvetica', 'normal');
    doc.text("www.vinix.online | academic@vinix.online", 15, 33);

    // Meta (ID, Issue Date) - Right aligned
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont('Helvetica', 'bold');
    doc.text("INTERNSHIP ID", 195, 17, { align: "right" });
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.text(tokenOffer, 195, 21, { align: "right" });

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.text("ISSUE DATE", 195, 27, { align: "right" });
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    const formattedIssueDate = sIssueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(formattedIssueDate, 195, 31, { align: "right" });

    // Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 36, 195, 36);

    // BODY TITLE
    doc.setTextColor(15, 41, 66);
    doc.setFontSize(13);
    doc.setFont('Helvetica', 'bold');
    doc.text("INTERNSHIP OFFER LETTER", 15, 44);

    doc.setTextColor(204, 163, 83);
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'bold');
    doc.text(`Date: ${formattedIssueDate}`, 15, 49);

    // Greetings
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'normal');
    doc.text("Dear ", 15, 57);
    const dearWidth = doc.getTextWidth("Dear ");
    doc.setFont('Helvetica', 'bold');
    const cleanName = (sName || 'Intern').trim();
    doc.text(`${cleanName},`, 15 + dearWidth, 57);

    // Paragraphs
    doc.setFont('Helvetica', 'normal');
    const p1 = `We are delighted to offer you the position of Virtual Intern – ${sTrack} at Vinix Technologies. After reviewing your application, we are confident that your skills and enthusiasm make you a valuable addition to our program.`;
    const p2 = `Your virtual internship details and key particulars are finalized as follows:`;

    const linesP1 = doc.splitTextToSize(p1, 180);
    doc.text(linesP1, 15, 63);

    const startYDetails = 63 + (linesP1.length * 4.5) + 2;
    doc.text(p2, 15, startYDetails);

    // Dates calculation
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedCommence = `${String(sIssueDate.getDate()).padStart(2, '0')}-${months[sIssueDate.getMonth()]}-${sIssueDate.getFullYear()}`;

    const dEnd = new Date(sIssueDate);
    const num = parseInt(sDuration) || 1;
    if (sDuration.toLowerCase().includes('week')) {
        dEnd.setDate(dEnd.getDate() + num * 7);
    } else {
        dEnd.setMonth(dEnd.getMonth() + num);
    }
    dEnd.setDate(dEnd.getDate() - 3);
    const formattedEnd = `${String(dEnd.getDate()).padStart(2, '0')}-${months[dEnd.getMonth()]}-${dEnd.getFullYear()}`;

    // Particulars Table drawing
    const tableY = startYDetails + 4;
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(15, 41, 66);
    doc.rect(15, tableY, 180, 6.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('Helvetica', 'bold');
    doc.text("INTERNSHIP PROGRAM PARTICULARS", 18, tableY + 4.5);

    const rows = [
        ["Internship Track", sTrack],
        ["Intern ID", tokenOffer],
        ["Duration", sDuration],
        ["Commencement Date", formattedCommence],
        ["Estimated Completion", formattedEnd],
        ["Stipend Details", "Unpaid (Performance-Based Internship)"],
        ["Location & Model", "Remote / Virtual"],
        ["College / University", sCollege]
    ];

    let currentY = tableY + 6.5;
    doc.setFontSize(7.5);
    rows.forEach(row => {
        doc.setDrawColor(226, 232, 240);
        doc.line(15, currentY, 195, currentY);

        doc.setTextColor(71, 85, 105);
        doc.setFont('Helvetica', 'bold');
        doc.text(row[0], 18, currentY + 4.5);

        doc.setTextColor(15, 23, 42);
        doc.setFont('Helvetica', 'bold');
        doc.text(String(row[1] || ''), 80, currentY + 4.5);

        currentY += 6.5;
    });

    // Outline of table
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, tableY, 180, currentY - tableY);
    doc.line(75, tableY + 6.5, 75, currentY);

    // Terms & Conditions block
    let termsY = currentY + 4;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, termsY, 180, 24, 'FD');

    doc.setTextColor(15, 41, 66);
    doc.setFontSize(7.5);
    doc.setFont('Helvetica', 'bold');
    doc.text("GENERAL TERMS & CONDITIONS OF INTERNSHIP:", 18, termsY + 4.5);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(7);
    doc.setFont('Helvetica', 'normal');

    const bullet1 = "1. Task Execution: You will be evaluated based on the functional completeness of the assigned tasks. You must submit weekly progress updates.";
    const bullet2 = "2. Code of Conduct: Plagiarism or any forms of professional misconduct will lead to immediate cancellation of your internship program.";
    const bullet3 = "3. Confidentiality: Any documentation, source code, or mock datasets shared during this program are strictly confidential.";
    const bullet4 = "4. Certification: An official Certificate of Internship Completion will be issued only upon successful submission and mentoring approval of all milestone tasks.";

    doc.text(bullet1, 18, termsY + 8.5);
    doc.text(bullet2, 18, termsY + 12.5);
    doc.text(bullet3, 18, termsY + 16.5);
    doc.text(bullet4, 18, termsY + 20.5);

    // Certificate Section
    let certY = termsY + 26;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.rect(15, certY, 180, 14, 'FD');

    doc.setTextColor(15, 41, 66);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text("CERTIFICATE OF COMPLETION", 18, certY + 4.5);

    doc.setTextColor(51, 65, 85);
    doc.setFont('Helvetica', 'normal');
    const certDesc = "Upon successful completion of the internship and fulfillment of all assigned tasks, you will receive a Certificate of Internship with QR-code verification for authenticity.";
    const linesCertDesc = doc.splitTextToSize(certDesc, 172);
    doc.text(linesCertDesc, 18, certY + 8.5);

    // Outro Paragraph
    const outro = "Please return the signed copy of this letter as a token of your formal acceptance of this offer. We look forward to a mutually rewarding learning experience.";
    const linesOutro = doc.splitTextToSize(outro, 180);
    doc.text(linesOutro, 15, certY + 21);

    // Signatures Section (at y ~236)
    const sigY = 236;
    if (stampBase64) {
        doc.addImage(stampBase64, 'JPEG', 18, sigY, 19, 19);
    }
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6.5);
    doc.setFont('Helvetica', 'bold');
    doc.text("COMPANY SEAL", 18 + (19 / 2), sigY + 22, { align: "center" });

    if (signBase64) {
        // Aligned flush-right directly above "Vishal R" and "FOUNDER & CEO"
        doc.addImage(signBase64, 'PNG', 165, sigY + 2, 30, 12);
    }
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'bold');
    doc.text("Vishal R", 195, sigY + 16, { align: "right" });
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont('Helvetica', 'bold');
    doc.text("FOUNDER & CEO", 195, sigY + 20.5, { align: "right" });

    // Footer Section (with full branding)
    const footY = sigY + 27;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(15, footY, 195, footY);

    // Left logos: MSME + Skyrovix
    if (msmeBase64) {
        doc.addImage(msmeBase64, 'JPEG', 15, footY + 2.5, 12, 8);
    }
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(29, footY + 2.5, 29, footY + 10.5);

    if (skyrovixBase64) {
        doc.addImage(skyrovixBase64, 'JPEG', 31, footY + 2.5, 13, 8);
    }

    // Center company text
    doc.setTextColor(15, 41, 66);
    doc.setFontSize(7.5);
    doc.setFont('Helvetica', 'bold');
    doc.text("VINIX Technologies", 110, footY + 4.5, { align: "center" });

    doc.setTextColor(100, 116, 139);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text("UDYAM Registry: UDYAM-TN-21-0066185", 110, footY + 8, { align: "center" });
    doc.text("academic@vinix.online | www.vinix.online", 110, footY + 11.5, { align: "center" });

    // Right logo: Yrnovatech
    if (yrnovatechBase64) {
        doc.addImage(yrnovatechBase64, 'PNG', 172, footY + 2, 22, 8.5);
    }

    return doc;
}

// Generates high quality HTML email payload for Gmail
export function createOfferLetterEmailHtml({
    studentName,
    tokenOffer,
    internshipTitle,
    duration,
    formattedStart,
    formattedEnd
}) {
    return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background: #0f2942; padding: 28px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">VINIX</h1>
        <p style="color: #38bdf8; margin: 4px 0 0 0; font-size: 13px; font-weight: 600;">Empowering Future Innovators</p>
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="color: #0f2942; font-size: 18px; margin-top: 0;">🎉 Congratulations, ${studentName || 'Student'}!</h2>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          Your application for the <strong>Vinix Technologies Virtual Internship Program</strong> has been officially approved. We are thrilled to welcome you to our cohort!
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <h3 style="color: #0f2942; font-size: 13px; text-transform: uppercase; margin: 0 0 12px 0; letter-spacing: 0.5px;">Internship Particulars</h3>
          <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse;">
            <tr><td style="padding: 4px 0; font-weight: 600;">Intern ID:</td><td style="color: #0f172a; font-weight: 700; text-align: right;">${tokenOffer}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: 600;">Domain:</td><td style="color: #0f172a; font-weight: 700; text-align: right;">${internshipTitle}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: 600;">Duration:</td><td style="color: #0f172a; font-weight: 700; text-align: right;">${duration}</td></tr>
            ${formattedStart ? `<tr><td style="padding: 4px 0; font-weight: 600;">Commencement:</td><td style="color: #0f172a; font-weight: 700; text-align: right;">${formattedStart}</td></tr>` : ''}
            ${formattedEnd ? `<tr><td style="padding: 4px 0; font-weight: 600;">Est. Completion:</td><td style="color: #0f172a; font-weight: 700; text-align: right;">${formattedEnd}</td></tr>` : ''}
            <tr><td style="padding: 4px 0; font-weight: 600;">Location:</td><td style="color: #0f172a; font-weight: 700; text-align: right;">Remote / Virtual</td></tr>
          </table>
        </div>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          📎 <strong>Your official Internship Offer Letter is attached to this email as a PDF.</strong> Please download and review your offer particulars.
        </p>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          You can track your weekly milestones, access task submission portals, and download your digital student ID card on your student dashboard.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="https://www.vinix.online/student/dashboard" style="background: #0f2942; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">Go to Student Dashboard</a>
        </div>
      </div>
      <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
        <strong style="color: #0f2942;">VINIX Technologies</strong><br>
        UDYAM Registry: UDYAM-TN-21-0066185<br>
        academic@vinix.online | www.vinix.online
      </div>
    </div>
    `;
}

// === DOMAIN DEFINITIONS (mirrors Internships.tsx DOMAINS array) ===
export const DOMAINS = {
    fullstack: {
        label: 'Full Stack Development', title: 'Full Stack Development',
        description: 'Build web apps with React, Express, and databases.',
        tasks: {
            '1 Month': [
                'Personal Portfolio Website',
                'Responsive E-Commerce Website',
                'Student Management System',
                'REST API Based To-Do Application'
            ],
            '2 Months': [
                'Personal Portfolio Website',
                'E-Commerce Product Catalog',
                'To-Do Task Management App',
                'Student Management System',
                'Online Quiz Application',
                'Blog Management System',
                'Employee Management System',
                'Full Stack Event Booking System'
            ],
            '3 Months': [
                'Advanced Personal Portfolio',
                'E-Commerce Website',
                'Student Management System',
                'Online Quiz & Examination System',
                'Blog & Content Management System',
                'Employee Management System',
                'Job Portal Website',
                'Online Food Ordering System',
                'Project Management Dashboard',
                'Complete Full Stack Internship Management Platform'
            ]
        }
    },
    python: {
        label: 'Python Development', title: 'Python Development',
        description: 'Build automation scripts, data pipelines, and REST APIs with Python.',
        tasks: {
            '1 Month': ['Create a Calculator', 'Create a Number Guessing Game', 'Create a To-Do List', 'Create a Student Management System'],
            '2 Months': ['Create a Calculator', 'Create a Number Guessing Game', 'Create a To-Do List', 'Create a File Management Program', 'Create a Student Management System', 'Connect Python with SQLite', 'Create a Python REST API', 'Create a Python Application'],
            '3 Months': ['Create a Calculator', 'Create a Number Guessing Game', 'Create a To-Do List', 'Create a File Management Program', 'Create a Student Management System', 'Create a Database Application', 'Create a REST API', 'Create a Flask Web Application', 'Create a Python Automation Project', 'Create a Complete Python Project'],
        }
    },
    java: {
        label: 'Java Development', title: 'Java Development',
        description: 'Master OOP, collections, Spring Boot basics and backend systems.',
        tasks: {
            '1 Month': ['Create a Calculator', 'Create a Student Grade Calculator', 'Create a Bank Account System', 'Create a Java Mini Project'],
            '2 Months': ['Create a Calculator', 'Create a Student Grade Calculator', 'Create a Bank Account System', 'Create a Library Management System', 'Connect Java with Database', 'Create a JDBC Application', 'Create a Spring Boot CRUD Application', 'Create a Java Application'],
            '3 Months': ['Create a Calculator', 'Create a Student Grade Calculator', 'Create a Bank Account System', 'Create a Library Management System', 'Connect Java with Database', 'Create a JDBC Application', 'Create a REST API', 'Create a Spring Boot Application', 'Create a Java Web Application', 'Create a Complete Java Project'],
        }
    },
    aiml: {
        label: 'Artificial Intelligence & Machine Learning', title: 'AI & Machine Learning',
        description: 'Build neural networks, train ML models, and deploy AI pipelines.',
        tasks: {
            '1 Month': ['Analyze a Dataset', 'Clean a Dataset', 'Create a Prediction Model', 'Create an ML Mini Project'],
            '2 Months': ['Analyze a Dataset', 'Clean a Dataset', 'Create Data Visualizations', 'Build a Regression Model', 'Build a Classification Model', 'Create a Prediction System', 'Evaluate an ML Model', 'Create an ML Application'],
            '3 Months': ['Analyze a Dataset', 'Clean a Dataset', 'Create Data Visualizations', 'Perform Exploratory Data Analysis', 'Build a Regression Model', 'Build a Classification Model', 'Build a Clustering Model', 'Compare ML Models', 'Deploy an ML Model', 'Create an AI/ML Application'],
        }
    },
    datascience: {
        label: 'Data Science', title: 'Data Science',
        description: 'Analyse data, build ML models, and visualise insights.',
        tasks: {
            '1 Month': ['Analyze a Dataset', 'Clean a Dataset', 'Create a Data Visualization', 'Create a Data Analysis Project'],
            '2 Months': ['Analyze a Dataset', 'Clean a Dataset', 'Use NumPy for Data Analysis', 'Use Pandas for Data Analysis', 'Create Data Visualizations', 'Perform Exploratory Data Analysis', 'Create a Data Dashboard', 'Create a Data Science Project'],
            '3 Months': ['Analyze a Dataset', 'Clean a Dataset', 'Use NumPy for Data Analysis', 'Use Pandas for Data Analysis', 'Perform Exploratory Data Analysis', 'Create Data Visualizations', 'Perform Statistical Analysis', 'Create a Data Dashboard', 'Analyze a Real-World Dataset', 'Create a Complete Data Science Project'],
        }
    },
    dataanalytics: {
        label: 'Data Analytics', title: 'Data Analytics',
        description: 'Turn raw business data into actionable insights and dashboards.',
        tasks: {
            '1 Month': ['Collect a Dataset', 'Clean the Dataset', 'Analyze the Data', 'Create a Data Dashboard'],
            '2 Months': ['Collect a Dataset', 'Clean the Dataset', 'Transform the Data', 'Analyze the Data', 'Create Charts & Graphs', 'Create a Business Dashboard', 'Generate Business Insights', 'Create a Data Analytics Project'],
            '3 Months': ['Collect a Dataset', 'Clean the Dataset', 'Transform the Data', 'Analyze the Data', 'Create Charts & Graphs', 'Create a Business Dashboard', 'Perform Sales Analysis', 'Perform Customer Analysis', 'Generate Business Insights', 'Create a Complete Analytics Project'],
        }
    },
    uiux: {
        label: 'UI/UX Design', title: 'UI/UX Design',
        description: 'Design stunning interfaces, wireframes, and interactive prototypes.',
        tasks: {
            '1 Month': ['Create a User Persona', 'Create a Website Wireframe', 'Design a Website UI', 'Create a Mobile App Prototype'],
            '2 Months': ['Create a User Persona', 'Create a User Journey', 'Create a Website Wireframe', 'Design a Landing Page', 'Design a Mobile App', 'Create a Design System', 'Create an Interactive Prototype', 'Create a UI/UX Case Study'],
            '3 Months': ['Create a User Persona', 'Create a User Journey', 'Create a Website Wireframe', 'Design a Landing Page', 'Design a Mobile App', 'Create a Design System', 'Design a Dashboard', 'Create an Interactive Prototype', 'Perform Usability Testing', 'Create a Complete UI/UX Case Study'],
        }
    },
    cloud: {
        label: 'Cloud Computing', title: 'Cloud Computing',
        description: 'Deploy scalable applications on AWS, GCP, or Azure.',
        tasks: {
            '1 Month': ['Create a Cloud Storage', 'Create a Virtual Machine', 'Deploy a Website', 'Deploy a Cloud Application'],
            '2 Months': ['Create Cloud Storage', 'Create a Virtual Machine', 'Create a Cloud Database', 'Configure Cloud Networking', 'Deploy a Website', 'Deploy a Web Application', 'Configure Cloud Monitoring', 'Create a Cloud Project'],
            '3 Months': ['Create Cloud Storage', 'Create a Virtual Machine', 'Create a Cloud Database', 'Configure Cloud Networking', 'Deploy a Website', 'Deploy a Web Application', 'Create a Serverless Application', 'Configure Cloud Security', 'Monitor Cloud Resources', 'Create a Complete Cloud Project'],
        }
    },
    cybersecurity: {
        label: 'Cybersecurity', title: 'Cybersecurity',
        description: 'Identify vulnerabilities, harden systems, and build secure applications.',
        tasks: {
            '1 Month': ['Create a Secure Login System', 'Perform Password Security Testing', 'Perform Web Security Testing', 'Create a Security Assessment Report'],
            '2 Months': ['Create a Secure Login System', 'Configure Network Security', 'Configure Linux Security', 'Implement Access Control', 'Test Web Application Security', 'Secure a Database', 'Monitor Security Events', 'Create a Security Assessment Project'],
            '3 Months': ['Create a Secure Login System', 'Configure Network Security', 'Configure Linux Security', 'Implement Access Control', 'Test Web Application Security', 'Secure a Database', 'Perform Security Testing', 'Perform Vulnerability Assessment', 'Monitor Security Events', 'Create a Cybersecurity Project'],
        }
    },
    mobile: {
        label: 'Mobile App Development', title: 'Mobile App Development',
        description: 'Build cross-platform mobile apps with Flutter or React Native.',
        tasks: {
            '1 Month': ['Create a Mobile Login Screen', 'Create a Mobile Registration Screen', 'Create a To-Do List App', 'Create a Mobile Mini Project'],
            '2 Months': ['Create a Mobile Login Screen', 'Create a Mobile Registration Screen', 'Create a To-Do List App', 'Add Local Data Storage', 'Connect App with REST API', 'Add User Authentication', 'Add App Notifications', 'Create a Mobile Application'],
            '3 Months': ['Create a Mobile Login Screen', 'Create a Mobile Registration Screen', 'Create a To-Do List App', 'Add Local Data Storage', 'Connect App with REST API', 'Add User Authentication', 'Add App Notifications', 'Add Payment Integration', 'Test & Optimize the App', 'Create a Complete Mobile Application'],
        }
    },
    devops: {
        label: 'DevOps', title: 'DevOps',
        description: 'Automate CI/CD pipelines, containerize apps, and manage cloud deployments.',
        tasks: {
            '1 Month': ['Create a GitHub Repository', 'Create a Docker Container', 'Create a CI/CD Pipeline', 'Deploy an Application'],
            '2 Months': ['Create a GitHub Repository', 'Create Git Branches', 'Create a Docker Container', 'Create a Docker Compose Application', 'Create a CI/CD Pipeline', 'Deploy an Application', 'Monitor an Application', 'Create a DevOps Project'],
            '3 Months': ['Create a GitHub Repository', 'Create Git Branches', 'Create a Docker Container', 'Create a Docker Compose Application', 'Create a CI/CD Pipeline', 'Deploy an Application', 'Configure Cloud Deployment', 'Configure Application Monitoring', 'Automate the Deployment Process', 'Create a Complete DevOps Project'],
        }
    },
    sql: {
        label: 'SQL & Database Development', title: 'SQL & Database Development',
        description: 'Design relational schemas, write complex queries, and connect databases to apps.',
        tasks: {
            '1 Month': ['Create a Student Database', 'Create Database Tables', 'Write SQL Queries', 'Create a Database Project'],
            '2 Months': ['Create a Student Database', 'Create Database Tables', 'Insert & Update Data', 'Write SQL Queries', 'Use SQL Joins', 'Create Views & Procedures', 'Connect Database with Application', 'Create a Database Project'],
            '3 Months': ['Create a Student Database', 'Create Database Tables', 'Insert & Update Data', 'Write SQL Queries', 'Use SQL Joins', 'Create Views & Procedures', 'Create Database Relationships', 'Connect Database with Application', 'Optimize Database Queries', 'Create a Complete Database Project'],
        }
    },
    genai: {
        label: 'Generative AI', title: 'Generative AI',
        description: 'Build AI chatbots, RAG apps, and LLM-powered tools.',
        tasks: {
            '1 Month': ['Create a Prompt Library', 'Create an AI Chatbot', 'Connect an AI API', 'Create a Generative AI Mini Project'],
            '2 Months': ['Create a Prompt Library', 'Create an AI Chatbot', 'Connect an AI API', 'Create an AI Text Generator', 'Create an AI Document Assistant', 'Add AI Function Calling', 'Create a RAG Application', 'Create a Generative AI Application'],
            '3 Months': ['Create a Prompt Library', 'Create an AI Chatbot', 'Connect an AI API', 'Create an AI Text Generator', 'Create an AI Document Assistant', 'Create a RAG Application', 'Add AI Function Calling', 'Create an AI Voice Assistant', 'Deploy an AI Application', 'Create a Complete Generative AI Project'],
        }
    },
    blockchain: {
        label: 'Blockchain Development', title: 'Blockchain Development',
        description: 'Build smart contracts, DApps, and Web3 integrations.',
        tasks: {
            '1 Month': ['Create a Blockchain Wallet', 'Create a Simple Smart Contract', 'Create a Token Contract', 'Create a Blockchain Mini Project'],
            '2 Months': ['Create a Blockchain Wallet', 'Create a Simple Smart Contract', 'Create a Token Contract', 'Create a Smart Contract Application', 'Connect a Web3 Application', 'Create a Blockchain Transaction App', 'Create a Decentralized Application', 'Create a Blockchain Project'],
            '3 Months': ['Create a Blockchain Wallet', 'Create a Simple Smart Contract', 'Create a Token Contract', 'Create a Smart Contract Application', 'Connect a Web3 Application', 'Create a Blockchain Transaction App', 'Create a Decentralized Application', 'Create a Decentralized Marketplace', 'Deploy a Smart Contract', 'Create a Complete Blockchain Project'],
        }
    },
    qa: {
        label: 'Software Testing & QA', title: 'Software Testing & QA',
        description: 'Write test cases, perform manual & automated testing, and ensure quality.',
        tasks: {
            '1 Month': ['Create Test Cases', 'Test a Login Page', 'Test a Web Application', 'Create a Testing Report'],
            '2 Months': ['Create Test Cases', 'Test a Login Page', 'Test a Registration Page', 'Test a Web Application', 'Perform API Testing', 'Perform Database Testing', 'Create Automated Tests', 'Create a QA Testing Project'],
            '3 Months': ['Create Test Cases', 'Test a Login Page', 'Test a Registration Page', 'Test a Web Application', 'Perform API Testing', 'Perform Database Testing', 'Create Automated Tests', 'Perform Performance Testing', 'Create a Bug Tracking Report', 'Create a Complete QA Project'],
        }
    },
    iot: {
        label: 'IoT & Embedded Systems', title: 'IoT & Embedded Systems',
        description: 'Connect sensors, control hardware, and send data to the cloud.',
        tasks: {
            '1 Month': ['Create an LED Control System', 'Connect a Temperature Sensor', 'Create an IoT Monitoring System', 'Create an IoT Mini Project'],
            '2 Months': ['Create an LED Control System', 'Connect a Temperature Sensor', 'Connect a Motion Sensor', 'Create a Smart Light System', 'Send Sensor Data to Cloud', 'Create an IoT Dashboard', 'Add Remote Device Control', 'Create an IoT Project'],
            '3 Months': ['Create an LED Control System', 'Connect a Temperature Sensor', 'Connect a Motion Sensor', 'Create a Smart Light System', 'Connect Sensors to the Internet', 'Send Sensor Data to Cloud', 'Create an IoT Dashboard', 'Add Remote Device Control', 'Create a Real-Time Monitoring System', 'Create a Complete IoT Project'],
        }
    },
};

export async function getOrCreateInternship(domainId, duration) {
    const targetDuration = duration || '1 Month';

    // Normalize domainId
    let normalizedDomainId = String(domainId || '').toLowerCase().trim();
    if (normalizedDomainId === 'uiux') normalizedDomainId = 'uiux';

    // Fallback to 'fullstack' if empty
    if (!normalizedDomainId) {
        normalizedDomainId = 'fullstack';
    }

    const domain = DOMAINS[normalizedDomainId] || {
        label: domainId,
        title: domainId,
        description: `Virtual Internship under ${domainId} track.`,
        tasks: {
            '1 Month': ['Task 1', 'Task 2', 'Task 3', 'Task 4'],
            '2 Months': ['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 5', 'Task 6', 'Task 7', 'Task 8'],
            '3 Months': ['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 5', 'Task 6', 'Task 7', 'Task 8', 'Task 9', 'Task 10']
        }
    };

    // First search in internships table
    const { data: existing } = await supabaseAdmin
        .from('internships')
        .select('id, title, category, duration');

    const match = (existing || []).find(i =>
        (i.category?.toLowerCase() === domain.label.toLowerCase() ||
            i.title?.toLowerCase() === domain.title.toLowerCase() ||
            i.title?.toLowerCase().includes(domain.title.toLowerCase()) ||
            domain.title.toLowerCase().includes(i.title?.toLowerCase() || '')) &&
        i.duration === targetDuration
    );

    if (match) {
        console.log(`[UTILS] Found existing internship: ${match.id} (${match.title} - ${match.duration})`);
        return match;
    }

    console.log(`[UTILS] No match found. Creating internship track for: ${domain.title} (${targetDuration})`);

    // Fetch domains to link domain_id
    const { data: dbDomains } = await supabaseAdmin
        .from('domains')
        .select('id, name, slug');

    const matchedDomainDb = (dbDomains || []).find(d =>
        d.slug === normalizedDomainId ||
        d.name.toLowerCase() === domain.label.toLowerCase() ||
        d.name.toLowerCase() === domain.title.toLowerCase()
    );

    const generatedSlug = `${normalizedDomainId}-${targetDuration.toLowerCase().replace(/\s+/g, '-')}`;

    const { data: newIntern, error } = await supabaseAdmin
        .from('internships')
        .insert({
            title: domain.title,
            category: domain.label,
            description: domain.description,
            duration: targetDuration,
            status: 'active',
            domain_id: matchedDomainDb?.id || null,
            slug: generatedSlug
        })
        .select().single();

    if (error) {
        console.error(`[UTILS] Error creating internship:`, error.message);
        throw error;
    }

    const taskNames = domain.tasks[targetDuration] || domain.tasks['1 Month'] || ['Task 2', 'Task 3', 'Task 4', 'Task 5'];
    const taskRows = [
        { internship_id: newIntern.id, task_number: 1, title: 'LinkedIn Offer Post Requirement', description: 'Share your internship selection announcement on LinkedIn to unlock tasks.' },
        ...taskNames.map((title, idx) => ({
            internship_id: newIntern.id,
            task_number: idx + 2,
            title,
            description: `Complete the ${domain.label} task: ${title}`
        }))
    ];
    await supabaseAdmin.from('internship_tasks').insert(taskRows);
    console.log(`[UTILS] Created and seeded tasks for new internship: ${newIntern.id}`);
    return newIntern;
}
