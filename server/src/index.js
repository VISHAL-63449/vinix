import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import enrollmentRoutes from './routes/enrollments.js';
import projectRoutes from './routes/projects.js';
import certificateRoutes from './routes/certificates.js';
import offerLetterRoutes from './routes/offerLetters.js';
import aiRoutes from './routes/ai.js';
import path from 'path';
import { prisma, PORT } from './config.js';
import { generateOfferLetterPDFFile } from './utils/pdfGenerator.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/public', express.static('public'));

// Intercept static requests to offer letter PDFs to regenerate them dynamically with the latest layout/seal styles
app.use('/uploads/offer-letters/:pdfName', async (req, res, next) => {
    try {
        const { pdfName } = req.params;
        const offerLetterId = pdfName.replace('.pdf', '');

        // Find the corresponding offer letter record in database
        const letter = await prisma.offerLetter.findFirst({
            where: { offerLetterId }
        });

        if (letter) {
            const absolutePath = path.join(process.cwd(), 'uploads', 'offer-letters', pdfName);
            const letterData = {
                offerLetterId: letter.offerLetterId,
                studentId: letter.studentId,
                studentName: letter.studentName,
                studentEmail: letter.studentEmail,
                studentPhone: letter.studentPhone || 'N/A',
                studentCollege: letter.studentCollege || 'N/A',
                internshipTitle: letter.internshipTitle,
                internshipDomain: letter.internshipDomain,
                duration: letter.duration,
                startDate: letter.startDate,
                endDate: letter.endDate,
                mentorName: letter.mentorName,
                customContent: letter.customContent,
                customTerms: letter.customTerms || [],
                verificationToken: letter.verificationToken,
                issueDate: letter.issueDate,
                authPersonName: letter.authPersonName || 'Vishal R',
                authPersonRole: letter.authPersonRole || 'Founder & CEO'
            };
            // Regenerate the file on disk dynamically
            await generateOfferLetterPDFFile(absolutePath, letterData);
        }
    } catch (err) {
        console.error('Error auto-regenerating offer letter static file:', err);
    }
    next();
});

app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api', offerLetterRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Vinix Technologies API Server.',
        status: 'Running',
        version: '1.0.0'
    });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
