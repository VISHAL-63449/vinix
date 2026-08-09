import express from 'express';
import { prisma } from '../config.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculateAndUpdateProgress } from '../utils/progressHelper.js';

const router = express.Router();

// Get Projects list
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'ADMIN') {
            const projects = await prisma.project.findMany({
                include: { student: { select: { id: true, name: true, email: true } } },
                orderBy: { submittedAt: 'desc' }
            });
            return res.json(projects);
        } else {
            const projects = await prisma.project.findMany({
                where: { studentId: req.user.id },
                orderBy: { submittedAt: 'desc' }
            });
            return res.json(projects);
        }
    } catch (error) {
        console.error('Fetch projects error:', error);
        res.status(500).json({ message: 'Failed to retrieve projects list.' });
    }
});

// Submit a Project
router.post('/submit', authenticateToken, async (req, res) => {
    try {
        const { title, description, githubLink, fileUrl } = req.body;
        if (!title || !description || !githubLink) {
            return res.status(400).json({ message: 'Title, description and GitHub link are required.' });
        }

        const project = await prisma.project.create({
            data: {
                studentId: req.user.id,
                title,
                description,
                githubLink,
                fileUrl,
                status: 'PENDING'
            }
        });

        // Find which enrollment this project belongs to, and update its progress
        const studentEnrollments = await prisma.enrollment.findMany({
            where: { userId: req.user.id },
            include: { course: true }
        });

        for (const enroll of studentEnrollments) {
            const assignments = enroll.course.assignments || [];
            const isMatch = assignments.some(as =>
                as.title.toLowerCase().includes(title.toLowerCase()) ||
                title.toLowerCase().includes(as.title.toLowerCase())
            );
            if (isMatch) {
                await calculateAndUpdateProgress(req.user.id, enroll.courseId);
            }
        }

        res.status(201).json(project);
    } catch (error) {
        console.error('Project submission error:', error);
        res.status(500).json({ message: 'Failed to submit project task.' });
    }
});

// ADMIN: Review and Approve/Reject Project
router.put('/review/:id', authenticateToken, async (req, res) => {
    try {
        // Verify admin role
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Requires administrator permissions.' });
        }

        const { id } = req.params;
        const { status, feedback } = req.body; // status = APPROVED or REJECTED

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: 'Status must be APPROVED or REJECTED.' });
        }

        const project = await prisma.project.update({
            where: { id },
            data: { status, feedback },
            include: { student: true }
        });

        // Check if approved: issue a Certificate
        if (status === 'APPROVED') {
            const DOMAINS_LIST = [
                { keyword: 'full stack', name: 'Full Stack Development', code: 'FS' },
                { keyword: 'python', name: 'Python Development', code: 'PY' },
                { keyword: 'java', name: 'Java Development', code: 'JV' },
                { keyword: 'mern', name: 'MERN Stack Development', code: 'ME' },
                { keyword: 'mean', name: 'MEAN Stack Development', code: 'MA' },
                { keyword: 'deep learning', name: 'Deep Learning', code: 'DL' },
                { keyword: 'computer vision', name: 'Computer Vision', code: 'CV' },
                { keyword: 'natural language', name: 'Natural Language Processing', code: 'NL' },
                { keyword: 'nlp', name: 'Natural Language Processing', code: 'NL' },
                { keyword: 'machine learning', name: 'AI & Machine Learning', code: 'AI' },
                { keyword: 'ai ', name: 'AI & Machine Learning', code: 'AI' },
                { keyword: 'data science', name: 'Data Science', code: 'DS' },
                { keyword: 'data analytics', name: 'Data Analytics', code: 'DA' },
                { keyword: 'ui/ux', name: 'UI/UX Designer', code: 'UX' },
                { keyword: 'ux design', name: 'UX Design', code: 'UXD' },
                { keyword: 'ui design', name: 'UI Design', code: 'UI' },
                { keyword: 'cyber security', name: 'Cyber Security', code: 'CS' },
                { keyword: 'frontend', name: 'Frontend Development', code: 'FE' },
                { keyword: 'backend', name: 'Backend Development', code: 'BE' },
                { keyword: 'react', name: 'React Development', code: 'RE' },
                { keyword: 'node', name: 'Node.js Development', code: 'ND' },
                { keyword: 'php', name: 'PHP Development', code: 'PH' },
                { keyword: 'django', name: 'Django Development', code: 'DJ' },
                { keyword: 'android', name: 'Android Development', code: 'AN' },
                { keyword: 'flutter', name: 'Flutter Development', code: 'FL' },
                { keyword: 'cloud computing', name: 'Cloud Computing', code: 'CC' },
                { keyword: 'devops', name: 'DevOps', code: 'DV' },
                { keyword: 'aws', name: 'AWS Cloud Development', code: 'AW' },
                { keyword: 'blockchain', name: 'Blockchain Development', code: 'BC' },
                { keyword: 'iot', name: 'IoT Development', code: 'IO' },
                { keyword: 'embedded', name: 'Embedded Systems', code: 'ES' },
                { keyword: 'software testing', name: 'Software Testing & QA', code: 'QA' },
                { keyword: 'qa', name: 'Software Testing & QA', code: 'QA' },
                { keyword: 'digital marketing', name: 'Digital Marketing', code: 'DM' },
                { keyword: 'graphic design', name: 'Graphic Design', code: 'GD' },
                { keyword: 'project management', name: 'Project Management', code: 'PM' },
                { keyword: 'database', name: 'Database Management', code: 'DB' },
                { keyword: 'sql', name: 'SQL Development', code: 'SQL' },
                { keyword: 'web development', name: 'Web Development', code: 'WD' },
                { keyword: 'web', name: 'Web Development', code: 'WD' }
            ];

            let courseName = 'Web Development';
            let categoryCode = 'WD';

            const titleLower = project.title.toLowerCase();
            const matchedDomain = DOMAINS_LIST.find(d => titleLower.includes(d.keyword));
            if (matchedDomain) {
                courseName = matchedDomain.name;
                categoryCode = matchedDomain.code;
            }

            const year = new Date().getFullYear();

            // Get count of certificates to increment
            const count = await prisma.certificate.count();
            const serial = String(count + 1).padStart(4, '0');
            const certificateNumber = `VINIX-${categoryCode}-${year}-${serial}`;

            const existingCert = await prisma.certificate.findFirst({
                where: {
                    studentId: project.studentId,
                    courseName
                }
            });

            if (!existingCert) {
                await prisma.certificate.create({
                    data: {
                        studentId: project.studentId,
                        courseName,
                        certificateNumber,
                        verificationURL: `http://localhost:5173/verify/${certificateNumber}`
                    }
                });

                // Update enrollment progress to 100% and status to COMPLETED for this course/internship
                const course = await prisma.course.findFirst({
                    where: { title: courseName }
                });

                if (course) {
                    await prisma.enrollment.upsert({
                        where: {
                            userId_courseId: {
                                userId: project.studentId,
                                courseId: course.id
                            }
                        },
                        update: {
                            progress: 100,
                            status: 'COMPLETED'
                        },
                        create: {
                            userId: project.studentId,
                            courseId: course.id,
                            progress: 100,
                            status: 'COMPLETED'
                        }
                    });
                }
            }
        }

        res.json(project);
    } catch (error) {
        console.error('Review project error:', error);
        res.status(500).json({ message: 'Failed to update review status.' });
    }
});

export default router;
