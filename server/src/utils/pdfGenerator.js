import PDFDocument from 'pdfkit';
import path from 'path';
import QRCode from 'qrcode';
import fs from 'fs';

/**
 * Generates an high-fidelity landscape A4 virtual internship completion certificate
 */
export const generateCertificatePDF = async (res, certData) => {
    const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 30, bottom: 30, left: 30, right: 30 }
    });

    // Pipe to response stream
    doc.pipe(res);

    const width = doc.page.width;   // ~842 pt
    const height = doc.page.height; // ~595 pt

    // 1. Draw outer deep blue full border
    doc.save();
    doc.rect(0, 0, width, height)
        .fill('#0b1a30'); // Midnight dark blue frame
    doc.restore();

    // White core backdrop
    doc.save();
    doc.rect(14, 14, width - 28, height - 28)
        .fill('#ffffff');
    doc.restore();

    // 2. Double inner framing borders (Royal gold & thin accent)
    doc.save();
    doc.rect(24, 24, width - 48, height - 48)
        .lineWidth(1.5)
        .stroke('#b45309'); // Outer Gold Line

    doc.rect(29, 29, width - 58, height - 58)
        .lineWidth(0.5)
        .stroke('#d97706'); // Inner delicate Gold Line
    doc.restore();

    // 3. Corner Ornaments (Custom vector panels matching screenshot layout)
    doc.save();
    // Top-Left corner panel
    doc.path('M 24,24 L 140,24 L 24,140 Z')
        .fill('#0b1a30');
    // Top-Left Gold stripes
    doc.moveTo(24, 145).lineTo(145, 24).lineWidth(2).stroke('#d97706');
    doc.moveTo(24, 151).lineTo(151, 24).lineWidth(0.7).stroke('#b45309');

    // Bottom-Right corner panel
    doc.path(`M ${width - 24},${height - 24} L ${width - 140},${height - 24} L ${width - 24},${height - 140} Z`)
        .fill('#0b1a30');
    // Bottom-Right Gold stripes
    doc.moveTo(width - 24, height - 145).lineTo(width - 145, height - 24).lineWidth(2).stroke('#d97706');
    doc.moveTo(width - 24, height - 151).lineTo(width - 151, height - 24).lineWidth(0.7).stroke('#b45309');

    // Anchors for other corners
    // Top-Right corner bracket
    doc.moveTo(width - 60, 24).lineTo(width - 24, 24).lineTo(width - 24, 60).lineWidth(1.5).stroke('#d97706');
    // Bottom-Left corner bracket
    doc.moveTo(24, height - 60).lineTo(24, height - 24).lineTo(60, height - 24).lineWidth(1.5).stroke('#d97706');
    doc.restore();

    // 4. MSME Government Registered Stamp (Top Left) - Rendered raw with white background backplate to show logo clearly
    doc.save();
    const msmeX = 145;
    const msmeY = 26;
    const msmeW = 58;
    const msmeH = 64;
    try {
        // Draw solid white background rect
        doc.rect(msmeX, msmeY, msmeW, msmeH).fillColor('#ffffff').fill();

        // Draw the image
        const msmePath = path.resolve('public/msme-logo.png');
        doc.image(msmePath, msmeX, msmeY, { width: msmeW, height: msmeH });
    } catch (err) {
        console.error('Failed to render MSME image in certificate:', err);
    }
    doc.restore();

    // 5. Center Top Logo: VINIX TECHNOLOGIES
    const logoStartX = width / 2 - 58;
    const logoY = 42;
    doc.save();
    // Draw vector graduation cap
    const capX = logoStartX;
    const capY = logoY + 1;
    doc.moveTo(capX, capY + 8)
        .lineTo(capX + 14, capY + 1)
        .lineTo(capX + 28, capY + 8)
        .lineTo(capX + 14, capY + 15)
        .closePath()
        .fill('#2563eb');
    doc.moveTo(capX + 6, capY + 11)
        .lineTo(capX + 6, capY + 16)
        .quadraticCurveTo(capX + 14, capY + 20, capX + 22, capY + 16)
        .lineTo(capX + 22, capY + 11)
        .closePath()
        .fill('#1e3a8a');
    doc.moveTo(capX + 25, capY + 9)
        .lineTo(capX + 31, capY + 13)
        .lineTo(capX + 31, capY + 20)
        .lineWidth(0.7)
        .stroke('#d97706');
    doc.circle(capX + 31, capY + 20, 1.2).fill('#d97706');

    // Title Text next to graduation cap
    doc.fillColor('#0b1a30')
        .font('Helvetica-Bold')
        .fontSize(22)
        .text('VINIX', logoStartX + 36, logoY - 2);
    doc.fontSize(7.5)
        .fillColor('#4b5563')
        .text('TECHNOLOGIES', logoStartX + 37, logoY + 18, { characterSpacing: 3.5 });
    doc.restore();

    // 6. Ref Number (Top Right)
    doc.save();
    doc.fillColor('#475569')
        .font('Helvetica')
        .fontSize(7.5)
        .text(`REF: ${certData.certificateNumber}`, width - 210, 46, { width: 125, align: 'right' });
    doc.restore();

    // 7. Sparkle Emblem & Certificate Title
    doc.save();
    // Center gold diamond sparkle
    doc.moveTo(width / 2, 107)
        .lineTo(width / 2 + 4, 111)
        .lineTo(width / 2, 115)
        .lineTo(width / 2 - 4, 111)
        .closePath()
        .fill('#d97706');

    doc.fillColor('#0b1a30')
        .font('Times-Bold')
        .fontSize(28)
        .text('CERTIFICATE OF VIRTUAL INTERNSHIP', { align: 'center' });
    doc.restore();

    // 8. Presentation Text
    doc.save();
    doc.fillColor('#4b5563')
        .font('Helvetica')
        .fontSize(11.5)
        .text('This certificate is proudly presented to', { align: 'center' });
    doc.restore();

    // 9. Student Name
    doc.save();
    doc.fillColor('#0d1e3d')
        .font('Times-Bold')
        .fontSize(38)
        .text(certData.studentName, { align: 'center' });

    // Custom name line separator with central gold diamond
    const lineCenterY = doc.y + 6;
    doc.moveTo(width / 2 - 130, lineCenterY)
        .lineTo(width / 2 - 12, lineCenterY)
        .lineWidth(0.8)
        .stroke('#d97706');
    doc.moveTo(width / 2 + 12, lineCenterY)
        .lineTo(width / 2 + 130, lineCenterY)
        .lineWidth(0.8)
        .stroke('#d97706');
    doc.moveTo(width / 2, lineCenterY - 4)
        .lineTo(width / 2 + 4, lineCenterY)
        .lineTo(width / 2, lineCenterY + 4)
        .lineTo(width / 2 - 4, lineCenterY)
        .closePath()
        .fill('#d97706');
    doc.restore();

    // 10. Completion summary lines
    doc.save();
    const sumY = 248;
    doc.font('Helvetica')
        .fontSize(10.5)
        .fillColor('#4b5563')
        .text('for outstanding performance and successful completion of the', width / 2 - 250, sumY, { width: 500, align: 'center' });

    const courseLabelValSymbol = `${certData.courseName} `;
    const courseSuccessValSymbol = 'program at Vinix Technologies.';
    doc.font('Helvetica-Bold').fontSize(11);
    const wPart1 = doc.widthOfString(courseLabelValSymbol);
    doc.font('Helvetica').fontSize(11);
    const wPart2 = doc.widthOfString(courseSuccessValSymbol);
    const textStartX = width / 2 - (wPart1 + wPart2) / 2;

    doc.font('Helvetica-Bold')
        .fillColor('#2563eb')
        .text(courseLabelValSymbol, textStartX, sumY + 16, { continued: true });
    doc.font('Helvetica')
        .fillColor('#4b5563')
        .text(courseSuccessValSymbol);
    doc.restore();

    // 11. Metadata horizontal compartment box Y=306
    const boxY = 305;
    const boxH = 46;
    const boxW = width - 170; // 672pt
    doc.save();
    // Fill slightly warm backdrop
    doc.rect(85, boxY, boxW, boxH)
        .fillOpacity(0.015)
        .fill('#374151');
    doc.fillOpacity(1);

    // Gold borders top & bottom
    doc.moveTo(85, boxY).lineTo(85 + boxW, boxY).lineWidth(0.8).stroke('#d97706');
    doc.moveTo(85, boxY + boxH).lineTo(85 + boxW, boxY + boxH).lineWidth(0.8).stroke('#d97706');

    // Divider vertical lines
    doc.moveTo(253, boxY + 6).lineTo(253, boxY + boxH - 6).lineWidth(0.5).stroke('#cbd5e0');
    doc.moveTo(421, boxY + 6).lineTo(421, boxY + boxH - 6).lineWidth(0.5).stroke('#cbd5e0');
    doc.moveTo(589, boxY + 6).lineTo(589, boxY + boxH - 6).lineWidth(0.5).stroke('#cbd5e0');

    // Column 1: Internship Track
    // Briefcase SVG Vector
    doc.save();
    doc.rect(100, boxY + boxH / 2 - 4, 13, 9).lineWidth(1.2).stroke('#1e40af');
    doc.rect(104, boxY + boxH / 2 - 7, 5, 3).lineWidth(0.8).stroke('#1e40af');
    doc.restore();

    doc.fillColor('#475569')
        .font('Helvetica-Bold')
        .fontSize(7)
        .text('INTERNSHIP', 119, boxY + 10);
    doc.fillColor('#1f2937')
        .font('Helvetica')
        .fontSize(8.5)
        .text(certData.courseName, 119, boxY + 22, { width: 125, height: 20, ellipsis: true });

    // Column 2: Certificate ID Number
    // Badge ID SVG Vector
    doc.save();
    doc.rect(268, boxY + boxH / 2 - 5, 13, 9, 1).lineWidth(1.2).stroke('#1e40af');
    doc.circle(272, boxY + boxH / 2 - 1, 1.5).fill('#1e40af');
    doc.moveTo(276, boxY + boxH / 2 - 3).lineTo(279, boxY + boxH / 2 - 3).lineWidth(0.8).stroke('#1e40af');
    doc.moveTo(276, boxY + boxH / 2).lineTo(278, boxY + boxH / 2).lineWidth(0.8).stroke('#1e40af');
    doc.restore();

    doc.fillColor('#475569')
        .font('Helvetica-Bold')
        .fontSize(7)
        .text('CERTIFICATE ID', 288, boxY + 10);
    doc.fillColor('#1f2937')
        .font('Helvetica')
        .fontSize(8.5)
        .text(certData.certificateNumber, 288, boxY + 22);

    // Column 3: Issue Registration Date
    // Calendar SVG Vector
    doc.save();
    doc.rect(436, boxY + boxH / 2 - 5, 13, 10, 1).lineWidth(1.2).stroke('#1e40af');
    doc.moveTo(436, boxY + boxH / 2 - 2).lineTo(449, boxY + boxH / 2 - 2).lineWidth(0.8).stroke('#1e40af');
    doc.circle(440, boxY + boxH / 2 + 1, 0.5).fill('#1e40af');
    doc.circle(443, boxY + boxH / 2 + 1, 0.5).fill('#1e40af');
    doc.circle(446, boxY + boxH / 2 + 1, 0.5).fill('#1e40af');
    doc.restore();

    doc.fillColor('#475569')
        .font('Helvetica-Bold')
        .fontSize(7)
        .text('ISSUE DATE', 456, boxY + 10);
    doc.fillColor('#1f2937')
        .font('Helvetica')
        .fontSize(8.5)
        .text(new Date(certData.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 456, boxY + 22);

    // Column 4: Verification Status flag
    // Shield Check SVG Vector
    doc.save();
    doc.moveTo(605, boxY + 13)
        .lineTo(612, 11 + boxY)
        .lineTo(619, 13 + boxY)
        .lineTo(619, 19 + boxY)
        .quadraticCurveTo(619, 24 + boxY, 612, 27 + boxY)
        .quadraticCurveTo(605, 24 + boxY, 605, 19 + boxY)
        .closePath()
        .lineWidth(1.2)
        .stroke('#1e40af');
    doc.moveTo(609, 19 + boxY).lineTo(611, 21 + boxY).lineTo(615, 17 + boxY).lineWidth(0.8).stroke('#10b981');
    doc.restore();

    doc.fillColor('#475569')
        .font('Helvetica-Bold')
        .fontSize(7)
        .text('STATUS', 626, boxY + 10);
    doc.fillColor('#10b981')
        .font('Helvetica-Bold')
        .fontSize(8.55)
        .text('VERIFIED', 626, boxY + 22);
    doc.restore();

    // 12. Bottom Left Verification Compartment Y=385
    let qrDataUrl = '';
    try {
        qrDataUrl = await QRCode.toDataURL(certData.verificationURL, { margin: 1, width: 220 });
    } catch (e) {
        console.error('Failed to generate certificate QR:', e);
    }

    doc.save();
    const verifyY = 385;
    // Outline border
    doc.roundedRect(85, verifyY, 155, 68, 6).lineWidth(0.8).stroke('#cbd5e0');

    // QR Image
    if (qrDataUrl) {
        doc.image(qrDataUrl, 91, verifyY + 6, { width: 56, height: 56 });
    }

    // Labels
    doc.fillColor('#1f2937')
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .text('SCAN TO VERIFY', 153, verifyY + 10);
    doc.fillColor('#475569')
        .font('Helvetica')
        .fontSize(7)
        .text('Certificate Verification', 153, verifyY + 20);

    // Separator line
    doc.moveTo(153, verifyY + 31).lineTo(230, verifyY + 31).lineWidth(0.5).stroke('#cbd5e0');

    doc.fillColor('#94a3b8')
        .font('Helvetica')
        .fontSize(5.5)
        .text('Verify this certificate using the QR code', 153, verifyY + 36, { width: 80 });
    doc.restore();



    // 13. Bottom Center: Official Certificate Stamp (Medium size, high clarity)
    doc.save();
    try {
        const stampPath = path.resolve('public/certificate-stamp.jpeg');
        const stampW = 72;
        const stampH = 72;
        doc.image(stampPath, width / 2 - stampW / 2, verifyY - 3, { width: stampW, height: stampH });
    } catch (err) {
        console.error('Failed to render centered certificate stamp inside PDF:', err);
    }
    doc.restore();

    // 14. Bottom Right Signature block
    const sigBlockX = width - 245;
    doc.save();

    // Simulated Cursive blue ink signature
    doc.fillColor('#1d4ed8')
        .font('Times-BoldItalic')
        .fontSize(22)
        .text('Vishal R.', sigBlockX + 45, verifyY - 2);

    // Gold signature line
    doc.moveTo(sigBlockX, verifyY + 23)
        .lineTo(sigBlockX + 160, verifyY + 23)
        .lineWidth(0.9)
        .stroke('#d97706');

    // Printed titles below
    doc.fillColor('#0b1a30')
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text('Vishal R', sigBlockX, verifyY + 29, { width: 160, align: 'center' });

    doc.fillColor('#64748b')
        .font('Helvetica')
        .fontSize(7.5)
        .text('Founder & CEO', sigBlockX, verifyY + 38, { width: 160, align: 'center' })
        .text('Vinix Technologies', sigBlockX, verifyY + 47, { width: 160, align: 'center' });
    doc.restore();

    // 15. Bottom dark blue banner block
    doc.save();
    const bannerW = 250;
    const bannerStartX = width / 2 - bannerW / 2;
    doc.moveTo(bannerStartX, height - 14)
        .lineTo(bannerStartX + 12, height - 38)
        .lineTo(bannerStartX + bannerW - 12, height - 38)
        .lineTo(bannerStartX + bannerW, height - 14)
        .closePath()
        .fill('#0b1a30');

    doc.moveTo(bannerStartX, height - 14)
        .lineTo(bannerStartX + 12, height - 38)
        .lineTo(bannerStartX + bannerW - 12, height - 38)
        .lineTo(bannerStartX + bannerW, height - 14)
        .closePath()
        .lineWidth(1)
        .stroke('#d97706');

    doc.fillColor('#d97706')
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .text('VINIX TECHNOLOGIES', bannerStartX + 20, height - 32, { width: bannerW - 40, align: 'center', characterSpacing: 1.5 });

    doc.fillColor('#ffffff')
        .font('Helvetica')
        .fontSize(6.5)
        .text('Certificate of Virtual Internship', bannerStartX + 20, height - 23, { width: bannerW - 40, align: 'center' });
    doc.restore();

    doc.end();
};

/**
 * Generates an high-fidelity portrait A4 virtual internship offer letter and saves it to a file
 */
export const generateOfferLetterPDFFile = async (filePath, letterData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 40, bottom: 40, left: 45, right: 45 },
                autoPageBreak: false
            });

            // Ensure parent directory exists
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const writeStream = fs.createWriteStream(filePath);
            doc.pipe(writeStream);

            const width = doc.page.width;   // ~595 pt
            const height = doc.page.height; // ~842 pt

            // 1. Draw outer thin double corporate border
            doc.save();
            doc.rect(15, 15, width - 30, height - 30)
                .lineWidth(2)
                .stroke('#1e3a8a'); // Brand primary dark blue
            doc.rect(20, 20, width - 40, height - 40)
                .lineWidth(0.7)
                .strokeOpacity(0.5)
                .stroke('#3b82f6'); // Accent blue
            doc.restore();

            // Corner small design blocks
            doc.save();
            doc.fillColor('#1e3a8a');
            doc.rect(14, 14, 15, 4).fill();
            doc.rect(14, 14, 4, 15).fill();
            doc.rect(width - 29, 14, 15, 4).fill();
            doc.rect(width - 18, 14, 4, 15).fill();
            doc.rect(14, height - 18, 15, 4).fill();
            doc.rect(14, height - 29, 4, 15).fill();
            doc.rect(width - 29, height - 18, 15, 4).fill();
            doc.rect(width - 18, height - 29, 4, 15).fill();
            doc.restore();

            // 2. Header Section
            // Draw vector logo icon
            const logoX = 45;
            const logoY = 38;
            doc.save();
            // Draw overlapping polygons for standard VINIX geometric icon
            doc.fillColor('#1e3a8a')
                .moveTo(logoX, logoY)
                .lineTo(logoX + 22, logoY)
                .lineTo(logoX + 11, logoY + 18)
                .fill();
            doc.fillColor('#3b82f6')
                .moveTo(logoX + 12, logoY)
                .lineTo(logoX + 34, logoY)
                .lineTo(logoX + 23, logoY + 18)
                .fill();
            doc.restore();

            // Company Title and Sub-details
            doc.save();
            doc.fillColor('#1e3a8a')
                .font('Helvetica-Bold')
                .fontSize(22)
                .text('VINIX', logoX + 42, logoY - 4);
            doc.fontSize(7.5)
                .fillColor('#3b82f6')
                .text('VIRTUAL INTERNSHIP & LEARNING PLATFORM', logoX + 43, logoY + 16, { characterSpacing: 1.5 });

            // Header Contact Block Right-Aligned
            doc.fillColor('#4b5563')
                .font('Helvetica')
                .fontSize(8.5)
                .text('Email: info@vinixtech.com', width - 220, logoY, { width: 175, align: 'right' })
                .text('Web: www.vinixtech.com', { width: 175, align: 'right' })
                .text('Office: Chennai, TN, India', { width: 175, align: 'right' });
            doc.restore();

            // Separator bar
            doc.moveTo(45, 78)
                .lineTo(width - 45, 78)
                .lineWidth(1.2)
                .stroke('#94a3b8');

            // 3. Document Title / Date / Salutation / Opening Text
            const contentStartY = 92;
            doc.save();
            doc.fillColor('#0f172a')
                .font('Helvetica-Bold')
                .fontSize(16)
                .text('INTERNSHIP OFFER LETTER', 45, contentStartY, { align: 'center', characterSpacing: 1 });

            doc.font('Helvetica')
                .fontSize(9.5)
                .fillColor('#475569')
                .text(`Date: ${new Date(letterData.issueDate || new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 45, contentStartY + 20)
                .text(`Ref Number: ${letterData.offerLetterId}`, width - 230, contentStartY + 20, { align: 'right' });

            const salutationY = contentStartY + 42;
            doc.fillColor('#1e293b')
                .font('Helvetica-Bold')
                .fontSize(10)
                .text(`Dear ${letterData.studentName},`, 45, salutationY);

            const openingText = `Following your application and subsequent evaluation processes, we are pleased to offer you the position of Virtual Intern – ${letterData.internshipTitle} at Vinix Technologies. Under the terms of this offer, you will be assigned learning milestones, practical projects, and domain tasks to prepare you for industry work.`;
            doc.font('Helvetica')
                .fontSize(9.5)
                .fillColor('#334155')
                .text(openingText, 45, salutationY + 16, { width: width - 90, align: 'justify', lineGap: 3 });
            doc.restore();

            // 4. Internship Details Table
            const tableStartY = salutationY + 74;
            const tableWidth = width - 90; // 505 pt

            doc.save();
            // Draw table header background
            doc.fillColor('#1e3a8a')
                .rect(45, tableStartY, tableWidth, 18)
                .fill();

            // Header text
            doc.fillColor('#ffffff')
                .font('Helvetica-Bold')
                .fontSize(9)
                .text('Particulars', 55, tableStartY + 5)
                .text('Details', 220, tableStartY + 5);

            // Table Rows data
            const tableRows = [
                { name: 'Full Name', val: letterData.studentName },
                { name: 'Intern ID', val: letterData.offerLetterId },
                { name: 'Domain', val: letterData.internshipTitle },
                { name: 'Duration', val: letterData.duration },
                { name: 'Start Date', val: new Date(letterData.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
                { name: 'End Date', val: new Date(letterData.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
                { name: 'Mode of Internship', val: 'Remote / Virtual' }
            ];

            let rowY = tableStartY + 18;
            doc.font('Helvetica').fontSize(8.5).fillColor('#1e293b');

            tableRows.forEach((row, idx) => {
                // Background tint for alternate rows
                if (idx % 2 === 1) {
                    doc.fillColor('#f8fafc')
                        .rect(45, rowY, tableWidth, 16)
                        .fill();
                }

                // Border lines
                doc.strokeColor('#e2e8f0')
                    .lineWidth(0.5)
                    .moveTo(45, rowY)
                    .lineTo(45 + tableWidth, rowY)
                    .stroke();

                // Content text
                doc.fillColor('#1e293b')
                    .font('Helvetica-Bold')
                    .text(row.name, 55, rowY + 4)
                    .font('Helvetica')
                    .text(row.val, 220, rowY + 4);

                rowY += 16;
            });
            // Bottom table line
            doc.strokeColor('#cbd5e1')
                .lineWidth(0.7)
                .moveTo(45, rowY)
                .lineTo(45 + tableWidth, rowY)
                .stroke();

            // Draw table outer border outline
            doc.strokeColor('#cbd5e1')
                .lineWidth(0.7)
                .rect(45, tableStartY, tableWidth, rowY - tableStartY)
                .stroke();
            doc.restore();

            // 5. Internship Overview & Terms
            const docBodyY = rowY + 12;
            doc.save();

            // Bullet points of overview
            doc.fillColor('#0f172a')
                .font('Helvetica-Bold')
                .fontSize(9.5)
                .text('Internship Overview:', 45, docBodyY);

            const overviewPoints = [
                `Work on practical, real-world ${letterData.internshipTitle} projects.`,
                "Gain hands-on experience with modern development tools and technologies.",
                "Receive feedback and mentorship milestone guidance from experienced professionals.",
                "Enhance your technical, software engineering, and problem-solving skills."
            ];

            let overY = docBodyY + 14;
            doc.font('Helvetica').fontSize(8.5).fillColor('#475569');
            overviewPoints.forEach((pt) => {
                doc.text('•', 55, overY);
                doc.text(pt, 66, overY, { width: width - 113 });
                overY += 12;
            });

            // Terms section
            const termsStartY = overY + 6;
            doc.fillColor('#0f172a')
                .font('Helvetica-Bold')
                .fontSize(9.5)
                .text('Terms and Conditions of Internship:', 45, termsStartY);

            const defaultTerms = [
                "The internship is conducted virtually/remotely with flexible self-paced milestones.",
                "Verify and submit task code repositories via GitHub for approval reviews.",
                "Successful certification is contingent on completing all assignment tasks.",
                "A completion certificate may be issued after evaluation of all tasks.",
            ];

            const termsToPrint = letterData.customTerms && letterData.customTerms.length > 0
                ? letterData.customTerms.slice(0, 4)
                : defaultTerms;

            let termY = termsStartY + 14;
            doc.font('Helvetica').fontSize(8.5).fillColor('#475569');
            termsToPrint.forEach((term, index) => {
                doc.font('Helvetica-Bold').text(`${index + 1}.`, 55, termY);
                doc.font('Helvetica').text(term, 66, termY, { width: width - 113 });
                termY += 12;
            });
            doc.restore();

            // 6. Verification QR & Signatures layout at bottom
            const bottomY = height - 150;

            // Generate QR Code containing verification URL
            const verificationURL = letterData.verificationURL || `http://localhost:5173/verify/offer/${letterData.verificationToken}`;
            let qrCodeDataURI;
            try {
                qrCodeDataURI = await QRCode.toDataURL(verificationURL, { margin: 1, width: 200 });
            } catch (err) {
                console.error("Failed to generate details QR Code:", err);
            }

            // QR Code (Left)
            if (qrCodeDataURI) {
                doc.save();
                doc.image(qrCodeDataURI, 45, bottomY, { width: 70 });
                doc.fillColor('#64748b')
                    .font('Helvetica')
                    .fontSize(7)
                    .text('Scan to Verify', 45, bottomY + 73, { width: 70, align: 'center' });
                doc.restore();
            }

            // Seal Stamp (Center)
            doc.save();
            const sealCenterX = width / 2;
            try {
                doc.image(path.resolve('public/certificate-stamp.jpeg'), sealCenterX - 35, bottomY, { width: 70 });
            } catch (err) {
                // Fallback vector stamp
                doc.circle(sealCenterX, bottomY + 35, 30)
                    .lineWidth(1)
                    .dash(2, { space: 2 })
                    .stroke('#1e40af');

                doc.circle(sealCenterX, bottomY + 35, 26)
                    .lineWidth(0.5)
                    .undash()
                    .stroke('#3b82f6');

                doc.fillColor('#1e40af')
                    .fontSize(5)
                    .font('Helvetica-Bold')
                    .text('VINIX', sealCenterX - 18, bottomY + 26, { width: 36, align: 'center' })
                    .fontSize(4)
                    .text('★ OFFICIAL ★', sealCenterX - 20, bottomY + 34, { width: 40, align: 'center' })
                    .text('OFFER LETTER', sealCenterX - 18, bottomY + 41, { width: 36, align: 'center' });
            }
            doc.restore();

            // Authorized Signing (Right)
            doc.save();
            const signatureX = width - 185;

            // Simulated elegant digital signature/font
            doc.fillColor('#120a8f')
                .font('Times-BoldItalic')
                .fontSize(16)
                .text('Vishal R.', signatureX + 15, bottomY + 12);

            doc.moveTo(signatureX, bottomY + 28)
                .lineTo(signatureX + 140, bottomY + 28)
                .lineWidth(0.8)
                .stroke('#94a3b8');

            doc.fillColor('#0f172a')
                .font('Helvetica-Bold')
                .fontSize(8.5)
                .text(letterData.authPersonName || 'Vishal R', signatureX + 15, bottomY + 34)
                .font('Helvetica')
                .fillColor('#64748b')
                .fontSize(7.5)
                .text(letterData.authPersonRole || 'Founder & CEO', signatureX + 15, bottomY + 44)
                .text('Vinix Technologies Platform', signatureX + 15, bottomY + 54);

            doc.restore();

            // 7. Footer Accent text (Single MSME and contact info)
            doc.save();
            doc.moveTo(45, height - 55)
                .lineTo(width - 45, height - 55)
                .lineWidth(0.5)
                .stroke('#cbd5e1');

            const footerTextY = height - 48;

            // Draw MSME logo on the left of footer
            try {
                const msmeLogoPath = path.resolve('public/msme-logo.png');
                doc.image(msmeLogoPath, 45, footerTextY - 6, { width: 28, height: 28 });
                doc.fillColor('#0f172a')
                    .font('Helvetica-Bold')
                    .fontSize(8)
                    .text('Govt. of India MSME Registered', 80, footerTextY - 2);
                doc.fillColor('#4b5563')
                    .font('Helvetica')
                    .fontSize(6.5)
                    .text('UDYAM-TN-02-0086782', 80, footerTextY + 9, { width: 180 });
            } catch (err) {
                doc.fillColor('#4b5563')
                    .font('Helvetica-Bold')
                    .fontSize(7)
                    .text('MSME REG: UDYAM-TN-02-0086782', 45, footerTextY, { width: 220 });
            }

            // Right side contact details
            doc.fillColor('#64748b')
                .font('Helvetica')
                .fontSize(7)
                .text('Contact: info@vinixtech.com | Web: www.vinixtech.com', width - 265, footerTextY, { width: 220, align: 'right' });

            doc.restore();

            doc.end();

            writeStream.on('finish', () => {
                resolve(filePath);
            });
            writeStream.on('error', (err) => {
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Legacy compatibility wrapper: Generates A4 virtual internship offer letter directly to response stream
 */
export const generateOfferLetterPDF = (res, letterData) => {
    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 60, right: 60 }
    });

    doc.pipe(res);

    const width = doc.page.width;

    // Header Details
    doc.save();
    doc.fillColor('#1e3a8a')
        .font('Helvetica-Bold')
        .fontSize(20)
        .text('VINIX TECHNOLOGIES');

    doc.fillColor('#475569')
        .font('Helvetica')
        .fontSize(9.5)
        .text('Learn. Build. Intern. Get Industry Ready.')
        .text('URL: www.vinixtech.com | Contact: internships@vinixtech.com');
    doc.restore();

    // MSME label
    doc.save();
    const labelX = width - 215;
    const labelY = 46;
    try {
        doc.image(path.resolve('public/msme.jpeg'), labelX + 15, labelY, { height: 38 });
    } catch (err) {
        doc.roundedRect(labelX, labelY, 155, 36, 6)
            .fillOpacity(0.06)
            .fill('#1e3a8a');
        doc.roundedRect(labelX, labelY, 155, 36, 6)
            .lineWidth(1)
            .strokeOpacity(0.7)
            .stroke('#3b82f6');
        doc.fillColor('#d97706')
            .fillOpacity(1)
            .font('Helvetica-Bold')
            .fontSize(9)
            .text('★', labelX + 8, labelY + 9);
        doc.fillColor('#1e3a8a')
            .fontSize(7.5)
            .font('Helvetica-Bold')
            .text('MSME REGISTERED', labelX + 22, labelY + 9);
        doc.fillColor('#4b5563')
            .fontSize(6)
            .font('Helvetica')
            .text('Reg No: UDYAM-TN-02-0086782', labelX + 22, labelY + 20);
    }
    doc.restore();

    doc.moveTo(60, 105)
        .lineTo(width - 60, 105)
        .lineWidth(1.5)
        .stroke('#3b82f6');

    doc.moveDown(2);

    // Date/Ref
    doc.save();
    doc.fillColor('#475569')
        .font('Helvetica')
        .fontSize(10.5)
        .text(`Date: ${new Date(letterData.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'right' });
    doc.text(`Ref Number: VINIX/${letterData.letterNumber}`, 60, doc.y - 12);
    doc.restore();

    doc.moveDown(2);

    // Address
    doc.save();
    doc.font('Helvetica-Bold')
        .fillColor('#1f2937')
        .fontSize(11)
        .text('To,')
        .text(letterData.studentName)
        .font('Helvetica')
        .fillColor('#4b5563')
        .text('Selected Internship Candidate')
        .text('India');
    doc.restore();

    doc.moveDown(1.5);

    // Subject
    doc.save();
    doc.font('Helvetica-Bold')
        .fillColor('#111827')
        .fontSize(11)
        .text('Subject: Internship Offer Letter', { underline: true });
    doc.restore();

    doc.moveDown(1.2);

    // Content Body
    doc.save();
    doc.font('Helvetica')
        .fontSize(11.5)
        .fillColor('#374151')
        .text(`Dear `, { continued: true })
        .font('Helvetica-Bold')
        .text(`${letterData.studentName},`)
        .font('Helvetica')
        .moveDown(0.7)
        .text(`Following your application and subsequent evaluation processes, we are pleased to offer you a virtual internship as a `, { continued: true })
        .font('Helvetica-Bold')
        .text(`${letterData.role}`, { continued: true })
        .font('Helvetica')
        .text(` at Vinix Technologies.`)
        .moveDown(0.7)
        .text(`Your internship is scheduled to begin on `, { continued: true })
        .font('Helvetica-Bold')
        .text(`${new Date(letterData.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { continued: true })
        .font('Helvetica')
        .text(` for a duration of `, { continued: true })
        .font('Helvetica-Bold')
        .text(`${letterData.duration}.`, { continued: false })
        .moveDown(0.7)
        .text(`During this remote program, your primary duties involve completing task-based project milestones, attending mentor syncs, and developing industry-ready features. You will receive hands-on training and mentorship over the platform dashboard.`)
        .moveDown(1)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text('Terms and Conditions of your Internship:')
        .moveDown(0.5)
        .font('Helvetica')
        .fillColor('#4b5563')
        .text('1. Intellectual Property: All products and codes compiled during the program remain the intellectual repository of the platform.')
        .text('2. Evaluation: Successful certification is contingent on completing all assignment tasks and receiving approval on project code repositories.')
        .text('3. Mode: This is a 100% remote, self-paced, flexible assignment.')
        .moveDown(1)
        .fillColor('#374151')
        .text('We wish you the best in your learning path. Welcome to the team!');
    doc.restore();

    // Stamp & Signatures
    const sigBlockY = 660;

    doc.save();
    const stampX = 140;
    const stampY = sigBlockY + 40;
    try {
        doc.image(path.resolve('public/certificate-stamp.jpeg'), stampX - 35, stampY - 35, { width: 70 });
    } catch (err) {
        doc.circle(stampX, stampY, 32)
            .lineWidth(1.5)
            .strokeOpacity(0.7)
            .stroke('#1e40af');
        doc.circle(stampX, stampY, 28)
            .strokeOpacity(0.4)
            .stroke('#1e40af');
        doc.fillColor('#1e40af')
            .fillOpacity(0.7)
            .font('Helvetica-Bold')
            .fontSize(5.5)
            .text('VINIX TECHNOLOGIES', stampX - 28, stampY - 12)
            .text('★ CHENNAI, INDIA ★', stampX - 25, stampY)
            .fontSize(4.5)
            .text('OFFICIAL BLUE SEAL', stampX - 22, stampY + 10);
    }
    doc.restore();

    doc.save();
    const sigBlockX = width - 230;

    doc.fillColor('#1d4ed8')
        .font('Times-BoldItalic')
        .fontSize(18)
        .text('Vishal R.', sigBlockX + 35, sigBlockY + 12);

    doc.moveTo(sigBlockX, sigBlockY + 30)
        .lineTo(sigBlockX + 175, sigBlockY + 30)
        .lineWidth(1.2)
        .stroke('#475569');

    doc.fillColor('#1e293b')
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .text('Vishal R', sigBlockX + 45, sigBlockY + 36)
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor('#64748b')
        .text('Founder & CEO', sigBlockX + 40, sigBlockY + 48)
        .text('Vinix Technologies Corp.', sigBlockX + 22, sigBlockY + 58);
    doc.restore();

    doc.end();
};

