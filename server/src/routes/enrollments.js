import express from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateOfferLetterPDFFile } from '../utils/pdfGenerator.js';

const router = express.Router();

// Helper to compute end date relative to start date & duration
const getEndDate = (start, dur) => {
    const end = new Date(start);
    let months = 3;
    if (dur.includes('1')) months = 1;
    else if (dur.includes('2')) months = 2;
    else if (dur.includes('3')) months = 3;
    else if (dur.includes('6')) months = 6;
    end.setMonth(end.getMonth() + months);
    return end;
};

// Get My Enrollments (with course details)
router.get('/my', authenticateToken, async (req, res) => {
    try {
        const enrollments = await prisma.enrollment.findMany({
            where: { userId: req.user.id },
            include: { course: true },
            orderBy: { joinedAt: 'desc' }
        });
        res.json(enrollments);
    } catch (error) {
        console.error('Fetch my enrollments error:', error);
        res.status(500).json({ message: 'Failed to retrieve enrollments.' });
    }
});

// Enroll in a Course/Internship
router.post('/enroll', authenticateToken, async (req, res) => {
    try {
        const { courseId, duration, phone, college } = req.body;
        if (!courseId) {
            return res.status(400).json({ message: 'Course ID is required.' });
        }

        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) {
            return res.status(404).json({ message: 'Course/Internship not found.' });
        }

        const student = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!student) {
            return res.status(444).json({ message: 'User not found.' });
        }

        // Check if configuration already exists
        const existing = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: req.user.id,
                    courseId
                }
            }
        });

        if (existing) {
            return res.status(200).json(existing); // already enrolled, return it
        }

        const enrollment = await prisma.enrollment.create({
            data: {
                userId: req.user.id,
                courseId,
                progress: 0,
                status: 'ENROLLED'
            },
            include: { course: true }
        });

        // Check if it's an internship. If so, automatically generate an Offer Letter on enrollment!
        if (course.type === 'INTERNSHIP') {
            const selectedDuration = duration || course.duration || '3 Months';
            const existingOffer = await prisma.offerLetter.findFirst({
                where: {
                    studentId: req.user.id,
                    internshipTitle: course.title
                }
            });

            if (!existingOffer) {
                const count = await prisma.offerLetter.count();
                const code = String(1000 + count + 1);
                const offerLetterId = `VINIX-OFFER-2026-${code}`;
                const verificationToken = crypto.randomUUID();

                const pdfFileName = `${offerLetterId}.pdf`;
                const relativePath = `/uploads/offer-letters/${pdfFileName}`;
                const absolutePath = path.join(process.cwd(), 'uploads', 'offer-letters', pdfFileName);

                // Make sure folder exists
                const uploadDir = path.join(process.cwd(), 'uploads', 'offer-letters');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                // Generate dates
                const startDate = new Date();
                const endDate = getEndDate(startDate, selectedDuration);

                const internshipDomain = course.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                const letterData = {
                    offerLetterId,
                    studentId: student.id,
                    studentName: student.name,
                    studentEmail: student.email,
                    studentPhone: phone || 'N/A',
                    studentCollege: college || 'N/A',
                    internshipTitle: course.title,
                    internshipDomain,
                    duration: selectedDuration,
                    startDate,
                    endDate,
                    mentorName: 'Vishal R',
                    customContent: '',
                    customTerms: [],
                    verificationToken,
                    issueDate: new Date(),
                    authPersonName: 'Vishal R',
                    authPersonRole: 'Founder & CEO'
                };

                // Generate physical PDF document
                await generateOfferLetterPDFFile(absolutePath, letterData);

                // Save in DB
                await prisma.offerLetter.create({
                    data: {
                        offerLetterId,
                        studentId: student.id,
                        internshipId: course.id,
                        studentName: student.name,
                        studentEmail: student.email,
                        internshipTitle: course.title,
                        internshipDomain,
                        startDate,
                        endDate,
                        duration: selectedDuration,
                        mentorName: 'Vishal R',
                        status: 'GENERATED',
                        pdfUrl: relativePath,
                        verificationToken
                    }
                });
            }
        }

        res.status(201).json(enrollment);
    } catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).json({ message: 'Failed to enroll.' });
    }
});

// Update Progress
router.put('/progress', authenticateToken, async (req, res) => {
    try {
        const { courseId, progress } = req.body;
        if (!courseId || progress === undefined) {
            return res.status(400).json({ message: 'Course ID and progress percent are required.' });
        }

        const numericProgress = Math.min(100, Math.max(0, parseInt(progress)));
        const status = numericProgress === 100 ? 'COMPLETED' : 'ENROLLED';

        const enrollment = await prisma.enrollment.update({
            where: {
                userId_courseId: {
                    userId: req.user.id,
                    courseId
                }
            },
            data: {
                progress: numericProgress,
                status
            }
        });

        res.json(enrollment);
    } catch (error) {
        console.error('Progress update error:', error);
        res.status(500).json({ message: 'Failed to update progress.' });
    }
});

// ADMIN Route: Get All Enrollments mapped to applications
router.get('/admin/all', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied. Administrator permissions required.' });
        }
        const enrollments = await prisma.enrollment.findMany({
            include: {
                user: { select: { id: true, name: true, email: true, skills: true, createdAt: true } },
                course: { select: { id: true, title: true, category: true, duration: true, type: true } }
            },
            orderBy: { joinedAt: 'desc' }
        });
        res.json(enrollments);
    } catch (error) {
        console.error('Fetch all enrollments error:', error);
        res.status(500).json({ message: 'Failed to load all student enrollments.' });
    }
});

export default router;
