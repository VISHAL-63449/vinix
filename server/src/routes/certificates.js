import express from 'express';
import { prisma } from '../config.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateCertificatePDF } from '../utils/pdfGenerator.js';

const router = express.Router();

// Public Verification Endpoint (NO AUTH REQUIRED)
router.get('/verify/:certNo', async (req, res) => {
    try {
        const { certNo } = req.params;
        const cert = await prisma.certificate.findFirst({
            where: { certificateNumber: certNo },
            include: {
                student: {
                    select: { name: true, email: true }
                }
            }
        });

        if (!cert) {
            return res.status(404).json({ verified: false, message: 'Certificate number not found.' });
        }

        res.json({
            verified: true,
            certificateNumber: cert.certificateNumber,
            studentName: cert.student.name,
            courseName: cert.courseName,
            issueDate: cert.issueDate,
            organization: 'Vinix Technologies',
            status: 'VERIFIED'
        });
    } catch (error) {
        console.error('Verify certificate error:', error);
        res.status(500).json({ message: 'Internal verification check failed.' });
    }
});

// Download PDF (No auth required for public verification validation download, or can be public for easy sharing)
router.get('/pdf/:certNo', async (req, res) => {
    try {
        const { certNo } = req.params;
        const cert = await prisma.certificate.findFirst({
            where: { certificateNumber: certNo },
            include: {
                student: {
                    select: { name: true }
                }
            }
        });

        if (!cert) {
            return res.status(404).json({ message: 'Certificate not found.' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Certificate_${certNo}.pdf`);

        await generateCertificatePDF(res, {
            studentName: cert.student.name,
            courseName: cert.courseName,
            certificateNumber: cert.certificateNumber,
            issueDate: cert.issueDate,
            verificationURL: cert.verificationURL
        });
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ message: 'Failed to generate PDF.' });
    }
});

// Get My Certificates (Authenticated Student)
router.get('/my', authenticateToken, async (req, res) => {
    try {
        const certs = await prisma.certificate.findMany({
            where: { studentId: req.user.id },
            orderBy: { issueDate: 'desc' }
        });
        res.json(certs);
    } catch (error) {
        console.error('Fetch my certificates error:', error);
        res.status(500).json({ message: 'Failed to retrieve certificates.' });
    }
});

// ADMIN: Get All Certificates
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden. Admin role required.' });
        }
        const certs = await prisma.certificate.findMany({
            include: {
                student: { select: { name: true, email: true } }
            },
            orderBy: { issueDate: 'desc' }
        });
        res.json(certs);
    } catch (error) {
        console.error('Fetch all certificates error:', error);
        res.status(500).json({ message: 'Failed to fetch certificates.' });
    }
});

export default router;
