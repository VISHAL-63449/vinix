import express from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateOfferLetterPDFFile } from '../utils/pdfGenerator.js';

const router = express.Router();

// Helper middleware for admin restriction
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
};

// 1. PUBLIC Route: Verify Offer Letter by Token
router.get('/offer-letters/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const letter = await prisma.offerLetter.findUnique({
            where: { verificationToken: token }
        });

        if (!letter) {
            return res.status(404).json({
                verified: false,
                message: 'Invalid offer letter verification token. Record not found.'
            });
        }

        res.json({
            verified: true,
            offerLetterId: letter.offerLetterId,
            studentName: letter.studentName,
            internshipTitle: letter.internshipTitle,
            duration: letter.duration,
            issueDate: letter.issueDate,
            status: letter.status,
            verificationResult: '✓ Offer Letter Verified'
        });
    } catch (error) {
        console.error('Verify offer letter error:', error);
        res.status(500).json({ message: 'Internal verification server error.' });
    }
});

// 2. ADMIN Route: Generate Offer Letter
router.post('/offer-letters/generate', authenticateToken, isAdmin, async (req, res) => {
    try {
        const {
            studentId,
            internshipId,
            startDate,
            endDate,
            duration,
            mentorName,
            customContent,
            customTerms,
            authPersonName,
            authPersonRole,
            studentPhone,
            studentCollege
        } = req.body;

        // Input validation
        if (!studentId || !startDate || !endDate || !duration || !mentorName) {
            return res.status(400).json({ message: 'Missing required parameters. Student, Dates, Duration and Mentor are required.' });
        }

        // Fetch student
        const student = await prisma.user.findUnique({
            where: { id: studentId }
        });
        if (!student) {
            return res.status(404).json({ message: 'Target student not found.' });
        }

        // Fetch internship details if internshipId is provided
        let internshipTitle = 'Virtual Internship';
        let internshipDomain = 'general';
        if (internshipId) {
            const course = await prisma.course.findUnique({
                where: { id: internshipId }
            });
            if (course) {
                internshipTitle = course.title;
                internshipDomain = course.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            }
        }

        // Generate unique serial offer letter ID
        const count = await prisma.offerLetter.count();
        const code = String(1000 + count + 1);
        const offerLetterId = `VINIX-OFFER-2026-${code}`;
        const verificationToken = crypto.randomUUID();

        // Server-side PDF storage path
        const pdfFileName = `${offerLetterId}.pdf`;
        const relativePath = `/uploads/offer-letters/${pdfFileName}`;
        const absolutePath = path.join(process.cwd(), 'uploads', 'offer-letters', pdfFileName);

        const letterData = {
            offerLetterId,
            studentId: student.id,
            studentName: student.name,
            studentEmail: student.email,
            studentPhone: studentPhone || 'N/A',
            studentCollege: studentCollege || 'N/A',
            internshipTitle,
            internshipDomain,
            duration,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            mentorName,
            customContent,
            customTerms: customTerms || [],
            verificationToken,
            issueDate: new Date(),
            authPersonName: authPersonName || 'Vishal R',
            authPersonRole: authPersonRole || 'Founder & CEO'
        };

        // Generate the PDF
        await generateOfferLetterPDFFile(absolutePath, letterData);

        // Store details in DB
        const offerLetter = await prisma.offerLetter.create({
            data: {
                offerLetterId,
                studentId: student.id,
                internshipId: internshipId || null,
                studentName: student.name,
                studentEmail: student.email,
                internshipTitle,
                internshipDomain,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                duration,
                mentorName,
                status: 'GENERATED',
                pdfUrl: relativePath,
                verificationToken
            }
        });

        res.status(201).json(offerLetter);
    } catch (error) {
        console.error('Generate offer letter error:', error);
        res.status(500).json({ message: 'Internal server error generating offer letter.' });
    }
});

// 3. ADMIN Route: Get all offer letters
router.get('/admin/offer-letters', authenticateToken, isAdmin, async (req, res) => {
    try {
        const allLetters = await prisma.offerLetter.findMany({
            include: {
                student: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(allLetters);
    } catch (error) {
        console.error('Fetch all offer letters error:', error);
        res.status(500).json({ message: 'Failed to fetch offer letters.' });
    }
});

// ADMIN: Get all email logs
router.get('/admin/email-logs', authenticateToken, isAdmin, async (req, res) => {
    try {
        const logs = await prisma.$queryRaw`
            SELECT id, email_to as "emailTo", student_name as "studentName", 
                   document_type as "documentType", status, subject, 
                   reference_id as "referenceId", error_message as "errorMessage", 
                   sent_at as "sentAt", created_at as "createdAt"
            FROM public.email_logs
            ORDER BY created_at DESC
            LIMIT 100
        `;
        res.json(logs);
    } catch (error) {
        console.warn('Prisma queryRaw for email_logs failed, returning empty list:', error.message);
        res.json([]);
    }
});


// 4. STUDENT Route: Get my offer letters
router.get('/offer-letters', authenticateToken, async (req, res) => {
    try {
        const studentLetters = await prisma.offerLetter.findMany({
            where: { studentId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(studentLetters);
    } catch (error) {
        console.error('Fetch student offer letters error:', error);
        res.status(500).json({ message: 'Failed to retrieve offer letters.' });
    }
});

// 5. SECURE Route: Get specific offer letter by DB ID
router.get('/offer-letters/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const letter = await prisma.offerLetter.findUnique({
            where: { id }
        });

        if (!letter) {
            return res.status(404).json({ message: 'Offer letter not found.' });
        }

        // Student can only see their own letters
        if (req.user.role !== 'ADMIN' && letter.studentId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied. You do not own this offer letter.' });
        }

        res.json(letter);
    } catch (error) {
        console.error('Fetch offer letter error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// 6. SECURE Route: Download PDF file
router.get('/offer-letters/:id/download', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const letter = await prisma.offerLetter.findUnique({
            where: { id }
        });

        if (!letter) {
            return res.status(404).json({ message: 'Offer letter record not found.' });
        }

        if (req.user.role !== 'ADMIN' && letter.studentId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        // Construct absolute path
        const pdfFileName = `${letter.offerLetterId}.pdf`;
        const absolutePath = path.join(process.cwd(), 'uploads', 'offer-letters', pdfFileName);

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ message: 'PDF file not found on local storage.' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=OfferLetter_${letter.offerLetterId}.pdf`);
        const fileStream = fs.createReadStream(absolutePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Download offer letter error:', error);
        res.status(500).json({ message: 'Failed to download PDF.' });
    }
});

// 7. STUDENT Route: Accept Offer Letter
router.post('/offer-letters/:id/accept', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const letter = await prisma.offerLetter.findUnique({
            where: { id }
        });

        if (!letter) {
            return res.status(404).json({ message: 'Offer letter not found.' });
        }

        if (letter.studentId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied. You cannot accept this offer.' });
        }

        const updatedLetter = await prisma.offerLetter.update({
            where: { id },
            data: { status: 'ACCEPTED' }
        });

        res.json(updatedLetter);
    } catch (error) {
        console.error('Accept offer letter error:', error);
        res.status(500).json({ message: 'Internal server error accepting offer.' });
    }
});

// 8. STUDENT Route: Decline Offer Letter
router.post('/offer-letters/:id/decline', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const letter = await prisma.offerLetter.findUnique({
            where: { id }
        });

        if (!letter) {
            return res.status(404).json({ message: 'Offer letter not found.' });
        }

        if (letter.studentId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied. You cannot decline this offer.' });
        }

        const updatedLetter = await prisma.offerLetter.update({
            where: { id },
            data: { status: 'DECLINED' }
        });

        res.json(updatedLetter);
    } catch (error) {
        console.error('Decline offer letter error:', error);
        res.status(500).json({ message: 'Internal server error declining offer.' });
    }
});

// 9. ADMIN Route: Revoke/Expire Offer Letter
router.post('/offer-letters/:id/revoke', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const letter = await prisma.offerLetter.findUnique({
            where: { id }
        });

        if (!letter) {
            return res.status(404).json({ message: 'Offer letter not found.' });
        }

        const updatedLetter = await prisma.offerLetter.update({
            where: { id },
            data: { status: 'EXPIRED' }
        });

        res.json(updatedLetter);
    } catch (error) {
        console.error('Revoke offer letter error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

export default router;
