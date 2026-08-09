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
import { PORT } from './config.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/public', express.static('public'));
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
